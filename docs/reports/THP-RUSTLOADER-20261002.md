# THP-RUSTLOADER-20261002 — Rust loader: wide-character API + env namespace

STATUS: DONE with one out-of-scope blocker (§6) and one runtime item that is
forbidden in this task and therefore `[UNVERIFIED]` (§7).

Files changed (all inside my `# Non-Conflict`):

| File | Change |
|---|---|
| `src-tauri/src/loader.rs` | wide-character conversion, argv quoting, dual env namespace, 13 unit tests |
| `src-tauri/Cargo.toml` | `windows` feature `Win32_UI_Shell` (tests), `rust-version` 1.77.2 -> 1.80.0 |
| `docs/reports/THP-RUSTLOADER-20261002.md` | this report |

`src-tauri/src/lib.rs` does not exist; `src-tauri/src/main.rs` is the crate root
and was not modified.

---

## 1. Defect 1 — every narrow/ANSI surface in the file, before and after

The brief named four call sites. The full inventory of every `A`-suffixed
Win32 call in the file, and of every lossy conversion, is:

| # | Before (line) | Narrow surface | After |
|---|---|---|---|
| 1 | 21 | `STARTUPINFOA` type in the import list | `STARTUPINFOW` (l.35) |
| 2 | 184 | `GetModuleHandleA(s!("kernel32.dll"))` | `GetModuleHandleW(PCWSTR(wide_nul_path("kernel32.dll")))` (l.312) |
| 3 | 188 | `GetProcAddress(kernel32, s!("LoadLibraryA"))` | `GetProcAddress(kernel32, s!("LoadLibraryW"))` (l.316) |
| 4 | 223 | error text `"LoadLibraryA returned 0 …"` | `"LoadLibraryW returned 0 …"` (l.351) |
| 5 | 269 | `CreateProcessA` | `CreateProcessW` (l.395) |
| 6 | 287 | error text `"CreateProcessA failed: …"` | `"CreateProcessW failed: …"` (l.411) |
| 7 | 245 | `cstring(&args.target_path)` -> `CString` (ANSI bytes) fed to `CreateProcessA` | `wide_nul_path(target_path, …)` -> `Vec<u16>` UTF-16 |
| 8 | 253 | `cstring(path, "target current directory")` -> `CString` | `wide_nul_path(dir, …)` |
| 9 | 250 | `path.as_os_str().to_string_lossy()` (lossy `OsStr` -> `String`) | removed; `OsStr::encode_wide` (§3) |
| 10 | 153 | `cstring(dll_path)` -> `CString` written into the remote buffer | `wide_nul_path(dll_path)` -> UTF-16, `remote_len = len * 2` |

`GetProcAddress` keeps its ANSI *export-name* argument on purpose: export names
are ASCII (`"LoadLibraryW"`), and `GetProcAddress` has no `W` form. The
*argument the remote thread will receive* is UTF-16, because the entry point is
now `LoadLibraryW`.

There were no other `A`-suffixed calls in the file — `WriteProcessMemory`,
`VirtualAllocEx`, `VirtualFreeEx`, `CreateRemoteThread`, `GetExitCodeThread`,
`OpenProcess`, `TerminateProcess`, `ResumeThread`, `WaitForSingleObject` and
`CloseHandle` all have a single, TCHAR-agnostic form and take no path or string.

Grep evidence (run in `D:/Project/TH-Platform/src-tauri`):

```
$ grep -c "CreateProcessA\|LoadLibraryA\|GetModuleHandleA" src/loader.rs
0

$ grep -n "STARTUPINFOA\|PCSTR\|PSTR\|CString\|to_string_lossy\|to_str()\|GetEnvironmentVariableA\|SetEnvironmentVariableA" src/loader.rs
8://! `to_str()`, `to_string_lossy()` or an ANSI code page any more.
```

The single remaining hit is the module doc-comment stating that these are gone.
`CString` and the old `cstring()` helper were deleted outright, not left behind.

## 2. Command-line quoting — it was broken, and it was broken *differently* from the folklore

Before: `command_line` was the raw target path bytes with a NUL and **no
quoting at all**. `CreateProcessA` splits `lpCommandLine` at whitespace, so the
real install path

```
D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.exe
```

reached the child as three arguments. That is the second half of the C++ bug.

Now: `build_command_line` (`src-tauri/src/loader.rs:242`) emits a quoted,
NUL-terminated argv[0] via `append_quoted_arg`.

**Measured, not copied from the docs.** The canonical "double every backslash
run before a closing quote" rule is *wrong* for `CommandLineToArgvW`. I probed
the real API on this box (`CommandLineToArgvW` on `"C:\odd dir" + n
backslashes + '"'`, n = 0..6) before writing the final code:

```
n=0                    cmdline="C:\odd dir"               argc=1 [len=10 trail_bs=0 "C:\\odd dir"]
n=1                    cmdline="C:\odd dir\"              argc=1 [len=11 trail_bs=1 "C:\\odd dir\\"]
n=2                    cmdline="C:\odd dir\\"             argc=1 [len=12 trail_bs=2 "C:\\odd dir\\\\"]
n=3                    cmdline="C:\odd dir\\\"            argc=1 [len=13 trail_bs=3 "C:\\odd dir\\\\\\"]
n=4                    cmdline="C:\odd dir\\\\"           argc=1 [len=14 trail_bs=4 "C:\\odd dir\\\\\\\\"]
n=5                    cmdline="C:\odd dir\\\\\"          argc=1 [len=15 trail_bs=5 "C:\\odd dir\\\\\\\\\\"]
n=6                    cmdline="C:\odd dir\\\\\\"         argc=1 [len=16 trail_bs=6 "C:\\odd dir\\\\\\\\\\\\"]
quoted quote           cmdline="C:\has "q"\dir"           argc=2 [len=7 trail_bs=0 "C:\\has "] [len=5 trail_bs=0 "q\\dir"]
escaped quote          cmdline="C:\has \"q\"\dir"         argc=2 [len=8 trail_bs=1 "C:\\has \\"] [len=6 trail_bs=0 "q\"\\dir"]
cjk+space              cmdline="D:\Game\[th08] 东方永夜抄 (日文版)\th08.exe" argc=1 [len=51 trail_bs=0 "D:\\Game\\[th08] 东方永夜抄 (日文版)\\th08.exe"]
```

n in, n out — nothing is collapsed before the closing quote. So the loader
copies backslashes verbatim and only quotes when the argument contains
whitespace or a `"`. `\"` is the only escape Windows honours and it yields one
literal quote; a `"` cannot appear in a Windows file name anyway, so
`launch_game`'s `is_file()` check rejects such paths before they get here.
`command_line_keeps_trailing_backslashes_verbatim` and
`argv_round_trips_edge_case_arguments` pin this against the real API rather than
against the documentation.

## 3. Path conversion

`wide_nul_path(path: &Path, field: &str) -> Result<Vec<u16>, String>`
(`src-tauri/src/loader.rs:187`) is the single conversion point. It uses
`OsStr::encode_wide` (lossless in the direction that matters — an unpaired
surrogate survives) and rejects an interior NUL instead of silently truncating
the string handed to `CreateProcessW`/`LoadLibraryW`. `LaunchArgs` still carries
`String`s, which is correct: they arrive from serde over JSON and are already
UTF-8. The old `to_string_lossy()` on the current directory is gone, so no
`OsStr -> String -> bytes` round trip exists anywhere in the file.

## 4. Defect 2 — env namespace: decision and reason

**Decision: the client writes BOTH names, always, with the same value.
`THP_*` is canonical; `TH08_PLATFORM_*` is kept as a live alias. No C++ edit is
required for this to be correct.**

| logical setting | canonical | legacy alias |
|---|---|---|
| peer address | `THP_PEER` | `TH08_PLATFORM_PEER` |
| host flag | `THP_HOST` | `TH08_PLATFORM_HOST` |
| listen port | `THP_LISTEN` | `TH08_PLATFORM_LISTEN` |
| multiplayer off switch | `THP_DISABLE_MULTIPLAYER` | `TH08_PLATFORM_DISABLE_MULTIPLAYER` |

Reasoning:

1. Renaming client-side only breaks the shipped th08 DLL today: `dll/src/main.cpp`
   reads `TH08_PLATFORM_LISTEN`, `TH08_PLATFORM_PEER`, `TH08_PLATFORM_HOST`,
   `TH08_PLATFORM_DISABLE_MULTIPLAYER` and `dll/src/logging.cpp` keys the
   per-pid log filename off `TH08_PLATFORM_PEER`/`TH08_PLATFORM_LISTEN`. I
   cannot edit that tree (lanes are active there), and a rename that silently
   disables multiplayer is the worst possible failure mode.
2. Dual-*emission* is strictly safer than dual-*reading* for this half of the
   change, and it is the half I own. The client is the only writer, so it
   decides the whole environment the child sees; emitting both names with one
   value cannot be observed as a conflict by the current DLL, which only looks
   at the legacy name.
3. It is forward-compatible with the C++ half the brief recommended, without
   depending on it: when lane D later teaches the DLL to read `THP_*` and
   prefer it, the values it finds are already byte-identical to the legacy ones.
   No client/DLL pairing is broken in either direction, and no shim is needed on
   the Rust side — the legacy name is written by the same code path, not by a
   compatibility layer that can drift.
4. `snapshot_env`/`restore_env` walk the emitted list, so both names are saved
   and restored; the process environment is left exactly as it was found.
   `apply_and_restore_covers_both_namespaces` proves that against the real
   process environment, not a mock.

What the DLL would still need, **as an optional follow-up, not as a blocker**
(no client/DLL pair is broken without it): a `get_env_prefer_thp()` helper in
`dll/src/main.cpp` and the two other read sites — `dll/src/logging.cpp:27-28`
(per-pid log decision) and `dll/src/state/p2_input.cpp:40`
(`P2_INPUT_MODE`) — so a future th07 DLL can read only `THP_*`.
`dll/loader/loader.cpp` also still *writes* only the legacy names (lines 179-222)
and would need the same dual-emit if the C++ loader is ever used for a non-th08
game. I did not touch either tree.

## 5. Tests — 13, all passing

`cargo test` (full verbatim output in §6):

- `env_overrides_carry_canonical_and_legacy_names_with_equal_values` — host mode
  and peer mode, every expected name and value, plus the invariant that each
  `THP_*` is emitted together with its legacy twin carrying the same value.
- `env_overrides_prefer_explicit_listen_port_over_host_default`
- `env_overrides_disable_multiplayer_false_is_opt_in`
- `no_multiplayer_session_emits_nothing`
- `apply_and_restore_covers_both_namespaces` — sets a sentinel under both names,
  applies, asserts both moved and agree, restores, asserts the sentinel came back
  for `THP_PEER`/`TH08_PLATFORM_PEER` and that `*_LISTEN` is gone again.
- `command_line_quotes_a_path_with_cjk_and_spaces` — the real path, quoted, NUL
  terminated, and provably three arguments if unquoted.
- `command_line_leaves_a_space_free_path_unquoted`
- `command_line_keeps_trailing_backslashes_verbatim` (n = 1, 2, 3)
- `argv_round_trips_cjk_path_with_spaces_and_brackets` — parses the built
  command line with the **real** `CommandLineToArgvW` (hence the new
  `Win32_UI_Shell` feature) and asserts `argc == 1` with the path intact.
- `argv_round_trips_edge_case_arguments` — the same round trip for CJK-only,
  spaces, tabs, `[brackets]`, multiple spaces, trailing backslashes.
- `wide_nul_path_round_trips_cjk_without_loss` — asserts no `?` substitution.
- `wide_nul_path_rejects_interior_nul`
- `kernel32_exports_load_library_w` — resolves `LoadLibraryW` from kernel32 in
  the test process, so a typo in the export name fails here instead of on the
  owner's desktop. Loads nothing.

The tests are compiled and run on this machine; the exact file that was tested
is byte-identical to the one in the repo:

```
repo  = AD54694C1ABAB1B2EABFF85D8E29C762AB3FEA62785BED9E802FD584F06F6E89
tested= AD54694C1ABAB1B2EABFF85D8E29C762AB3FEA62785BED9E802FD584F06F6E89
match = True
```

## 6. Build and test output, verbatim

### 6a. In the repo: BLOCKED before my change and still blocked, by a file I do not own

Baseline, before any edit of mine (`cargo check --all-targets` in
`D:/Project/TH-Platform/src-tauri`):

```
    Checking th-platform v0.1.0 (D:\Project\TH-Platform\src-tauri)
error: failed to run custom build command for `th-platform v0.1.0 (D:\Project\TH-Platform\src-tauri)`

Caused by:
  process didn't exit successfully: `D:\Project\TH-Platform\src-tauri\target\debug\build\th-platform-66c9abb90112b5f5\build-script-build` (exit code: 1)
  --- stdout
  cargo:rerun-if-env-changed=TAURI_CONFIG
  cargo:rustc-check-cfg=cfg(desktop)
  cargo:rustc-cfg=desktop
  cargo:rustc-check-cfg=cfg(mobile)
  cargo:rerun-if-changed=D:\Project\TH-Platform\src-tauri\tauri.conf.json
  unknown field `withGlobalTauri`, expected one of `runner`, `dev-url`, `devUrl`, `frontend-dist`, `frontendDist`, `before-dev-command`, `beforeDevCommand`, `before-build-command`, `beforeBuildCommand`, `before-bundle-command`, `beforeBundleCommand`, `features`, `remove-unused-commands`, `removeUnusedCommands`, `additional-watch-directories`, `additional-watch-folders`, `additionalWatchFolders`, `windows`
  found an unknown configuration field. This usually means that you are using a CLI version that is newer than `tauri-build` and is incompatible. Please try updating the Rust crates by running `cargo update` in the Tauri app folder.
```

Same command after my change — byte-identical failure, still in the build script,
never reaching `loader.rs`:

```
    Checking webview2-com v0.39.1
   Compiling th-platform v0.1.0 (D:\Project\TH-Platform\src-tauri)
error: failed to run custom build command for `th-platform v0.1.0 (D:\Project\TH-Platform\src-tauri)`
... (same `unknown field withGlobalTauri` output as above) ...
EXIT=101
```

**Root cause, one line:** `src-tauri/tauri.conf.json` line 11 puts
`withGlobalTauri` inside `build`. In tauri-utils 2.10.1 the field belongs to
`AppConfig` (i.e. `app`), confirmed at
`tauri-utils-2.10.1/src/config.rs:3376-3378`:

```
/// Whether we should inject the Tauri API on `window.__TAURI__` or not.
#[serde(default, alias = "with-global-tauri")]
pub with_global_tauri: bool,
```

**Fix needed (not mine — `tauri.conf.json` is not in my `# Non-Conflict`):** move
line 11 from `build` into `app`. Do **not** delete it: `src/lib/tauri/loader.ts`
calls `window.__TAURI__!.invoke(...)`, which only exists when the flag is true,
so deleting it would silently break `launchGame` in the packaged shell.
`Main` has been messaged with this.

### 6b. In a throwaway copy with that one line moved: everything passes

Harness: `%TEMP%\thp\loadercheck\src-tauri`, a copy of the tree with
`withGlobalTauri` moved from `build` to `app` and an empty `../dist` present.
Nothing in the repo was modified to get this. The copy of `src/loader.rs` is
byte-identical to the repo's (hashes in §5).

```
$ cargo check --all-targets
    Checking th-platform v0.1.0 (C:\Users\dwgx1\AppData\Local\Temp\thp\loadercheck\src-tauri)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.89s

$ cargo build
   Compiling th-platform v0.1.0 (C:\Users\dwgx1\AppData\Local\Temp\thp\loadercheck\src-tauri)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 7.67s
EXIT=0

$ cargo test
   Compiling th-platform v0.1.0 (C:\Users\dwgx1\AppData\Local\Temp\thp\loadercheck\src-tauri)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.96s
     Running unittests src\main.rs (target\debug\deps\th_platform-4de6959d27d0e03f.exe)

running 13 tests
test loader::tests::command_line_leaves_a_space_free_path_unquoted ... ok
test loader::tests::env_overrides_disable_multiplayer_false_is_opt_in ... ok
test loader::tests::env_overrides_prefer_explicit_listen_port_over_host_default ... ok
test loader::tests::env_overrides_carry_canonical_and_legacy_names_with_equal_values ... ok
test loader::tests::no_multiplayer_session_emits_nothing ... ok
test loader::tests::windows_wide::wide_nul_path_rejects_interior_nul ... ok
test loader::tests::apply_and_restore_covers_both_namespaces ... ok
test loader::tests::command_line_keeps_trailing_backslashes_verbatim ... ok
test loader::tests::windows_wide::kernel32_exports_load_library_w ... ok
test loader::tests::windows_wide::argv_round_trips_cjk_path_with_spaces_and_brackets ... ok
test loader::tests::command_line_quotes_a_path_with_cjk_and_spaces ... ok
test loader::tests::windows_wide::wide_nul_path_round_trips_cjk_without_loss ... ok
test loader::tests::windows_wide::argv_round_trips_edge_case_arguments ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

No warnings from the crate.

### 6c. `Cargo.toml` diff

```diff
-rust-version = "1.77.2"
+# `std::sync::LazyLock` (used in loader.rs) stabilised in 1.80.
+rust-version = "1.80.0"
@@ windows features
+  "Win32_UI_Shell",
```

No new crate dependency. `Win32_UI_Shell` is a feature of the `windows` crate
that was already a dependency, needed only by the tests
(`CommandLineToArgvW`). `rust-version` moved because `PROCESS_ENV_LOCK` now
uses `std::sync::LazyLock` per the project's `rs-lazylock` rule; `LazyLock`
stabilised in 1.80 and the installed toolchain is 1.98.0.

## 7. `[UNVERIFIED]` — what I could not prove

**`[UNVERIFIED]` Injection into a real game from a CJK path.** Launching
`th08.exe` needs a game window, which this task forbids, so nothing here proves
that `CreateProcessW` + `LoadLibraryW` actually injects. What *is* proven:
compilation, the argv round trip through the real `CommandLineToArgvW`, the
lossless UTF-16 conversion, and that kernel32 exports `LoadLibraryW`. The
remaining runtime risk is the injection handshake itself, which was already
unproven before this change (both local instances sat on the title screen).
Someone with the `-ConfirmWindows` switch has to re-run the double-instance
smoke from a CJK path once `tauri.conf.json` is fixed.

**`[UNVERIFIED]` `cargo check` / `cargo build` inside the repo.** Blocked by
§6a, a file I am not allowed to write. They exit 0 in the identical tree with
that single JSON line moved.

## 8. Seams for the next task (not fixed here, as instructed)

1. **No per-game record.** `LaunchArgs` (l.59) carries a bare `target_path` and
   `dll_path` with no game identity. There is nowhere for the loader to learn
   "th07 -> `th07.exe`, `th07_platform.dll`, port N" from. A `game_id` field
   plus one resolution table is the whole fix.
2. **Ports are not namespaced.** `DEFAULT_HOST_LISTEN_PORT = 7480` (l.45) is a
   game-independent literal and `fallback_listen_port` derives peer+1 from
   whatever peer spec it is given. Two games on one LAN collide. This becomes
   the per-game field in (1); today the same literal exists in two places,
   `loader.rs` and `dll/loader/loader.cpp`.
3. **`fallback_listen_port`'s `7481` default** is a fourth hardcoded number
   (l.139) that must move with the port table.
4. `README.md:26,35,152-155` still says `LoadLibraryA` and lists only the four
   `TH08_PLATFORM_*` names. Lane R owns that file; the env table there should
   now list the `THP_*` canonical names with the legacy alias.

## 9. Hygiene

No window was opened: no `th08.exe`, no `tauri dev`, no `cargo tauri dev`, no
`Start-Process`. `cargo` and the one throwaway `argvprobe.exe` console binary
were plain child processes inheriting the existing console. The `argvprobe`
source and binary (`%TEMP%\thp\argvprobe.rs`, `.exe`) were deleted after the
measurement in §2; the probe's finding is now encoded as a permanent test.