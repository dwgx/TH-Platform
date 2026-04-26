use serde::{Deserialize, Serialize};
use std::{
    env,
    ffi::{c_void, CString, OsString},
    path::Path,
    sync::{Mutex, OnceLock},
};

#[cfg(windows)]
use windows::{
    core::{s, Error, PCSTR, PSTR},
    Win32::{
        Foundation::{CloseHandle, HANDLE, WAIT_FAILED, WAIT_OBJECT_0},
        System::{
            Diagnostics::Debug::WriteProcessMemory,
            LibraryLoader::{GetModuleHandleA, GetProcAddress},
            Memory::{
                VirtualAllocEx, VirtualFreeEx, MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_READWRITE,
            },
            Threading::{
                CreateProcessA, CreateRemoteThread, GetExitCodeThread, OpenProcess, ResumeThread,
                TerminateProcess, WaitForSingleObject, CREATE_SUSPENDED, INFINITE,
                PROCESS_INFORMATION, PROCESS_TERMINATE, STARTUPINFOA,
            },
        },
    },
};

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

static PROCESS_ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn process_env_lock() -> &'static Mutex<()> {
    PROCESS_ENV_LOCK.get_or_init(|| Mutex::new(()))
}

fn cstring(value: &str, field: &str) -> Result<CString, String> {
    CString::new(value).map_err(|_| format!("{field} contains an interior NUL byte"))
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

fn build_env_overrides(args: &LaunchArgs) -> Vec<(&'static str, String)> {
    let mut vars = Vec::new();

    if let Some(peer_addr) = &args.peer_addr {
        vars.push(("TH08_PLATFORM_PEER", peer_addr.clone()));
    }

    if args.host_mode {
        vars.push(("TH08_PLATFORM_HOST", "1".to_string()));
    }

    if let Some(listen_port) = args.listen_port {
        vars.push(("TH08_PLATFORM_LISTEN", listen_port.to_string()));
    } else if args.host_mode {
        vars.push(("TH08_PLATFORM_LISTEN", "7480".to_string()));
    } else if let Some(peer_addr) = &args.peer_addr {
        vars.push(("TH08_PLATFORM_LISTEN", fallback_listen_port(peer_addr)));
    }

    if args.host_mode || args.peer_addr.is_some() {
        let disable = match args.disable_multiplayer {
            Some(false) => "0",
            Some(true) | None => "1",
        };
        vars.push(("TH08_PLATFORM_DISABLE_MULTIPLAYER", disable.to_string()));
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
fn inject_dll(process: HANDLE, dll_path: &str) -> Result<u64, String> {
    let dll_bytes = cstring(dll_path, "dll_path")?;
    let remote_len = dll_bytes.as_bytes_with_nul().len();

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
                dll_bytes.as_ptr() as *const c_void,
                remote_len,
                None,
            )
        }
        .map_err(|err| format!("WriteProcessMemory failed: {err}"))?;

        // SAFETY: Reading the current process's kernel32 handle is required to resolve LoadLibraryA before creating the remote thread.
        let kernel32 = unsafe { GetModuleHandleA(s!("kernel32.dll")) }
            .map_err(|err| format!("GetModuleHandleA failed: {err}"))?;

        // SAFETY: We query the address of LoadLibraryA from kernel32 for the classic remote-thread injection entry point.
        let load_library = unsafe { GetProcAddress(kernel32, s!("LoadLibraryA")) }
            .ok_or_else(|| win32_message("GetProcAddress"))?;

        // SAFETY: LoadLibraryA matches the thread entry ABI expected by CreateRemoteThread for this injection pattern.
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
            return Err("LoadLibraryA returned 0 - DLL failed to load".to_string());
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
    if !Path::new(&args.target_path).is_file() {
        return Err(format!("target not found: {}", args.target_path));
    }
    if !Path::new(&args.dll_path).is_file() {
        return Err(format!("dll not found: {}", args.dll_path));
    }

    let target_path = cstring(&args.target_path, "target_path")?;
    let dll_path = args.dll_path.clone();
    let mut command_line = target_path.as_bytes_with_nul().to_vec();
    let current_dir = Path::new(&args.target_path)
        .parent()
        .map(|path| path.as_os_str().to_string_lossy().into_owned());
    let current_dir = current_dir
        .as_deref()
        .map(|path| cstring(path, "target current directory"))
        .transpose()?;

    let overrides = build_env_overrides(&args);
    let _env_guard = process_env_lock()
        .lock()
        .map_err(|_| "process environment lock poisoned".to_string())?;
    let snapshot = snapshot_env(&overrides);
    apply_env_overrides(&overrides);

    let mut startup_info = STARTUPINFOA::default();
    startup_info.cb = std::mem::size_of::<STARTUPINFOA>() as u32;
    let mut process_info = PROCESS_INFORMATION::default();

    // SAFETY: All pointers refer to live buffers for the duration of the call, and we request the child process start suspended for injection.
    let create_result = unsafe {
        CreateProcessA(
            PCSTR(target_path.as_ptr() as *const u8),
            Some(PSTR(command_line.as_mut_ptr())),
            None,
            None,
            false,
            CREATE_SUSPENDED,
            None,
            current_dir
                .as_ref()
                .map_or(PCSTR::null(), |value| PCSTR(value.as_ptr() as *const u8)),
            &startup_info,
            &mut process_info,
        )
    };

    restore_env(snapshot);

    create_result.map_err(|err| format!("CreateProcessA failed: {err}"))?;

    let process = HandleGuard::new(process_info.hProcess);
    let thread = HandleGuard::new(process_info.hThread);
    let dll_handle = match inject_dll(process.raw(), &dll_path) {
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
