<#
Drive TH08 into a real stage with real keyboard input, and prove the
attract-mode gate opens on human input.

Why this script exists and what it is careful about:

  * Everything it claims must come from the game's OWN log. The DLL writes
    %LOCALAPPDATA%\th08_platform\log_pid<pid>.txt. If the log does not say the
    keystroke arrived, it did not arrive, regardless of what SendInput returned.

  * The instrument-failure trap. An earlier probe printed "NO INPUT REACHED THE
    GAME" when the real cause was that its C# shim had failed to compile, so no
    key was ever sent. This script refuses to report a negative unless it has
    PROVEN SendInput delivered keystrokes: it checks the return value and
    distinguishes "the method failed" from "I sent nothing".

  * The attract-mode trap. th08 plays an unattended sequence into the GameManager
    state after ~26 seconds, so curState == 2 does NOT mean a human is playing.
    The only acceptable evidence is the log line carrying human=1.

  * th08 reads DirectInput, not window messages. PostMessage never reaches it.
    SendInput with KEYEVENTF_SCANCODE drives the real input stack.

The owner has authorised mouse and keyboard use, so taking foreground focus is
permitted for this run.

PS/2 scancodes: Z=0x2C X=0x2D ENTER=0x1C SHIFT=0x2A UP=0x48 DOWN=0x50
                LEFT=0x4B RIGHT=0x4D ESC=0x01
#>
#Requires -Version 7.0
[CmdletBinding()]
param(
    [switch] $ConfirmWindows,
    [int]    $ListenPort   = 7480,
    [int]    $SettleSeconds = 6,
    [switch] $LeaveRunning
)

$ErrorActionPreference = 'Continue'

if (-not $ConfirmWindows) {
    Write-Error @"
A TH08 window will appear on the desktop and will take keyboard focus.
Re-run with -ConfirmWindows to allow it.
"@
    exit 2
}

Import-Module (Join-Path $PSScriptRoot 'ThDebug.psm1') -Force

$helper = Join-Path $PSScriptRoot 'input_helper\thp_input.exe'
if (-not (Test-Path -LiteralPath $helper)) {
    Write-Error "input helper missing: $helper (build it with input_helper\build.ps1)"
    exit 1
}

# --- windowed mode is re-applied because the game rewrites th08.cfg on exit ---
$cfg = 'D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg'
try { [void](Set-Th08Windowed -CfgPath $cfg) } catch { Write-Warning $_ }

Stop-ThGameProcess
Clear-ThLog
Start-Sleep -Seconds 1

$loader = Join-Path $env:TEMP 'th08build\bin\Release\th08_platform_loader.exe'
if (-not (Test-Path -LiteralPath $loader)) { Write-Error "loader missing: $loader"; exit 1 }

$psi = [System.Diagnostics.ProcessStartInfo]::new()
$psi.FileName  = $loader
$psi.UseShellExecute = $false
$psi.WorkingDirectory = 'C:\th08game'
$psi.ArgumentList.Add('C:\th08game\th08.exe')
$psi.ArgumentList.Add('--host')
$psi.ArgumentList.Add('--listen')
$psi.ArgumentList.Add("$ListenPort")
$loaderProc = [System.Diagnostics.Process]::Start($psi)

$game = $null
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 250
    $game = Get-Process -Name th08 -EA SilentlyContinue | Select-Object -First 1
    if ($game) { break }
}
if (-not $game) { Write-Error 'th08 did not start'; exit 1 }
$gp = $game.Id
Start-Sleep -Seconds 3
Write-Host "th08 pid=$gp"

$logDir = Join-Path $env:LOCALAPPDATA 'th08_platform'
$logF   = Join-Path $logDir "log_pid$gp.txt"
function Log { if (Test-Path -LiteralPath $logF) { Get-Content -LiteralPath $logF -EA SilentlyContinue } else { @() } }
function LastInput {
    $l = @(Log | Where-Object { $_ -match 'input: cur=0x' })
    if ($l.Count) { ($l[-1] -replace '^\[[^\]]*\]\s*', '') } else { '(no input line)' }
}
function SceneHuman {
    $s = @(Log | Where-Object { $_ -match 'scene:' })
    if (-not $s.Count) { return '(no scene line)' }
    if ($s[-1] -match 'human=(\d)') { return "human=$($matches[1])" }
    return '(unreadable)'
}

# --- instrument check: can SendInput deliver at all? ---
Write-Host ''
Write-Host '=== PHASE 1: does SendInput reach th08? ==='
& $helper focus | Write-Host
Start-Sleep -Milliseconds 300
$before = LastInput
Write-Host "  before: $before"

$r = (& $helper tap 2C 2 350) -join ' '
Write-Host "  helper: $r"
$sent = 0
if ($r -match 'sent=(\d+)') { $sent = [int]$matches[1] }
Start-Sleep -Milliseconds 600
$after = LastInput
Write-Host "  after Zx2: $after"

if ($sent -lt 1) {
    Write-Host ''
    Write-Host '  INSTRUMENT FAILED: SendInput delivered nothing. This is NOT evidence'
    Write-Host '  about the game and NOT evidence about the method.'
    if (-not $LeaveRunning) { Stop-ThGameProcess }
    exit 4
}
$reached = ($after -notmatch 'cur=0x0000')
if (-not $reached) {
    Write-Host '  keys injected but the game still reads 0x0000; trying a mouse click for focus'
    & $helper click | Write-Host
    Start-Sleep -Milliseconds 400
    [void](& $helper tap 2C 2 350)
    Start-Sleep -Milliseconds 600
    $after = LastInput
    $reached = ($after -notmatch 'cur=0x0000')
    Write-Host "  after click+tap: $after"
}
Write-Host ''
Write-Host "  SendInput reaches th08: $(if ($reached) { 'YES' } else { 'NO' })"

# --- drive the menu ---
Write-Host ''
Write-Host '=== PHASE 2: drive the title menu with real keys ==='
[void](& $helper focus)
Start-Sleep -Milliseconds 400

$steps = @(
    @{ n = 'Z (open menu)';   a = @('tap','2C','1','500') },
    @{ n = 'DOWN';            a = @('tap','50','1','350') },
    @{ n = 'DOWN';            a = @('tap','50','1','350') },
    @{ n = 'Z (confirm)';     a = @('tap','2C','1','700') },
    @{ n = 'wait';            w = 5 },
    @{ n = 'DOWN';            a = @('tap','50','1','350') },
    @{ n = 'Z (launch)';      a = @('tap','2C','1','900') },
    @{ n = 'settle';          w = $SettleSeconds },
    @{ n = 'DOWN (in stage)'; a = @('tap','50','1','400') },
    @{ n = 'Z (in stage)';    a = @('tap','2C','1','400') },
    @{ n = 'settle 2';        w = $SettleSeconds }
)

foreach ($s in $steps) {
    if ($s.a) { [void](& $helper @($s.a)) } else { Start-Sleep -Seconds $s.w }
    $inp = LastInput
    $hex = if ($inp -match 'cur=0x([0-9A-Fa-f]{4})') { $matches[1] } else { '----' }
    Write-Host ("  {0,-20} input=0x{1}  {2}" -f $s.n, $hex, (SceneHuman))
}

# --- verdict ---
Write-Host ''
Write-Host '--- the DLL decisions it actually made ---'
Log | Where-Object { $_ -match 'player2_hook|scene:' } | Select-Object -Last 6 | ForEach-Object { Write-Host "  $_" }

$l = Log
$human   = @($l | Where-Object { $_ -match 'human=1' })
$attract = @($l | Where-Object { $_ -match 'ATTRACT/NO-INPUT' })
$built   = @($l | Where-Object { $_ -match 'now constructing' })
$nonZero = @($l | Where-Object { $_ -match 'input: cur=0x(?!0000)' })

Write-Host ''
Write-Host '=== VERDICT ==='
Write-Host "  SendInput delivered keystrokes:  $(if ($sent -ge 1) { "YES ($sent events)" } else { 'NO' })"
Write-Host "  non-zero input frames observed:  $($nonZero.Count)"
Write-Host "  scene lines marked HUMAN:       $($human.Count)"
Write-Host "  scene lines marked ATTRACT:     $($attract.Count)"
Write-Host "  Player2 constructed:            $($built.Count)"

if ($human.Count -gt 0) {
    Write-Host ''
    Write-Host '  RESULT: the gate OPENED on real input.'
    Write-Host '  The demo-vs-human discriminator works end to end, and Phase B --'
    Write-Host '  which was previously impossible without a human at the keyboard -- is'
    Write-Host '  now measured rather than assumed.'
    $human | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" }
} elseif ($nonZero.Count -gt 0) {
    Write-Host ''
    Write-Host '  RESULT: keys reached the game but the gate never read human=1.'
    Write-Host '  Either the menu path never reached a stage, or the input arrived but'
    Write-Host '  not through the word the gate reads. Distinguish those before concluding.'
} else {
    Write-Host ''
    Write-Host '  RESULT: no non-zero input was observed at all. The method did not work.'
}

if ($LeaveRunning) {
    Write-Host ''
    Write-Host 'game left running (-LeaveRunning). Close it yourself when done.'
} else {
    Write-Host ''
    Stop-ThGameProcess
    Write-Host 'game stopped.'
}