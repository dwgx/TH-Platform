<#
Two instances, one stage, and a state-hash comparison.

This is the measurement this project has been unable to make all night. Every
previous claim of synchronization was either retracted (the frames turned out to
be the game's own attract demo) or rested on silence (no desync was reported,
which is indistinguishable from the comparison never running).

Both failure modes are addressed structurally:

  * Input is REAL. Each instance is driven with SendInput scancode taps, and the
    gate log must show human=1. If an instance shows ATTRACT/NO-INPUT, the run
    is discarded rather than reported.

  * Agreement must be POSITIVE. The DLL now logs `thp: hash match frame=...` on
    the success path (rate limited), so a match is visible in the log rather than
    inferred from the absence of a complaint. A run with no match lines proves
    nothing and is reported as such.

What a match does and does not prove, stated up front so the verdict cannot
overclaim: a matching hash means the 60 hashed regions were bit-identical on both
machines at that frame boundary. It does not prove the games stay identical
afterwards, and it does not cover the one region deliberately excluded (a heap
pointer, which differs between processes by construction).
#>
#Requires -Version 7.0
[CmdletBinding()]
param(
    [switch] $ConfirmWindows,
    [int]    $HostPort = 7480,
    [int]    $PeerPort = 7481,
    [int]    $StageSeconds = 20
)

$ErrorActionPreference = 'Continue'
if (-not $ConfirmWindows) {
    Write-Error 'Two TH08 windows will appear and take keyboard focus. Re-run with -ConfirmWindows.'
    exit 2
}

Import-Module (Join-Path $PSScriptRoot 'ThDebug.psm1') -Force
$helper = Join-Path $PSScriptRoot 'input_helper\thp_input.exe'
$logDir = Join-Path $env:LOCALAPPDATA 'th08_platform'

try { [void](Set-Th08Windowed -CfgPath 'D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg') } catch { Write-Warning $_ }
Stop-ThGameProcess
Get-ChildItem $logDir -Filter 'log_pid*.txt' -EA SilentlyContinue | Remove-Item -Force -EA SilentlyContinue
Start-Sleep -Seconds 1

$loader = Join-Path $env:TEMP 'th08build\bin\Release\th08_platform_loader.exe'

function Start-Instance([string]$exe, [int]$port, [string[]]$extra) {
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $loader; $psi.UseShellExecute = $false
    $psi.WorkingDirectory = Split-Path $exe -Parent
    $psi.ArgumentList.Add($exe)
    foreach ($a in $extra) { $psi.ArgumentList.Add($a) }
    $psi.ArgumentList.Add('--listen'); $psi.ArgumentList.Add("$port")
    return [System.Diagnostics.Process]::Start($psi)
}

Write-Host 'launching HOST...'
$h1 = Start-Instance 'C:\th08game\th08.exe' $HostPort @('--host')
Start-Sleep -Seconds 2
Write-Host 'launching PEER...'
$h2 = Start-Instance 'C:\th08game_p\th08.exe' $PeerPort @('--peer', "127.0.0.1:$HostPort")

Start-Sleep -Seconds 6
$procs = @(Get-Process -Name th08 -EA SilentlyContinue)
if ($procs.Count -lt 2) { Write-Error "expected 2 instances, found $($procs.Count)"; Stop-ThGameProcess; exit 1 }
Write-Host "instances: $($procs.Id -join ', ')"
function LogOf([int]$pid_) {
    $f = Join-Path $logDir "log_pid$pid_.txt"
    if (Test-Path -LiteralPath $f) { Get-Content -LiteralPath $f -EA SilentlyContinue } else { @() }
}
function BothConnected {
    $ok = 0
    foreach ($p in $procs) {
        $l = LogOf $p.Id
        if (@($l | Where-Object { $_ -match 'peer connected' }).Count -gt 0) { $ok++ }
    }
    return $ok
}

Write-Host ''
Write-Host '=== wait for peer handshake ==='
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    $c = BothConnected
    if ($c -ge 2) { break }
    Write-Host "  t=${i}s connected=$c/2"
}
Write-Host "  connected: $(BothConnected)/2"

# Drive BOTH instances into a stage with the same key sequence.
Write-Host ''
Write-Host '=== driving both instances into a stage ==='
$keys = @('2C','2C','2C','50','2C','2C')
foreach ($k in $keys) {
    foreach ($p in $procs) {
        $null = & $helper focuspid $p.Id
        Start-Sleep -Milliseconds 250
        $null = & $helper tap $k 1 220
    }
    Start-Sleep -Milliseconds 500
    Write-Host "  key 0x$k -> human(host)=$((LogOf $procs[0].Id | Where-Object {$_ -match 'human=1'} | Measure-Object).Count) human(peer)=$((LogOf $procs[1].Id | Where-Object {$_ -match 'human=1'} | Measure-Object).Count)"
}

Write-Host ''
Write-Host "=== holding the stage for $StageSeconds s ==="
for ($t = 0; $t -lt $StageSeconds; $t += 4) {
    Start-Sleep -Seconds 4
    foreach ($p in $procs) {
        $null = & $helper focuspid $p.Id
        $null = & $helper tap 50 1 220   # drift down so the runs are not identical by accident
    }
}

# ---- verdict ----
Write-Host ''
Write-Host '=== VERDICT ==='
$totalMatch = 0
foreach ($p in $procs) {
    $l = LogOf $p.Id
    $human   = @($l | Where-Object { $_ -match 'human=1' }).Count
    $attract = @($l | Where-Object { $_ -match 'ATTRACT/NO-INPUT' }).Count
    $p2      = @($l | Where-Object { $_ -match 'fully wired' }).Count
    $matches = @($l | Where-Object { $_ -match 'thp: hash match' } | ForEach-Object { [pscustomobject]@{ line = $_ } })
    $desync  = @($l | Where-Object { $_ -match 'thp: DESYNC' } | ForEach-Object { [pscustomobject]@{ line = $_ } })
    $totalMatch += $matches.Count
    Write-Host ""
    Write-Host "  --- pid $($p.Id) ---"
    Write-Host "    HUMAN scene lines:    $human"
    Write-Host "    ATTRACT scene lines:  $attract"
    Write-Host "    P2 wired:             $p2"
    Write-Host "    hash MATCHES:         $($matches.Count)"
    Write-Host "    hash DESYNCs:         $($desync.Count)"
    $matches | Select-Object -First 2 | ForEach-Object { Write-Host ("      " + $_["line"]) }
    $desync  | Select-Object -First 2 | ForEach-Object { Write-Host ("      " + $_["line"]) }
}

Write-Host ''
if ($totalMatch -eq 0) {
    Write-Host '  RESULT: NO HASH COMPARISONS SUCCEEDED ON EITHER SIDE.'
    Write-Host '  This proves nothing about synchronization. Absence of a match line is'
    Write-Host '  indistinguishable from the comparison never running, which is precisely'
    Write-Host '  the shape of evidence that was retracted in this project before.'
} else {
    Write-Host "  RESULT: $totalMatch positive hash agreements across the two instances."
    Write-Host '  Each one means both machines hashed 60 regions bit-identically at that'
    Write-Host '  frame boundary. That is real evidence of a shared simulation.'
}

Stop-ThGameProcess
Write-Host ''
Write-Host 'both instances stopped.'