//! Windows game launcher: spawn the game suspended, inject the platform DLL,
//! resume.
//!
//! Every Win32 entry point used here is the wide (`W`) flavour. This machine's
//! ANSI code page is 1252, so a Japanese or Chinese install path arrives as
//! `?????` through the `A` entry points and the launch fails; the same class of
//! bug the C++ loader had. Nothing in this file converts a path through
//! `to_str()`, `to_string_lossy()` or an ANSI code page any more.

use serde::{Deserialize, Serialize};
use std::{
    env,
    ffi::{c_void, OsString},
    path::Path,
    sync::{LazyLock, Mutex},
};

#[cfg(windows)]
use std::os::windows::ffi::OsStrExt;

#[cfg(windows)]
use windows::{
    core::{s, Error, PCWSTR, PWSTR},
    Win32::{
        Foundation::{CloseHandle, HANDLE, WAIT_FAILED, WAIT_OBJECT_0},
        System::{
            Diagnostics::Debug::WriteProcessMemory,
            LibraryLoader::{GetModuleHandleW, GetProcAddress},
            Memory::{
                VirtualAllocEx, VirtualFreeEx, MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_READWRITE,
            },
            Threading::{
                CreateProcessW, CreateRemoteThread, GetExitCodeThread, OpenProcess, ResumeThread,
                TerminateProcess, WaitForSingleObject, CREATE_SUSPENDED, INFINITE,
                PROCESS_INFORMATION, PROCESS_TERMINATE, STARTUPINFOW,
            },
        },
    },
};

/// Resolved through `GetModuleHandleW`/`GetProcAddress` before injection.
const KERNEL32_DLL: &str = "kernel32.dll";

/// Default UDP listen port for the host peer.
///
/// SEAM (not fixed here, next task): this is a game-independent literal, so two
/// games launched from one client collide on the same port. It belongs in the
/// per-game record described on [`LaunchArgs`].
const DEFAULT_HOST_LISTEN_PORT: u16 = 7480;

/// The multiplayer settings this client hands to the DLL.
///
/// SEAM (not fixed here, next task): there is no per-game record. `target_path`
/// and `dll_path` are caller-supplied strings with no game identity attached,
/// so the loader cannot resolve `th06.exe` -> its DLL -> its port by itself. Add
/// a game id to these arguments, then resolve all three from one table.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchArgs {
    target_path: String,
    dll_path: String,
    host_mode: bool,
    listen_port: Option<u16>,
    peer_addr: Option<String>,
    disable_multiplayer: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchResult {
    pid: u32,
    dll_handle: u64,
}

/// Serialises the mutate/restore of this process's environment around
/// `CreateProcessW`, which inherits the caller's environment block.
static PROCESS_ENV_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// One logical multiplayer setting, carried under two names.
///
/// The canonical name is the widened `THP_*` namespace, so one client can drive
/// th06/th07/th08 without the env namespace being part of what makes a game "a
/// game". The legacy `TH08_PLATFORM_*` name is the one the shipped th08 DLL
/// actually reads, so it is written too, with the same value. Both are always
/// written: a DLL that prefers `THP_*` and a DLL that only knows
/// `TH08_PLATFORM_*` therefore read the same bytes, and no client/DLL pairing
/// can be broken by this rename. `TH08_PLATFORM_P2_INPUT_MODE` has no slot here
/// because the client never sets it; `dll/loader/loader.cpp` does.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum EnvSlot {
    Peer,
    Host,
    Listen,
    DisableMultiplayer,
}

impl EnvSlot {
    /// `(canonical, legacy)`, in the order they are written to the child.
    const fn names(self) -> (&'static str, &'static str) {
        match self {
            Self::Peer => ("THP_PEER", "TH08_PLATFORM_PEER"),
            Self::Host => ("THP_HOST", "TH08_PLATFORM_HOST"),
            Self::Listen => ("THP_LISTEN", "TH08_PLATFORM_LISTEN"),
            Self::DisableMultiplayer => ("THP_DISABLE_MULTIPLAYER", "TH08_PLATFORM_DISABLE_MULTIPLAYER"),
        }
    }
}

fn fallback_listen_port(peer_addr: &str) -> String {
    if let Some((_, port)) = peer_addr.rsplit_once(':') {
        if let Ok(peer_port) = port.parse::<u16>() {
            if peer_port > 0 && peer_port < u16::MAX {
                return (peer_port + 1).to_string();
            }
        }
    }

    "7481".to_string()
}

fn push_env_slot(vars: &mut Vec<(&'static str, String)>, slot: EnvSlot, value: String) {
    let (canonical, legacy) = slot.names();
    vars.push((canonical, value.clone()));
    vars.push((legacy, value));
}

fn build_env_overrides(args: &LaunchArgs) -> Vec<(&'static str, String)> {
    let mut vars = Vec::new();

    if let Some(peer_addr) = &args.peer_addr {
        push_env_slot(&mut vars, EnvSlot::Peer, peer_addr.clone());
    }

    if args.host_mode {
        push_env_slot(&mut vars, EnvSlot::Host, "1".to_string());
    }

    if let Some(listen_port) = args.listen_port {
        push_env_slot(&mut vars, EnvSlot::Listen, listen_port.to_string());
    } else if args.host_mode {
        push_env_slot(&mut vars, EnvSlot::Listen, DEFAULT_HOST_LISTEN_PORT.to_string());
    } else if let Some(peer_addr) = &args.peer_addr {
        push_env_slot(&mut vars, EnvSlot::Listen, fallback_listen_port(peer_addr));
    }

    if args.host_mode || args.peer_addr.is_some() {
        let disable = match args.disable_multiplayer {
            Some(false) => "0",
            Some(true) | None => "1",
        };
        push_env_slot(&mut vars, EnvSlot::DisableMultiplayer, disable.to_string());
    }

    vars
}

fn snapshot_env(overrides: &[(&'static str, String)]) -> Vec<(&'static str, Option<OsString>)> {
    overrides
        .iter()
        .map(|(name, _)| (*name, env::var_os(name)))
        .collect()
}

fn apply_env_overrides(overrides: &[(&'static str, String)]) {
    for (name, value) in overrides {
        env::set_var(name, value);
    }
}

fn restore_env(snapshot: Vec<(&'static str, Option<OsString>)>) {
    for (name, value) in snapshot {
        if let Some(value) = value {
            env::set_var(name, value);
        } else {
            env::remove_var(name);
        }
    }
}

/// NUL-terminated UTF-16 copy of `path`.
///
/// `OsStr::encode_wide` is the lossless direction: an unpaired surrogate in an
/// `OsString` survives, and a CJK path is never re-encoded through ACP. The
/// interior-NUL check is what keeps a crafted path from truncating the string
/// the loader hands to `CreateProcessW`/`LoadLibraryW`.
#[cfg(windows)]
fn wide_nul_path(path: &Path, field: &str) -> Result<Vec<u16>, String> {
    let units: Vec<u16> = path.as_os_str().encode_wide().collect();
    if units.contains(&0) {
        return Err(format!("{field} contains an interior NUL byte"));
    }

    let mut wide = Vec::with_capacity(units.len() + 1);
    wide.extend_from_slice(&units);
    wide.push(0);
    Ok(wide)
}

/// Append one argument to `out` in the form the real Windows parser
/// (`CommandLineToArgvW`, and the same rules in the child's CRT) splits on: the
/// whole thing inside one pair of quotes, with an embedded `"` written as `\"`.
///
/// This is the half of the C++ bug that bit in practice.
/// `D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.exe` unquoted is three
/// arguments, and the child launches the wrong thing or nothing.
///
/// Backslashes are copied verbatim, including a run immediately before the
/// closing quote. The documented "2n backslashes collapse to n" rule does not
/// apply there: measured on this machine, `CommandLineToArgvW` returns n in, n
/// out for n = 1..6. Doubling them (as the old CRT folklore says) would corrupt
/// the path. `argv_round_trips_*` pins this against the real API rather than
/// against the documentation.
fn append_quoted_arg(out: &mut Vec<u16>, arg: &str) {
    const BACKSLASH: u16 = b'\\' as u16;
    const QUOTE: u16 = b'"' as u16;

    if !arg.is_empty() && !arg.contains([' ', '\t', '\n', '\u{b}', '"']) {
        out.extend(arg.encode_utf16());
        return;
    }

    out.push(QUOTE);
    for ch in arg.chars() {
        if ch == '"' {
            // `\"` is the only escape Windows honours and it yields one literal
            // quote. A `"` cannot occur in a Windows file name, so in practice
            // `launch_game`'s `is_file` check rejects such a path first.
            out.push(BACKSLASH);
            out.push(QUOTE);
            continue;
        }
        // `char::encode_utf16` fills a caller-provided buffer; two units is the
        // maximum a single `char` needs.
        let mut units = [0u16; 2];
        out.extend_from_slice(ch.encode_utf16(&mut units));
    }
    out.push(QUOTE);
}

/// The `lpCommandLine` handed to `CreateProcessW`: a correctly quoted argv[0],
/// NUL-terminated.
fn build_command_line(argv0: &str) -> Vec<u16> {
    let mut line = Vec::with_capacity(argv0.len() * 2 + 3);
    append_quoted_arg(&mut line, argv0);
    line.push(0);
    line
}

#[cfg(windows)]
fn win32_message(context: &str) -> String {
    format!("{context} failed: {}", Error::from_win32())
}

#[cfg(windows)]
struct HandleGuard(HANDLE);

#[cfg(windows)]
impl HandleGuard {
    fn new(handle: HANDLE) -> Self {
        Self(handle)
    }

    fn raw(&self) -> HANDLE {
        self.0
    }
}

#[cfg(windows)]
impl Drop for HandleGuard {
    fn drop(&mut self) {
        if !self.0.is_invalid() {
            // SAFETY: This guard owns the handle and closes it exactly once on drop.
            let _ = unsafe { CloseHandle(self.0) };
        }
    }
}

#[cfg(windows)]
fn inject_dll(process: HANDLE, dll_path: &Path) -> Result<u64, String> {
    let dll_wide = wide_nul_path(dll_path, "dll_path")?;
    let remote_len = dll_wide.len() * std::mem::size_of::<u16>();

    // SAFETY: The target process handle is valid here and we request a writable buffer sized for the DLL path string.
    let remote = unsafe {
        VirtualAllocEx(
            process,
            None,
            remote_len,
            MEM_COMMIT | MEM_RESERVE,
            PAGE_READWRITE,
        )
    };
    if remote.is_null() {
        return Err(win32_message("VirtualAllocEx"));
    }

    let injection_result = (|| -> Result<u64, String> {
        // SAFETY: `remote` points to memory we just allocated in the child process, and the source buffer is valid for `remote_len` bytes.
        unsafe {
            WriteProcessMemory(
                process,
                remote,
                dll_wide.as_ptr() as *const c_void,
                remote_len,
                None,
            )
        }
        .map_err(|err| format!("WriteProcessMemory failed: {err}"))?;

        // SAFETY: Reading the current process's kernel32 handle is required to resolve LoadLibraryW before creating the remote thread.
        let kernel32_name = wide_nul_path(Path::new(KERNEL32_DLL), "kernel32.dll")?;
        let kernel32 = unsafe { GetModuleHandleW(PCWSTR(kernel32_name.as_ptr())) }
            .map_err(|err| format!("GetModuleHandleW failed: {err}"))?;

        // SAFETY: We query the address of LoadLibraryW from kernel32 for the classic remote-thread injection entry point. The export name is ASCII, so an ANSI `GetProcAddress` call is correct here even though the argument it will receive is UTF-16.
        let load_library = unsafe { GetProcAddress(kernel32, s!("LoadLibraryW")) }
            .ok_or_else(|| win32_message("GetProcAddress"))?;

        // SAFETY: LoadLibraryW matches the thread entry ABI expected by CreateRemoteThread for this injection pattern.
        let start_routine = unsafe {
            Some(std::mem::transmute::<
                unsafe extern "system" fn() -> isize,
                unsafe extern "system" fn(*mut c_void) -> u32,
            >(load_library))
        };

        // SAFETY: The target process is suspended and `remote` points to the DLL path buffer inside that process.
        let thread =
            unsafe { CreateRemoteThread(process, None, 0, start_routine, Some(remote), 0, None) }
                .map_err(|err| format!("CreateRemoteThread failed: {err}"))?;
        let thread = HandleGuard::new(thread);

        // SAFETY: Waiting on the thread handle is valid until the guard closes it.
        let wait_result = unsafe { WaitForSingleObject(thread.raw(), INFINITE) };
        if wait_result == WAIT_FAILED {
            return Err(win32_message("WaitForSingleObject"));
        }
        if wait_result != WAIT_OBJECT_0 {
            return Err(format!(
                "WaitForSingleObject failed: unexpected wait result {}",
                wait_result.0
            ));
        }

        let mut exit_code = 0u32;
        // SAFETY: The remote thread has finished, so reading its exit code is valid.
        unsafe { GetExitCodeThread(thread.raw(), &mut exit_code) }
            .map_err(|err| format!("GetExitCodeThread failed: {err}"))?;

        if exit_code == 0 {
            return Err("LoadLibraryW returned 0 - DLL failed to load".to_string());
        }

        Ok(u64::from(exit_code))
    })();

    // SAFETY: `remote` came from VirtualAllocEx in this process and may be released once the remote thread has consumed the DLL path.
    let _ = unsafe { VirtualFreeEx(process, remote, 0, MEM_RELEASE) };

    injection_result
}

#[cfg(windows)]
#[tauri::command]
pub fn launch_game(args: LaunchArgs) -> Result<LaunchResult, String> {
    let target_path = Path::new(&args.target_path);
    if !target_path.is_file() {
        return Err(format!("target not found: {}", args.target_path));
    }
    let dll_path = Path::new(&args.dll_path);
    if !dll_path.is_file() {
        return Err(format!("dll not found: {}", args.dll_path));
    }

    let target_wide = wide_nul_path(target_path, "target_path")?;
    let mut command_line = build_command_line(&args.target_path);
    let current_dir = target_path
        .parent()
        .map(|dir| wide_nul_path(dir, "target current directory"))
        .transpose()?;

    let overrides = build_env_overrides(&args);
    let _env_guard = PROCESS_ENV_LOCK
        .lock()
        .map_err(|_| "process environment lock poisoned".to_string())?;
    let snapshot = snapshot_env(&overrides);
    apply_env_overrides(&overrides);

    let mut startup_info = STARTUPINFOW::default();
    startup_info.cb = std::mem::size_of::<STARTUPINFOW>() as u32;
    let mut process_info = PROCESS_INFORMATION::default();

    // SAFETY: All pointers refer to live buffers for the duration of the call, and we request the child process start suspended for injection.
    let create_result = unsafe {
        CreateProcessW(
            PCWSTR(target_wide.as_ptr()),
            Some(PWSTR(command_line.as_mut_ptr())),
            None,
            None,
            false,
            CREATE_SUSPENDED,
            None,
            PCWSTR(current_dir.as_ref().map_or(std::ptr::null(), |dir| dir.as_ptr())),
            &startup_info,
            &mut process_info,
        )
    };

    restore_env(snapshot);

    create_result.map_err(|err| format!("CreateProcessW failed: {err}"))?;

    let process = HandleGuard::new(process_info.hProcess);
    let thread = HandleGuard::new(process_info.hThread);
    let dll_handle = match inject_dll(process.raw(), dll_path) {
        Ok(handle) => handle,
        Err(err) => {
            // SAFETY: The child process is ours and still suspended; terminating it avoids leaving a broken process behind after failed injection.
            let _ = unsafe { TerminateProcess(process.raw(), 1) };
            return Err(err);
        }
    };

    // SAFETY: The primary thread is valid and must be resumed exactly once after successful injection.
    let resume_result = unsafe { ResumeThread(thread.raw()) };
    if resume_result == u32::MAX {
        // SAFETY: If the resume fails, terminate the suspended process so the command does not leak a stuck child process.
        let _ = unsafe { TerminateProcess(process.raw(), 1) };
        return Err(win32_message("ResumeThread"));
    }

    Ok(LaunchResult {
        pid: process_info.dwProcessId,
        dll_handle,
    })
}

#[cfg(not(windows))]
#[tauri::command]
pub fn launch_game(_args: LaunchArgs) -> Result<LaunchResult, String> {
    Err("launch_game is only supported on Windows".to_string())
}

#[cfg(windows)]
#[tauri::command]
pub fn terminate_game(pid: u32) -> Result<(), String> {
    // SAFETY: We request a handle with terminate rights for the pid supplied by the caller.
    let process = unsafe { OpenProcess(PROCESS_TERMINATE, false, pid) }
        .map_err(|err| format!("OpenProcess failed: {err}"))?;
    let process = HandleGuard::new(process);

    // SAFETY: The opened handle grants terminate rights, so terminating the target process is valid here.
    unsafe { TerminateProcess(process.raw(), 1) }
        .map_err(|err| format!("TerminateProcess failed: {err}"))?;

    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn terminate_game(_pid: u32) -> Result<(), String> {
    Err("terminate_game is only supported on Windows".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The real install path on the owner's machine: CJK, a space, and
    /// brackets. Every character here was `?` through the old `A` entry points.
    const CJK_EXE: &str = r"D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.exe";
    const CJK_DLL: &str = r"D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08_platform.dll";

    fn launch_args(host_mode: bool, peer_addr: Option<&str>, listen_port: Option<u16>) -> LaunchArgs {
        LaunchArgs {
            target_path: CJK_EXE.to_string(),
            dll_path: CJK_DLL.to_string(),
            host_mode,
            listen_port,
            peer_addr: peer_addr.map(str::to_string),
            disable_multiplayer: None,
        }
    }

    fn value_of<'a>(vars: &'a [(&'static str, String)], name: &str) -> Option<&'a str> {
        vars.iter()
            .find(|(key, _)| *key == name)
            .map(|(_, value)| value.as_str())
    }

    /// Every setting must reach the child under the canonical `THP_*` name *and*
    /// under the legacy `TH08_PLATFORM_*` name the shipped th08 DLL reads, with
    /// the same value. This is the invariant that lets the namespace widen
    /// without breaking injection of the current DLL.
    #[test]
    fn env_overrides_carry_canonical_and_legacy_names_with_equal_values() {
        for (args, expected) in [
            (
                launch_args(true, None, None),
                vec![
                    ("THP_HOST", "1"),
                    ("TH08_PLATFORM_HOST", "1"),
                    ("THP_LISTEN", "7480"),
                    ("TH08_PLATFORM_LISTEN", "7480"),
                    ("THP_DISABLE_MULTIPLAYER", "1"),
                    ("TH08_PLATFORM_DISABLE_MULTIPLAYER", "1"),
                ],
            ),
            (
                launch_args(false, Some("10.0.0.5:7480"), None),
                vec![
                    ("THP_PEER", "10.0.0.5:7480"),
                    ("TH08_PLATFORM_PEER", "10.0.0.5:7480"),
                    ("THP_LISTEN", "7481"),
                    ("TH08_PLATFORM_LISTEN", "7481"),
                    ("THP_DISABLE_MULTIPLAYER", "1"),
                    ("TH08_PLATFORM_DISABLE_MULTIPLAYER", "1"),
                ],
            ),
        ] {
            let vars = build_env_overrides(&args);
            for (name, want) in &expected {
                assert_eq!(
                    value_of(&vars, name),
                    Some(*want),
                    "missing or wrong value for {name} in {vars:?}"
                );
            }
            assert_eq!(vars.len(), expected.len(), "unexpected extra vars: {vars:?}");

            for (canonical, legacy) in [
                EnvSlot::Peer.names(),
                EnvSlot::Host.names(),
                EnvSlot::Listen.names(),
                EnvSlot::DisableMultiplayer.names(),
            ] {
                match (value_of(&vars, canonical), value_of(&vars, legacy)) {
                    (Some(under_canonical), Some(under_legacy)) => assert_eq!(
                        under_canonical, under_legacy,
                        "{canonical} and {legacy} disagree"
                    ),
                    (None, None) => {}
                    _ => panic!("{canonical} and {legacy} must be emitted together"),
                }
            }
        }
    }

    #[test]
    fn env_overrides_prefer_explicit_listen_port_over_host_default() {
        let vars = build_env_overrides(&launch_args(true, None, Some(17708)));
        assert_eq!(value_of(&vars, "THP_LISTEN"), Some("17708"));
        assert_eq!(value_of(&vars, "TH08_PLATFORM_LISTEN"), Some("17708"));
    }

    #[test]
    fn env_overrides_disable_multiplayer_false_is_opt_in() {
        let mut args = launch_args(true, None, None);
        args.disable_multiplayer = Some(false);
        let vars = build_env_overrides(&args);
        assert_eq!(value_of(&vars, "THP_DISABLE_MULTIPLAYER"), Some("0"));
        assert_eq!(value_of(&vars, "TH08_PLATFORM_DISABLE_MULTIPLAYER"), Some("0"));
    }

    #[test]
    fn no_multiplayer_session_emits_nothing() {
        assert!(build_env_overrides(&launch_args(false, None, None)).is_empty());
    }

    /// Proves the legacy names are not merely *computed* but actually applied
    /// to, and restored from, this process's environment.
    #[test]
    fn apply_and_restore_covers_both_namespaces() {
        let _guard = PROCESS_ENV_LOCK.lock().expect("env lock");
        for name in [EnvSlot::Peer.names().0, EnvSlot::Peer.names().1] {
            env::set_var(name, "sentinel");
        }

        let overrides = build_env_overrides(&launch_args(false, Some("192.168.1.9:17708"), None));
        let snapshot = snapshot_env(&overrides);
        apply_env_overrides(&overrides);

        for (canonical, legacy) in [EnvSlot::Peer.names(), EnvSlot::Listen.names()] {
            assert_eq!(env::var(canonical).ok().as_deref(), value_of(&overrides, canonical));
            assert_eq!(env::var(legacy).ok().as_deref(), value_of(&overrides, legacy));
            assert_ne!(env::var(canonical).ok().as_deref(), Some("sentinel"));
        }

        restore_env(snapshot);
        assert_eq!(env::var("THP_PEER").ok().as_deref(), Some("sentinel"));
        assert_eq!(env::var("TH08_PLATFORM_PEER").ok().as_deref(), Some("sentinel"));
        assert!(env::var_os("THP_LISTEN").is_none());
        assert!(env::var_os("TH08_PLATFORM_LISTEN").is_none());

        for name in [EnvSlot::Peer.names().0, EnvSlot::Peer.names().1] {
            env::remove_var(name);
        }
    }

    #[test]
    fn command_line_quotes_a_path_with_cjk_and_spaces() {
        let line = build_command_line(CJK_EXE);
        assert_eq!(line.last(), Some(&0), "command line must be NUL terminated");

        let decoded: String = String::from_utf16(&line[..line.len() - 1]).expect("valid utf-16");
        assert_eq!(decoded, format!("\"{CJK_EXE}\""));

        // Unquoted, the naive split at spaces gives three arguments
        // (`D:\Game\Touhou\[th08]`, `东方永夜抄`, `(日文版)\th08.exe`) instead of one.
        assert_eq!(decoded.split(' ').filter(|part| !part.is_empty()).count(), 3);
    }

    #[test]
    fn command_line_leaves_a_space_free_path_unquoted() {
        let line = build_command_line(r"C:\games\th08\th08.exe");
        let decoded: String = String::from_utf16(&line[..line.len() - 1]).expect("valid utf-16");
        assert_eq!(decoded, r"C:\games\th08\th08.exe");
    }

    /// Measured, not folklore: the real parser returns a trailing backslash run
    /// verbatim, so doubling it would corrupt the argument.
    #[test]
    fn command_line_keeps_trailing_backslashes_verbatim() {
        for argument in [r"C:\odd dir\", r"C:\odd dir\\", r"C:\odd dir\\\\"] {
            let line = build_command_line(argument);
            let decoded: String = String::from_utf16(&line[..line.len() - 1]).expect("valid utf-16");
            assert_eq!(decoded, format!("\"{argument}\""));
        }
    }

    #[cfg(windows)]
    mod windows_wide {
        use super::*;
        use windows::{
            core::PCWSTR,
            Win32::{Foundation::{HLOCAL, LocalFree}, UI::Shell::CommandLineToArgvW},
        };

        /// Parse with the *real* Windows parser. This is the same function
        /// `CreateProcessW`'s child-side CRT logic mirrors, so it is the only
        /// round-trip that actually proves the quoting is right.
        fn parse_argv(line: &[u16]) -> Vec<String> {
            assert_eq!(line.last(), Some(&0), "CommandLineToArgvW needs a NUL");
            let mut count = 0i32;
            // SAFETY: `line` is a NUL-terminated UTF-16 buffer that outlives the call.
            let argv = unsafe { CommandLineToArgvW(PCWSTR(line.as_ptr()), &mut count) };
            assert!(!argv.is_null(), "CommandLineToArgvW failed");
            // SAFETY: on success `argv` points at `count` NUL-terminated strings.
            let args = (0..count)
                .map(|index| {
                    // SAFETY: `argv[index]` is a NUL-terminated UTF-16 string owned by the block we free below.
                    unsafe { PCWSTR((*argv.add(index as usize)).0).to_string() }
                        .expect("valid utf-16 argument")
                })
                .collect();
            // SAFETY: `argv` came from CommandLineToArgvW and is released with LocalFree.
            unsafe { LocalFree(Some(HLOCAL(argv as *mut c_void))) };
            args
        }

        #[test]
        fn argv_round_trips_cjk_path_with_spaces_and_brackets() {
            let args = parse_argv(&build_command_line(CJK_EXE));
            assert_eq!(args, vec![CJK_EXE.to_string()]);
        }

        /// A `"` cannot occur in a Windows file name, so it is not a case this
        /// loader can ever be handed; `argv` would split it into two arguments
        /// whatever we emit.
        #[test]
        fn argv_round_trips_edge_case_arguments() {
            for argument in [
                CJK_EXE,
                r"C:\games\th08\th08.exe",
                r"C:\odd dir\",
                r"C:\odd dir\\",
                r"C:\spaces   and\ttabs",
                r"C:\目录 带 空格\th08.exe",
                r"C:\ [brackets] and space \th08.exe",
            ] {
                assert_eq!(parse_argv(&build_command_line(argument)), vec![argument.to_string()]);
            }
        }

        #[test]
        fn wide_nul_path_round_trips_cjk_without_loss() {
            let wide = wide_nul_path(Path::new(CJK_DLL), "dll_path").expect("no interior NUL");
            assert_eq!(wide.last(), Some(&0));
            // SAFETY: `wide` is NUL-terminated and outlives the read.
            let decoded = unsafe { PCWSTR(wide.as_ptr()).to_string() }.expect("valid utf-16");
            assert_eq!(decoded, CJK_DLL);
            // Every CJK character is a single UTF-16 unit outside the BMP-free
            // range; no '?' substitution anywhere.
            assert!(!decoded.contains('?'));
        }

        #[test]
        fn wide_nul_path_rejects_interior_nul() {
            let path = Path::new("C:\\games\\th08\\th08.exe\0.dll");
            let err = wide_nul_path(path, "dll_path").expect_err("interior NUL must be rejected");
            assert_eq!(err, "dll_path contains an interior NUL byte");
        }

        /// Guards the export name typo: the injection resolves `LoadLibraryW`,
        /// so a typo here would only surface as a failed launch on the owner's
        /// machine. Resolving it in this process loads nothing.
        #[test]
        fn kernel32_exports_load_library_w() {
            let name = wide_nul_path(Path::new(KERNEL32_DLL), "kernel32.dll").expect("no interior NUL");
            // SAFETY: both lookups only read the export table of an already-loaded module.
            unsafe {
                let kernel32 = GetModuleHandleW(PCWSTR(name.as_ptr())).expect("kernel32 is loaded");
                assert!(GetProcAddress(kernel32, s!("LoadLibraryW")).is_some());
            }
        }
    }
}