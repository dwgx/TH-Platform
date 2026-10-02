<#
.SYNOPSIS
    PHASE B of the DemoGate check: drive th08 with a real held input word and
    confirm the gate OPENS.

.DESCRIPTION
    Phase A (verify_gate_live.ps1) proves the gate stays CLOSED while nobody
    touches the keyboard. That is only half the claim. A gate that also stayed
    closed on real input would be a no-op that happens to look correct, and
    this project has already been burned exactly that way by a "proof" that
    turned out to be the attract demo.

    So: hold an input word, and require human=1 to actually appear.

    Input is injected through the DLL's own test-only override,
    TH08_PLATFORM_TEST_INPUT, applied inside the Controller::GetInput hook
    (dll/src/hooks/input.cpp). It is read ONCE at DLL init, so one word per
    run. It is used here rather than the SendInput helper precisely because it
    does not take focus, and this script never takes focus. For real hand-feel
    input use input_helper/thp_input.exe instead.

    This script LAUNCHES THE GAME and shows one window. Per AGENTS.md 7b it
    refuses to run without -ConfirmWindows.

.EXAMPLE
    pwsh -NoProfile -File tools/th-debug/verify_gate_human.ps1 -ConfirmWindows -Input 0x0001

.EXAMPLE
    # Z + Right
    pwsh -NoProfile -File tools/th-debug/verify_gate_human.ps1 -ConfirmWindows -Input 0x0081
#>
[CmdletBinding()]
param(
    [switch] $ConfirmWindows,
    [string] $CfgPath    = 'D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg',
    [string] $GameExe    = 'C:\th08game\th08.exe',
    [string] $GameWorkDir = 'C:\th08game',
    [string] $Loader,
    [string] $LogDir,
    [int]    $ListenPort = 7480,
    [int]    $WatchSeconds = 44,
    # ZUN input bit word. 0x0001 Z/SHOOT, 0x0002 X/BOMB, 0x0004 FOCUS,
    # 0x0008 MENU, 0x0010 UP, 0x0020 DOWN, 0x0040 LEFT, 0x0080 RIGHT.
    [string] $Input = '0x0001',
    # g_Supervisor.curState in th08 v1.00d. Build-specific.
    [IntPtr] $CurStateAddr = 0x017CE8B4
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

if (-not $ConfirmWindows) {
    throw 'Refusing to run: this launches th08 and shows a window on the owner''s desktop. Re-run with -ConfirmWindows.'
}

Import-Module (Join-Path $PSScriptRoot 'ThDebug.psm1') -Force

if (-not $LogDir) { $LogDir = Join-Path $env:LOCALAPPDATA 'th08_platform' }
if (-not $Loader) { $Loader = Join-Path $env:TEMP 'th08build\bin\Release\th08_platform_loader.exe' }
foreach ($p in @($CfgPath, $GameExe, $Loader)) {
    if (-not (Test-Path -LiteralPath $p)) { throw "missing: $p" }
}

# The game rewrites th08.cfg on exit, so re-apply windowed before every launch.
try { Set-Th08Windowed -CfgPath $CfgPath } catch { Write-Error "could not force windowed: $_"; exit 1 }

Stop-ThGameProcess
Start-Sleep -Seconds 1
Clear-ThLog -LogDir $LogDir

$env:TH08_PLATFORM_TEST_INPUT = $Input
Write-Host "TH08_PLATFORM_TEST_INPUT = $($env:TH08_PLATFORM_TEST_INPUT)   (held from DLL init; read once)"

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

$w = @(Get-ThWindow -ProcessName 'th08')
if ($w.Count) { [void](Move-ThWindowNoActivate -Hwnd $w[0].Hwnd -X 40 -Y 40) }
[void](Restore-ForegroundWindow -Hwnd $ownerFg)

# Read g_Supervisor.curState from outside the process, so "the game never
# reached a stage" can be told apart from "the gate is broken".
# Read-CurState returns $null when the read fails; $null and 0 are different
# answers and must not be conflated.
$hProc = New-ProcessReadHandle -ProcessId $gp
function Read-CurState {
    $v = Get-ProcessInt32 -Handle $hProc -Address $CurStateAddr
    if ($null -eq $v) { return 'unreadable' }
    return $v
}

$logF = Join-Path $LogDir "log_pid$gp.txt"
Write-Host "  process handle for curState reads: $hProc  (0x017CE8B4)"
$steps = [Math]::Max(1, [int]($WatchSeconds / 2))
for ($s = 0; $s -lt $steps; $s++) {
    Start-Sleep -Seconds 2
    if (-not (Test-Path -LiteralPath $logF)) { continue }
    $log = Get-Content -LiteralPath $logF -EA SilentlyContinue
    $scene = @($log | Where-Object { $_ -match 'scene:' })
    $p2    = @($log | Where-Object { $_ -match 'now constructing' })
    $gh    = @($log | Where-Object { $_ -match 'ghost f=' })
    $rc    = @($log | Where-Object { $_ -match 'RegisterChain\(0x' })
    $last = if ($scene.Count) { ($scene[-1] -replace '^\[[^\]]*\]\s*', '') } else { '(no scene line)' }
    $tag  = if ($p2.Count) { 'P2-CREATED' } else { 'no-p2' }
    Write-Host ("t={0,2}s  curState={1}  RegisterChain={2}  {3,-10} ghosts={4,-3} {5}" -f ($s * 2), (Read-CurState), $rc.Count, $tag, $gh.Count, $last)
}

$all     = Get-Content -LiteralPath $logF -EA SilentlyContinue
$human   = @($all | Where-Object { $_ -match 'human=1' })
$attract = @($all | Where-Object { $_ -match 'ATTRACT/NO-INPUT' })
$p2built = @($all | Where-Object { $_ -match 'now constructing' })
$ghosts  = @($all | Where-Object { $_ -match 'sent ghost|ghost f=' })

Write-Host ''
Write-Host '--- the Player2 decision line ---'
$all | Where-Object { $_ -match 'player2_hook' } | Select-Object -Last 4 | ForEach-Object { Write-Host "  $_" }
Write-Host ''
Write-Host '--- first and last HUMAN scene line ---'
if ($human.Count) { Write-Host "  first: $($human[0])"; Write-Host "  last:  $($human[-1])" }
Write-Host ''
Write-Host '=== VERDICT: PHASE B (held input) ==='
Write-Host "  input the game was given:     $($env:TH08_PLATFORM_TEST_INPUT)"
Write-Host "  scene lines marked HUMAN:     $($human.Count)"
Write-Host "  scene lines marked ATTRACT:   $($attract.Count)"
Write-Host "  Player2 constructed:          $($p2built.Count)"
Write-Host "  ghost lines:                  $($ghosts.Count)"

$rcIntercepted = @($all | Where-Object { $_ -match 'RegisterChain\(0x' }).Count
$reachedStage = ($rcIntercepted -gt 0) -or ($human.Count -gt 0) -or ($attract.Count -gt 0)

if (-not $all) {
    Write-Host '  INCONCLUSIVE: no log at all. The instrument did not run; this is not a gate result.'
} elseif (-not $reachedStage) {
    Write-Host '  INCONCLUSIVE -- NOT A GATE FAILURE.'
    Write-Host '  The game never reached a stage: RegisterChain was never intercepted and no scene'
    Write-Host '  line was written, so the gate was never exercised. Holding the input from init'
    Write-Host '  evidently kept the title screen from advancing. This says nothing about whether'
    Write-Host '  the gate works. A test that cannot tell "broken" from "not reached" proves nothing.'
} elseif ($human.Count -gt 0 -and $p2built.Count -gt 0) {
    Write-Host '  PASS: a real input armed the latch and built P2. The gate is not a no-op.'
} elseif ($human.Count -gt 0) {
    Write-Host '  PARTIAL: latch armed (human=1) but no P2 built -- inspect the player2_hook lines above.'
} elseif ($attract.Count -gt 0) {
    Write-Host '  FAIL: a stage ran but every frame read ATTRACT/NO-INPUT despite the input being held.'
    Write-Host '  The gate cannot see real input -- it is broken.'
} else {
    Write-Host '  INCONCLUSIVE: stage entered but neither HUMAN nor ATTRACT lines were written.'
}
if ($ghosts.Count) { Write-Host '  note: ghost traffic present:'; $ghosts | Select-Object -First 4 | ForEach-Object { Write-Host "    $_" } }

Stop-ThGameProcess
if ($L -and -not $L.HasExited) { $L.Kill() }