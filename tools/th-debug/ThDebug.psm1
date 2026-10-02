<#
.SYNOPSIS
    Shared helpers for the th-debug smoke scripts.

.DESCRIPTION
    Every script in this folder used to carry its own copy of the same
    user32/kernel32 P/Invoke block and its own copy of the "write byte 34 of
    th08.cfg" logic. Four copies of each is how the offset-17 bug survived as
    long as it did. This module is the single copy; the scripts are thin
    wrappers.

    Nothing here launches the game or touches anything but the paths handed
    to it by the caller.
#>

$ErrorActionPreference = 'Stop'

Add-Type -Namespace ThDbg -Name W -MemberDefinition @'
[StructLayout(LayoutKind.Sequential)]
public struct RECT { public int Left, Top, Right, Bottom; }
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
[DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr h, out RECT r);
[DllImport("user32.dll", EntryPoint="GetWindowLongPtrW")]
public static extern IntPtr GetWindowLongPtr(IntPtr h, int i);
[DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
[DllImport("user32.dll", SetLastError=true)]
public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
public delegate bool EP(IntPtr h, IntPtr l);
[DllImport("user32.dll")] public static extern bool EnumWindows(EP cb, IntPtr l);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
[DllImport("user32.dll", CharSet=CharSet.Unicode, EntryPoint="GetWindowTextW")]
public static extern int GetWindowTextW(IntPtr h, System.Text.StringBuilder s, int n);
[DllImport("kernel32.dll", SetLastError=true)]
public static extern IntPtr OpenProcess(uint a, bool i, uint p);
[DllImport("kernel32.dll", SetLastError=true)]
public static extern bool ReadProcessMemory(IntPtr h, IntPtr a, byte[] b, UIntPtr s, out UIntPtr r);
[DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
'@

# SetWindowPos flags
$script:SWP_NOSIZE   = 0x0001
$script:SWP_NOZORDER = 0x0004
$script:SWP_NOACTIVATE = 0x0010

# GetWindowLongPtr index for GWL_STYLE
$script:GWL_STYLE = -16

# Window style bits
$script:WS_OVERLAPPEDWINDOW = 0x00CF0000
$script:WS_POPUP            = 0x80000000

# PROCESS_VM_READ | PROCESS_QUERY_INFORMATION
$script:PROCESS_VM_READ = 0x0410

function Get-ThWindow {
    <#
    .SYNOPSIS
        Enumerate visible top-level windows belonging to a process name.
    .PARAMETER ProcessName
        e.g. 'th08'. Matched against Process.ProcessName.
    .PARAMETER TitleLike
        Optional wildcard filter on the window caption, e.g. '*Imperishable*'.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string] $ProcessName,
        [string] $TitleLike
    )

    $found = [System.Collections.Generic.List[object]]::new()
    # Collect into a list; printing from inside the callback loses the output.
    $cb = [ThDbg.W+EP]{
        param($h, $l)
        $pid_ = 0
        [void][ThDbg.W]::GetWindowThreadProcessId($h, [ref]$pid_)
        if ($pid_ -eq 0) { return $true }
        try { $pc = [System.Diagnostics.Process]::GetProcessById([int]$pid_) }
        catch { return $true }
        if ($pc.ProcessName -ne $ProcessName) { return $true }

        $sb = [System.Text.StringBuilder]::new(256)
        [void][ThDbg.W]::GetWindowTextW($h, $sb, 256)
        $title = $sb.ToString()
        if ($TitleLike -and $title -notlike $TitleLike) { return $true }
        if (-not [ThDbg.W]::IsWindowVisible($h)) { return $true }

        $wr = New-Object ThDbg.W+RECT
        $cr = New-Object ThDbg.W+RECT
        [void][ThDbg.W]::GetWindowRect($h, [ref]$wr)
        [void][ThDbg.W]::GetClientRect($h, [ref]$cr)
        $st = [int64][ThDbg.W]::GetWindowLongPtr($h, $script:GWL_STYLE)

        $found.Add([pscustomobject]@{
            Pid     = [int]$pid_
            Hwnd    = $h
            Title   = $title
            WinW    = $wr.Right - $wr.Left
            WinH    = $wr.Bottom - $wr.Top
            CW      = $cr.Right - $cr.Left
            CH      = $cr.Bottom - $cr.Top
            X       = $wr.Left
            Y       = $wr.Top
            Vis     = [ThDbg.W]::IsWindowVisible($h)
            Overlap = [bool]($st -band $script:WS_OVERLAPPEDWINDOW)
            Popup   = [bool]($st -band $script:WS_POPUP)
        })
        return $true
    }
    [void][ThDbg.W]::EnumWindows($cb, [IntPtr]::Zero)
    return $found
}

function Move-ThWindowNoActivate {
    <#
    .SYNOPSIS
        Move a window without stealing focus.
    .DESCRIPTION
        Never activates. Used to keep the owner's foreground window intact.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][IntPtr] $Hwnd,
        [int] $X,
        [int] $Y
    )
    $flags = $script:SWP_NOSIZE -bor $script:SWP_NOZORDER -bor $script:SWP_NOACTIVATE
    return [ThDbg.W]::SetWindowPos($Hwnd, [IntPtr]::Zero, $X, $Y, 0, 0, $flags)
}

function Show-ThWindow {
    [CmdletBinding()]
    param([Parameter(Mandatory)][IntPtr] $Hwnd)
    # 5 = SW_SHOW
    return [ThDbg.W]::ShowWindow($Hwnd, 5)
}

function Get-ForegroundWindow {
    [CmdletBinding()]
    param()
    return [ThDbg.W]::GetForegroundWindow()
}

function Restore-ForegroundWindow {
    <#
    .SYNOPSIS
        Hand the foreground back to whoever had it. Pass the value captured
        by Get-ForegroundWindow BEFORE launching the game.
    #>
    [CmdletBinding()]
    param([IntPtr] $Hwnd)
    if ($Hwnd -ne [IntPtr]::Zero) { return [ThDbg.W]::SetForegroundWindow($Hwnd) }
    return $false
}

function New-ProcessReadHandle {
    <#
    .SYNOPSIS
        Open a read-only handle into another process so its globals can be read.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][int] $ProcessId)
    return [ThDbg.W]::OpenProcess($script:PROCESS_VM_READ, $false, [uint32]$ProcessId)
}

function Get-ProcessInt32 {
    <#
    .SYNOPSIS
        Read a 4-byte int out of another process at a fixed address.
    .OUTPUT
        The int, or $null when the read fails. Callers MUST distinguish
        $null from a real value: a silently-zero read looks like a game that
        is sitting on state 0.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][IntPtr] $Handle,
        [Parameter(Mandatory)][IntPtr] $Address
    )
    if ($Handle -eq [IntPtr]::Zero) { return $null }
    $buf = New-Object byte[] 4
    $read = [UIntPtr]::Zero
    $ok = [ThDbg.W]::ReadProcessMemory($Handle, $Address, $buf, [UIntPtr]4, [ref]$read)
    if (-not $ok -or $read.ToUInt64() -ne 4) { return $null }
    return [BitConverter]::ToInt32($buf, 0)
}

function Stop-ThGameProcess {
    <#
    .SYNOPSIS
        Kill any leftover th08 / loader processes before a smoke run.
    #>
    [CmdletBinding()]
    param([string[]] $Names = @('th08', 'th08_platform_loader'))
    foreach ($n in $Names) {
        Get-Process -Name $n -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
    }
}

function Clear-ThLog {
    <#
    .SYNOPSIS
        Delete the DLL's per-run log files.
    .DESCRIPTION
        The log file is named log_pid<pid>.txt, NOT log.txt. See AGENTS.md.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string] $LogDir)
    if (-not (Test-Path -LiteralPath $LogDir)) { return }
    Get-ChildItem -LiteralPath $LogDir -Filter 'log_pid*.txt' -EA SilentlyContinue |
        Remove-Item -Force -EA SilentlyContinue
}

function Set-Th08Windowed {
    <#
    .SYNOPSIS
        Set byte 34 of th08.cfg to 1 (windowed), after validating the layout.

    .DESCRIPTION
        Offset 34 is cfg.windowed. It was established empirically, not guessed,
        by validating six neighbouring fields against the game's own defaults
        in a config file the game itself wrote:

          version          @20 = 0x80001 == GAME_VERSION
          padXAxis         @24 = 600       == SET_DEFAULT 600
          padYAxis         @26 = 600       == SET_DEFAULT 600
          lifeCount        @28 = 2         == SET_DEFAULT 2
          bombCount        @29 = 3         == SET_DEFAULT 3
          musicVolume      @39 = 100       == SET_DEFAULT 100
          sfxVolume        @40 = 80        == SET_DEFAULT 80

        game/src/Supervisor.cpp:866 rejects any config whose size is not
        exactly 60 bytes, and there is NO command-line switch for fullscreen:
        game/src/Supervisor.cpp:834 sets cfg.windowed = false as the default
        and the config file is the only override.

        THE GAME REWRITES th08.cfg ON EXIT. This must therefore be re-applied
        before EVERY launch, which is why it is a call and not a one-time edit.

        Throws rather than writes if the layout does not validate. A file that
        fails validation is not this build's config, and every offset in it is
        a guess.

    .PARAMETER CfgPath
        Full path to th08.cfg.
    .PARAMETER Quiet
        Suppress the layout report.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string] $CfgPath,
        [switch] $Quiet
    )

    $OFFSET = 34
    $SIZE   = 60

    if (-not (Test-Path -LiteralPath $CfgPath)) { throw "th08.cfg not found: $CfgPath" }
    $b = [System.IO.File]::ReadAllBytes($CfgPath)
    if ($b.Length -ne $SIZE) {
        throw "th08.cfg is $($b.Length) bytes, not $SIZE. The game rejects any other size, so every offset here would be a guess. Refusing to write."
    }

    if (-not $Quiet) {
        Write-Host ("th08.cfg layout check: version @20 = 0x{0:x} (expect 0x80001)" -f [BitConverter]::ToUInt32($b, 20))
        Write-Host ("  padXAxis @24 = {0} (expect 600)  padYAxis @26 = {1} (expect 600)" -f [BitConverter]::ToUInt16($b, 24), [BitConverter]::ToUInt16($b, 26))
        Write-Host ("  life @28 = {0} (expect 2)  bomb @29 = {1} (expect 3)" -f $b[28], $b[29])
        Write-Host ("  music @39 = {0} (expect 100)  sfx @40 = {1} (expect 80)" -f [sbyte]$b[39], [sbyte]$b[40])
    }

    $layoutOk = ([BitConverter]::ToUInt32($b, 20) -eq 0x80001) -and
                ([BitConverter]::ToUInt16($b, 24) -eq 600) -and
                ([BitConverter]::ToUInt16($b, 26) -eq 600) -and
                ($b[28] -eq 2) -and
                ($b[29] -eq 3) -and
                ([sbyte]$b[39] -eq 100) -and
                ([sbyte]$b[40] -eq 80)
    if (-not $layoutOk) {
        throw 'th08.cfg layout does not validate against the game defaults. Refusing to write: offset 34 would be a guess.'
    }

    if ($b[$OFFSET] -eq 1) {
        if (-not $Quiet) { Write-Host "th08.cfg byte $OFFSET already 1 (windowed)" }
        return $false
    }

    # Snapshot BEFORE mutating. The previous version of this check compared
    # $b (already mutated in memory) against the file, so it could only ever
    # report 0 differences and could never fail. It was a tautology wearing
    # the costume of a safety check.
    $before = [System.IO.File]::ReadAllBytes($CfgPath)

    $b[$OFFSET] = 1
    [System.IO.File]::WriteAllBytes($CfgPath, $b)
    $rb = [System.IO.File]::ReadAllBytes($CfgPath)
    if ($rb[$OFFSET] -ne 1) { throw "write of th08.cfg byte $OFFSET failed on readback" }

    # Exactly one byte may differ from what was on disk, and it must be $OFFSET.
    $diff = @()
    for ($i = 0; $i -lt $SIZE; $i++) { if ($before[$i] -ne $rb[$i]) { $diff += $i } }
    if ($diff.Count -ne 1 -or $diff[0] -ne $OFFSET) {
        throw "th08.cfg write changed bytes [$($diff -join ',')], expected exactly [$OFFSET]"
    }
    if (-not $Quiet) { Write-Host "th08.cfg byte $OFFSET -> 1 (windowed). Layout validated; exactly 1 byte changed." }
    return $true
}

Export-ModuleMember -Function @(
    'Get-ThWindow'
    'Move-ThWindowNoActivate'
    'Show-ThWindow'
    'Get-ForegroundWindow'
    'Restore-ForegroundWindow'
    'New-ProcessReadHandle'
    'Get-ProcessInt32'
    'Stop-ThGameProcess'
    'Clear-ThLog'
    'Set-Th08Windowed'
)