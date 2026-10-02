<#
Drive TH08 by keyboard while LOOKING at the screen.

The previous run proved SendInput reaches the game but the menu never reached a
stage. That is a navigation question, and navigation cannot be answered by a
log line -- only by seeing which screen the game is on. So this script takes a
screenshot after every keypress and prints the file path.

Screen-by-screen navigation in th08's title menu:
  * Z confirms, X cancels, Up/Down move, Enter also confirms.
  * The title menu leads to a submenu whose first item starts a game.

Usage:
  pwsh -NoProfile -File drive_visual.ps1 -ConfirmWindows [-Script "z,down,down,z,wait5"]
#>
#Requires -Version 7.0
[CmdletBinding()]
param(
    [switch] $ConfirmWindows,
    [string] $Script = 'z,down,down,z,wait4,down,z,wait6',
    [string] $ShotDir = (Join-Path $env:TEMP 'thp\shots'),
    [switch] $LeaveRunning
)

$ErrorActionPreference = 'Continue'
if (-not $ConfirmWindows) {
    Write-Error 'A TH08 window will appear and take keyboard focus. Re-run with -ConfirmWindows.'
    exit 2
}

Import-Module (Join-Path $PSScriptRoot 'ThDebug.psm1') -Force
$helper = Join-Path $PSScriptRoot 'input_helper\thp_input.exe'
$shot   = Join-Path $env:TEMP 'thp\input_helper\thp_shot.exe'

$scancodes = @{
    'z' = '2C'; 'x' = '2D'; 'enter' = '1C'; 'shift' = '2A'
    'up' = '48'; 'down' = '50'; 'left' = '4B'; 'right' = '4D'; 'esc' = '01'
}

New-Item -ItemType Directory -Force -Path $ShotDir | Out-Null
Get-ChildItem $ShotDir -Filter '*.png' -EA SilentlyContinue | Remove-Item -Force

$cfg = 'D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg'
try { [void](Set-Th08Windowed -CfgPath $cfg) } catch { Write-Warning $_ }
Stop-ThGameProcess
Clear-ThLog
Start-Sleep -Seconds 1

$loader = Join-Path $env:TEMP 'th08build\bin\Release\th08_platform_loader.exe'
$psi = [System.Diagnostics.ProcessStartInfo]::new()
$psi.FileName = $loader; $psi.UseShellExecute = $false; $psi.WorkingDirectory = 'C:\th08game'
$psi.ArgumentList.Add('C:\th08game\th08.exe'); $psi.ArgumentList.Add('--host'); $psi.ArgumentList.Add('--listen'); $psi.ArgumentList.Add('7480')
[void][System.Diagnostics.Process]::Start($psi)

$game = $null
for ($i = 0; $i -lt 40; $i++) { Start-Sleep -Milliseconds 250; $game = Get-Process -Name th08 -EA SilentlyContinue | Select-Object -First 1; if ($game) { break } }
if (-not $game) { Write-Error 'th08 did not start'; exit 1 }
$gp = $game.Id
Start-Sleep -Seconds 3
Write-Host "th08 pid=$gp"

$logDir = Join-Path $env:LOCALAPPDATA 'th08_platform'
$logF = Join-Path $logDir "log_pid$gp.txt"
function LastInput {
    if (-not (Test-Path -LiteralPath $logF)) { return '(no log)' }
    $l = @(Get-Content -LiteralPath $logF -EA SilentlyContinue | Where-Object { $_ -match 'input: cur=0x' })
    if ($l.Count) { ($l[-1] -replace '^\[[^\]]*\]\s*', '') } else { '(none)' }
}
function Grab([string]$tag) {
    # Do not report a screenshot that was not written. An earlier version
    # discarded the capture tool's output and printed the filename anyway, so a
    # failed capture still looked like a success -- the same green-but-means-
    # nothing failure this project keeps tripping over.
    $p = Join-Path $ShotDir ("{0:d2}_{1}.png" -f $script:i, $tag)
    $out = (& $shot $p 2>&1) -join ' '
    if (-not (Test-Path -LiteralPath $p)) { return "CAPTURE-FAILED($out)" }
    return (Split-Path $p -Leaf)
}
$script:i = 0
$shot0 = Grab 'boot'
Write-Host ("[{0:d2}] boot           {1}   {2}" -f $script:i, (LastInput), (Split-Path $shot0 -Leaf))

foreach ($step in ($Script -split ',')) {
    $s = $step.Trim().ToLower()
    if (-not $s) { continue }
    if ($s -match '^wait(\d+)$') {
        Start-Sleep -Seconds ([int]$matches[1])
        $script:i++
        $p = Grab ("wait" + $matches[1])
        Write-Host ("[{0:d2}] wait {1,-9} {2}   {3}" -f $script:i, $matches[1], (LastInput), (Split-Path $p -Leaf))
        continue
    }
    if (-not $scancodes.ContainsKey($s)) { Write-Warning "unknown key '$s'"; continue }
    [void](& $helper tap $scancodes[$s] 1 260)
    Start-Sleep -Milliseconds 320
    $script:i++
    $p = Grab $s
    Write-Host ("[{0:d2}] key {1,-10} {2}   {3}" -f $script:i, $s, (LastInput), (Split-Path $p -Leaf))
}

Write-Host ''
Write-Host "screenshots in $ShotDir"
if (-not $LeaveRunning) { Stop-ThGameProcess; Write-Host 'game stopped.' }
else { Write-Host 'game left running.' }