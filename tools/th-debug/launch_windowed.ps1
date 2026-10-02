<#
.SYNOPSIS
    Launch th08 twice through the platform loader and MEASURE that both
    instances are genuinely windowed.

.DESCRIPTION
    A fullscreen D3D8 surface still exposes a window handle, so moving the
    window proves nothing on its own. This script asserts three things per
    instance and only then reports WINDOWED CONFIRMED:

      - WS_OVERLAPPEDWINDOW set and WS_POPUP clear  => a real window
      - client area exactly 640x480                   => native size, uncropped
      - window position is where we put it            => not fullscreen-faked

    Windows are left on screen and never take focus; the owner's foreground
    window is restored before the script returns.

    This script LAUNCHES THE GAME and pops two windows on the owner's desktop.
    Per AGENTS.md section 7b it refuses to run without -ConfirmWindows.

.PARAMETER ConfirmWindows
    Required acknowledgement that two game windows will appear.

.PARAMETER CfgPath
    Full path to th08.cfg. Machine-specific default; override elsewhere.
    Re-applied here because the game rewrites this file on exit.

.PARAMETER HostExe / PeerExe
    th08.exe for each instance. The defaults are the ASCII junctions
    (C:\th08game, C:\th08game_p) that exist only because the loader used to
    be unable to read the CJK install path. See AGENTS.md.

.EXAMPLE
    pwsh -NoProfile -File tools/th-debug/launch_windowed.ps1 -ConfirmWindows
#>
[CmdletBinding()]
param(
    [switch] $ConfirmWindows,
    [string] $CfgPath    = 'D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg',
    [string] $HostExe    = 'C:\th08game\th08.exe',
    [string] $PeerExe    = 'C:\th08game_p\th08.exe',
    [string] $HostWorkDir = 'C:\th08game',
    [string] $PeerWorkDir = 'C:\th08game_p',
    [string] $Loader,
    [string] $LogDir,
    [string] $TitleLike  = '*Imperishable*',
    [int]    $ListenPort = 7480
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

if (-not $ConfirmWindows) {
    throw 'Refusing to run: this launches th08 twice and shows two windows on the owner''s desktop. Re-run with -ConfirmWindows.'
}

Import-Module (Join-Path $PSScriptRoot 'ThDebug.psm1') -Force

if (-not $Loader) { $Loader = Join-Path $env:TEMP 'th08build\bin\Release\th08_platform_loader.exe' }
if (-not $LogDir) { $LogDir = Join-Path $env:LOCALAPPDATA 'th08_platform' }

foreach ($p in @($CfgPath, $HostExe, $PeerExe, $Loader)) {
    if (-not (Test-Path -LiteralPath $p)) { throw "missing: $p" }
}

# 1. Re-apply windowed=1. This is not a one-time edit: the game rewrites
#    th08.cfg on exit, so every launch needs it.
try {
    Set-Th08Windowed -CfgPath $CfgPath
} catch {
    Write-Error "could not force windowed: $_"
    exit 1
}

Stop-ThGameProcess
Start-Sleep -Seconds 1
Clear-ThLog -LogDir $LogDir

Remove-Item Env:\TH08_PLATFORM_TEST_INPUT -EA SilentlyContinue
$env:TH08_PLATFORM_DISABLE_MULTIPLAYER = '0'

$owner = Get-ForegroundWindow
Write-Host "owner foreground: 0x$($owner.ToInt64().ToString('x'))  (restored before we return; never activated below)"
Write-Host "loader: $Loader"
Write-Host ''

Write-Host 'launching host ...'
$ph = [System.Diagnostics.ProcessStartInfo]::new()
$ph.FileName = $Loader; $ph.UseShellExecute = $false
# Drain both pipes. An undrained stdout pipe wedges the child after a few
# dozen writes and looks exactly like a deadlock.
$ph.RedirectStandardOutput = $true; $ph.RedirectStandardError = $true
$ph.WorkingDirectory = $HostWorkDir
$ph.ArgumentList.Add($HostExe); $ph.ArgumentList.Add('--host'); $ph.ArgumentList.Add('--listen'); $ph.ArgumentList.Add("$ListenPort")
$hostL = [System.Diagnostics.Process]::Start($ph)
$null = $hostL.StandardOutput.ReadToEndAsync(); $null = $hostL.StandardError.ReadToEndAsync()

Start-Sleep -Seconds 3

Write-Host 'launching peer ...'
$pp = [System.Diagnostics.ProcessStartInfo]::new()
$pp.FileName = $Loader; $pp.UseShellExecute = $false
$pp.RedirectStandardOutput = $true; $pp.RedirectStandardError = $true
$pp.WorkingDirectory = $PeerWorkDir
$pp.ArgumentList.Add($PeerExe); $pp.ArgumentList.Add('--peer'); $pp.ArgumentList.Add("127.0.0.1:$ListenPort")
$peerL = [System.Diagnostics.Process]::Start($pp)
$null = $peerL.StandardOutput.ReadToEndAsync(); $null = $peerL.StandardError.ReadToEndAsync()

Start-Sleep -Seconds 8

# 2. Position the windows without activating them, then re-measure. If the
#    game were fullscreen these moves would not stick, which is the test.
$spots = @(@(60, 60), @(760, 60))
$before = @(Get-ThWindow -ProcessName 'th08' -TitleLike $TitleLike)
for ($i = 0; $i -lt $before.Count -and $i -lt $spots.Count; $i++) {
    [void](Move-ThWindowNoActivate -Hwnd $before[$i].Hwnd -X $spots[$i][0] -Y $spots[$i][1])
    [void](Show-ThWindow -Hwnd $before[$i].Hwnd)
}
[void](Restore-ForegroundWindow -Hwnd $owner)
Start-Sleep -Seconds 2

$rows = @(Get-ThWindow -ProcessName 'th08' -TitleLike $TitleLike)
Write-Host "windows found: $($rows.Count)"

$allOk = ($rows.Count -ge 2)
for ($i = 0; $i -lt $rows.Count; $i++) {
    $r = $rows[$i]
    # Instance i was sent to $spots[$i]; confirm it is actually sitting there.
    $wantX = if ($i -lt $spots.Count) { $spots[$i][0] } else { $r.X }
    $wantY = if ($i -lt $spots.Count) { $spots[$i][1] } else { $r.Y }
    Write-Host ''
    Write-Host ("pid {0} hwnd 0x{1:x}  outer {2}x{3}  CLIENT {4}x{5}  at ({6},{7}) wanted ({8},{9})  visible={10}" -f `
        $r.Pid, $r.Hwnd.ToInt64(), $r.WinW, $r.WinH, $r.CW, $r.CH, $r.X, $r.Y, $wantX, $wantY, $r.Vis)
    Write-Host ("     WS_OVERLAPPEDWINDOW={0}  WS_POPUP(fullscreen)={1}" -f $r.Overlap, $r.Popup)
    $ok = $r.Overlap -and (-not $r.Popup) -and $r.CW -eq 640 -and $r.CH -eq 480 -and
          $r.Vis -and $r.X -eq $wantX -and $r.Y -eq $wantY
    if (-not $ok) { $allOk = $false }
    Write-Host ("     -> {0}" -f $(if ($ok) { 'WINDOWED OK (real window, 640x480 client, where we put it)' } else { 'NOT windowed' }))
}

Write-Host ''
Write-Host '================================================================'
if ($allOk) {
    Write-Host ' WINDOWED CONFIRMED on both instances:'
    Write-Host '   - real overlapped window, not a fullscreen popup'
    Write-Host '   - client area exactly 640x480, nothing cropped or scaled'
    Write-Host '   - windows sit where we put them, and are visible'
    Write-Host ''
    Write-Host ' Both are on screen. Click one and drive it yourself, or use the'
    Write-Host ' input helper: thp_input.exe focus / tap 2C  (Z starts a game).'
    Write-Host ''
    Write-Host ' REMINDER: WINDOWED PROVES NOTHING ABOUT SYNCHRONIZATION. See README.md.'
} else {
    Write-Host ' NOT CONFIRMED windowed. See the per-window lines above.'
}
Write-Host ' Instances left running. Close them yourself, or say so.'
Write-Host '================================================================'