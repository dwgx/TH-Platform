// Turning a room into a launched game.
//
// This is the seam that did not exist. `loader.ts` has understood a peer
// address since it was written, and the server has an endpoint to give out
// (see `RoomEndpoint` in ./api/types), but nothing connected the two, so
// `launchGame` had zero callers and a match could not be started from the
// product at all.
//
// The decision this module makes, and nothing else decides it here:
//   - the local user is the host when the seat at index 1 is their own handle
//     (the room page already renders idx 1 as the host seat, so this is the
//     same rule the UI shows);
//   - a host binds its own port and is told nothing about a peer;
//   - everyone else is handed the host's `ip:port` as `peerAddr`, and the
//     loader picks their own listen port from it.
//
// The two paths (th08.exe, the DLL) are deployment facts about this machine,
// not per-room data, so they are configuration rather than arguments. They come
// from the same Vite env contract client.ts already uses.

import { peerAddr, type Room, type Seat } from '../api/types';
import { isTauri, launchGame, type LaunchArgs, type LaunchResult } from './loader';

/**
 * The game executables and the platform DLL, per GameId. A missing entry is a
 * real, reported error rather than a guess: picking the wrong .exe would start
 * the wrong game.
 */
const GAME_PATHS: Record<string, { target: string; dll: string }> = {
  th08: {
    target: import.meta.env.VITE_GAME_PATH_TH08 ?? '',
    dll: import.meta.env.VITE_DLL_PATH ?? '',
  },
};

/** Why a launch did not happen. Every message is written for the player. */
export class LaunchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LaunchError';
  }
}

/**
 * The identity this client asserts. Mirrors client.ts's X-Handle default, so
 * "am I the host" is answered with the same handle the server was told about.
 */
const HANDLE = import.meta.env.VITE_HANDLE ?? 'local';

/**
 * Whether the local user holds the room's host seat. Seats are ordered by
 * index and index 1 is the host; the room page draws the crown on exactly that
 * seat.
 */
export function isHostSeat(seats: Seat[]): boolean {
  return seats.some((seat) => seat.idx === 1 && seat.handle === HANDLE);
}

/** The `LaunchArgs` for a room, or the reason there are none. */
export function roomLaunchArgs(room: Room, seats: Seat[]): LaunchArgs {
  const paths = GAME_PATHS[room.gameId];
  if (!paths) throw new LaunchError(`还没有 ${room.gameId} 的游戏路径配置。`);
  if (!paths.target) throw new LaunchError(`${room.gameId} 的游戏路径没有配置，无法启动。`);
  if (!paths.dll) throw new LaunchError('联机模块 DLL 路径没有配置，无法启动。');

  const endpoint = room.endpoint;
  if (!endpoint?.addr) {
    throw new LaunchError('这个房间还没有公布主机地址，等房主开始游戏后再试。');
  }

  const addr = peerAddr(endpoint);

  // A host needs no peer address and must not be sent one: the loader turns a
  // peer address into THP_PEER, which would point the host at itself.
  if (isHostSeat(seats)) {
    return { targetPath: paths.target, dllPath: paths.dll, hostMode: true, listenPort: endpoint.port };
  }

  return { targetPath: paths.target, dllPath: paths.dll, hostMode: false, peerAddr: addr };
}

/**
 * Starts the game for a room. Rejects with a LaunchError carrying a message
 * meant for the player, so a caller only has to surface it.
 */
export async function launchRoomGame(room: Room, seats: Seat[]): Promise<LaunchResult> {
  if (!isTauri()) {
    throw new LaunchError('需要桌面版客户端才能启动游戏（npm run tauri:dev）。');
  }
  return launchGame(roomLaunchArgs(room, seats));
}
