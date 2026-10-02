<#
.SYNOPSIS
    PHASE A of the DemoGate check: run th08 UNATTENDED and confirm the gate
    stays closed.

.DESCRIPTION
    The claim under test:

        with no human input, th08's attract sequence does NOT arm the latch,
        does NOT construct g_Player2, and does NOT stream ghosts.

    This script sends no input at all. If any log line marked human=1 appears
    while nobody is touching the keyboard, the gate does not hold and the
    residual risk is real.

    This script LAUNCHES THE GAME and shows one window. Per AGENTS.md 7b it
    refuses to run without -ConfirmWindows. Focus is never taken.

    Pair with verify_gate_human.ps1 (PHASE B). Phase A alone only proves the
    gate is closed, which is also what a no-op that never runs looks like.

.PARAMETER ConfirmWindows
    Required acknowledgement that a game window will appear.

.PARAMETER WatchSeconds
    How long to watch the log before judging. Must exceed the ~26 s attract
    timeout or the run proves nothing.

.EXAMPLE
    pwsh -NoProfile -File tools/th-debug/verify_gate_live.ps1 -ConfirmWindows
#>
[CmdletBinding()]
param(
    [switch] $ConfirmWindows,
    [string] $CfgPath    = 'D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg',
    [string] $GameExe    = 'C:\th08game\th08.exe',
    [string] $GameWorkDir = 'C:\th08game',
    [string] $DllPath,
    [string] $Loader,
    [string] $LogDir,
    [int]    $ListenPort = 7480,
    [int]    $WatchSeconds = 50
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

if (-not $ConfirmWindows) {
    throw 'Refusing to run: this launches th08 and shows a window on the owner''s desktop. Re-run with -ConfirmWindows.'
}

Import-Module (Join-Path $PSScriptRoot 'ThDebug.psm1') -Force

if (-not $LogDir) { $LogDir = Join-Path $env:LOCALAPPDATA 'th08_platform' }
if (-not $Loader) { $Loader = Join-Path $env:TEMP 'th08build\bin\Release\th08_platform_loader.exe' }
if (-not $DllPath) {
    $DllPath = 'D:\Project\TH08-Platform\dll\build\th08_platform.dll'
    if (-not (Test-Path -LiteralPath $DllPath)) {
        $DllPath = Join-Path $env:TEMP 'th08build\bin\Release\th08_platform.dll'
    }
}
foreach ($p in @($CfgPath, $GameExe, $Loader)) {
    if (-not (Test-Path -LiteralPath $p)) { throw "missing: $p" }
}

# The game rewrites th08.cfg on exit, so re-apply windowed before every launch.
try { Set-Th08Windowed -CfgPath $CfgPath } catch { Write-Error "could not force windowed: $_"; exit 1 }

Stop-ThGameProcess
Start-Sleep -Seconds 1
Clear-ThLog -LogDir $LogDir
Remove-Item Env:\TH08_PLATFORM_TEST_INPUT -EA SilentlyContinue

Write-Host "dll under test: $DllPath"
Write-Host "  exists: $(Test-Path -LiteralPath $DllPath)  size: $((Get-Item -LiteralPath $DllPath -EA SilentlyContinue).Length)"
Write-Host 'PHASE A: unattended. No key will be sent. The attract sequence is expected.'
Write-Host ''

$ownerFg = Get-ForegroundWindow
$psi = [System.Diagnostics.ProcessStartInfo]::new()
$psi.FileName = $Loader; $psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
$psi.WorkingDirectory = $GameWorkDir
$psi.ArgumentList.Add($GameExe); $psi.ArgumentList.Add('--host'); $psi.ArgumentList.Add('--listen'); $psi.ArgumentList.Add("$ListenPort")
$L = [System.Diagnostics.Process]::Start($psi)
$null = $L.StandardOutput.ReadToEndAsync(); $null = $L.StandardError.ReadToEndAsync()

$game = $null
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 250
    $game = Get-Process -Name th08 -EA SilentlyContinue | Select-Object -First 1
    if ($game) { break }
}
if (-not $game) {
    Write-Error 'game did not start'
    if (-not $L.HasExited) { $L.Kill() }
    exit 1
}
$gp = $game.Id
Write-Host "th08 pid=$gp"

# Place the window without activating it.
$w = @(Get-ThWindow -ProcessName 'th08')
if ($w.Count) { [void](Move-ThWindowNoActivate -Hwnd $w[0].Hwnd -X 40 -Y 40) }
[void](Restore-ForegroundWindow -Hwnd $ownerFg)

$logF = Join-Path $LogDir "log_pid$gp.txt"
$steps = [Math]::Max(1, [int]($WatchSeconds / 2))
for ($s = 0; $s -lt $steps; $s++) {
    Start-Sleep -Seconds 2
    if (-not (Test-Path -LiteralPath $logF)) { continue }
    $log = Get-Content -LiteralPath $logF -EA SilentlyContinue
    $scene = @($log | Where-Object { $_ -match 'scene:' })
    $p2    = @($log | Where-Object { $_ -match 'Player2|g_Player2' })
    $gh    = @($log | Where-Object { $_ -match 'ghost f=' })
    $tick  = @($log | Where-Object { $_ -match 'OnUpdate tick' })
    $lastScene = if ($scene.Count) { ($scene[-1] -replace '^\[[^\]]*\]\s*', '') } else { '(none)' }
    $tag = if ($p2.Count) { 'P2-CREATED' } else { 'no-p2' }
    Write-Host ("t={0,2}s  ticks={1,-4} ghosts={2,-3} {3,-10} {4}" -f ($s * 2), $tick.Count, $gh.Count, $tag, $lastScene)
}

Write-Host ''
Write-Host '--- every scene: line the DLL actually wrote ---'
Get-Content -LiteralPath $logF -EA SilentlyContinue | Where-Object { $_ -match 'scene:' } | ForEach-Object { Write-Host "  $_" }
Write-Host ''
Write-Host '--- every Player2 decision the DLL actually wrote ---'
Get-Content -LiteralPath $logF -EA SilentlyContinue | Where-Object { $_ -match 'player2_hook' } | ForEach-Object { Write-Host "  $_" }
Write-Host ''
Write-Host '--- any ghost sent? ---'
$g = @(Get-Content -LiteralPath $logF -EA SilentlyContinue | Where-Object { $_ -match 'ghost f=' })
if ($g.Count) { $g | Select-Object -First 5 | ForEach-Object { Write-Host "  $_" } }
else { Write-Host '  NONE. Good: the attract sequence produced no ghost traffic.' }

Write-Host ''
$all        = Get-Content -LiteralPath $logF -EA SilentlyContinue
$humanLines = @($all | Where-Object { $_ -match 'human=1' })
$attractLn  = @($all | Where-Object { $_ -match 'ATTRACT/NO-INPUT' })
$p2built    = @($all | Where-Object { $_ -match 'now constructing' })
$ghosts     = @($all | Where-Object { $_ -match 'sent ghost' })

Write-Host '=== VERDICT: PHASE A (unattended) ==='
Write-Host "  scene lines marked HUMAN:     $($humanLines.Count)"
Write-Host "  scene lines marked ATTRACT:   $($attractLn.Count)"
Write-Host "  Player2 constructed:          $($p2built.Count)"
Write-Host "  ghost packets sent:           $($ghosts.Count)"

if (-not $all) {
    Write-Host '  INCONCLUSIVE: no log at all. The instrument did not run; this is not a gate result.'
} elseif ($humanLines.Count -gt 0) {
    Write-Host '  FAIL: the latch armed with nobody at the keyboard. The gate does not hold.'
} elseif ($p2built.Count -gt 0) {
    Write-Host '  FAIL: P2 was constructed during the attract sequence.'
} elseif ($attractLn.Count -eq 0) {
    Write-Host '  INCONCLUSIVE: the attract sequence never ran. WatchSeconds may be too short.'
    Write-Host '  A run that never enters a stage exercises nothing and proves nothing.'
} else {
    Write-Host '  PASS: unattended attract sequence did not arm the latch, did not build P2.'
}

Stop-ThGameProcess
if ($L -and -not $L.HasExited) { $L.Kill() }
Write-Host ''
Write-Host 'Game stopped. Phase B (a real keypress) is verify_gate_human.ps1.'