// TS wrapper for Rust Tauri commands defined at src-tauri/src/loader.rs.
// When the app runs inside Tauri, window.__TAURI__ is injected (via withGlobalTauri).
// In dev (plain `npm run dev`), Tauri is absent — calls return informative errors.

export interface LaunchArgs {
  /** Absolute path to the game's main exe (e.g. C:\games\th08\th08.exe) */
  targetPath: string;
  /** Absolute path to the th08_platform.dll the loader will inject */
  dllPath: string;
  /** Whether this peer is the lobby host */
  hostMode: boolean;
  /** Listen port; defaults to 7480 (host) or peerPort+1 (peer) when omitted */
  listenPort?: number;
  /** Peer address as 'ip:port'; required for peer (non-host) mode */
  peerAddr?: string;
  /**
   * Override TH08_PLATFORM_DISABLE_MULTIPLAYER. Default behavior matches the
   * legacy C++ loader: when host or peer is set and user has not exported the
   * env var, default to disabled (Phase 6 net mode only). Pass `false` to keep
   * Phase 5 in-process 2P hooks active alongside networking.
   */
  disableMultiplayer?: boolean;
}

export interface LaunchResult {
  pid: number;
  /** LoadLibraryA return value (the loaded module's HMODULE) */
  dllHandle: number;
}

declare global {
  interface Window {
    __TAURI__?: {
      invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
    };
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI__;
}

function notInTauriError(): Error {
  return new Error(
    'Not running inside Tauri — game injection requires the desktop shell. ' +
      'Run `npm run tauri:dev` instead of `npm run dev`.',
  );
}

export async function launchGame(args: LaunchArgs): Promise<LaunchResult> {
  if (!isTauri()) throw notInTauriError();
  return window.__TAURI__!.invoke<LaunchResult>('launch_game', { args });
}

export async function terminateGame(pid: number): Promise<void> {
  if (!isTauri()) throw notInTauriError();
  await window.__TAURI__!.invoke('terminate_game', { pid });
}
