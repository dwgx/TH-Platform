// Resolving a shared room card to a room you can actually open.
//
// A `RoomShareEmbed` (the thing a chat message carries — title, host, region,
// ping, difficulty, seats) has no room id. Four call sites used to bridge that
// gap by hardcoding `id: 1`, so "立即加入" on the lobby share, on a room
// message, and on a group message all opened room #1 whether or not the shared
// room was room #1. Nothing threw; the button simply took you somewhere else.
//
// There is no id to read, so the honest resolution is to match the embed
// against the room list the server actually returned, on the two fields that
// identify a room to a human: title and host. A hit opens that room. A miss
// says the shared room is no longer listed instead of opening a wrong one.

import type { Room, RoomShareEmbed } from './api/types';

/** The room a share card points at, or null when it is not in the list. */
export function resolveSharedRoom(share: RoomShareEmbed, rooms: Room[]): Room | null {
  const title = share.title.trim();
  const host = share.host.trim();
  if (!title || !host) return null;
  return (
    rooms.find((r) => r.title.trim() === title && r.host.trim() === host) ?? null
  );
}

/** What the user is told when a shared room cannot be opened. */
export const SHARED_ROOM_MISSING =
  '这张分享卡指向的房间已经不在服务器的房间列表里了。请从大厅重新选一间。';
