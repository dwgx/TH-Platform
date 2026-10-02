/// <reference types="vite/client" />

// Env contract for the API client. Every field is optional: the defaults live in
// src/lib/api/client.ts so the app runs with no .env file at all.
interface ImportMetaEnv {
  /** Backend origin, e.g. http://127.0.0.1:8080. Default http://127.0.0.1:8080. */
  readonly VITE_API_BASE_URL?: string;
  /** Identity header value. Default "local" (no auth this round). */
  readonly VITE_HANDLE?: string;
  /** "1"/"true" serves mock.ts instead of HTTP. Default off — real client wins. */
  readonly VITE_API_USE_MOCK?: string;
  /**
   * Absolute path to the game's main exe, e.g.
   * D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.exe. Consumed by
   * src/lib/tauri/launch.ts, which refuses to launch without it rather than
   * guessing an install location.
   */
  readonly VITE_GAME_PATH_TH08?: string;
  /**
   * Absolute path to the th08_platform DLL the loader injects. Same consumer,
   * same rule: no path, no launch.
   */
  readonly VITE_DLL_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}