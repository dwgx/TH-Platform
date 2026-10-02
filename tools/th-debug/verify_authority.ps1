<#
Acceptance run for the authoritative-input change.

The criterion is deliberately narrow and checkable:

  PASS  = the desync detector fires NO LATER than it did before, and the run
          produces positive `thp: hash match` lines, and the first desync frame
          has moved later than the previous run's.

  The first-desync-frame number is the progress metric. Before the authoritative
  input existed it was frame 30 — which was not a lockstep bug but the absence
  of one. If the change works, that number moves later. If it stays at 30, the
  change did nothing. If it moves EARLIER, the change made it worse.

  Silence is explicitly NOT a pass. A run with zero desync lines and zero match
  lines means the comparison never ran, which is the exact shape of evidence
  this project retracted a claim on before.

Usage:
  pwsh -NoProfile -File verify_authority.ps1 -ConfirmWindows -PreviousFirstDesync 30
#>
#Requires -Version 7.0
[CmdletBinding()]
param(
    [switch] $ConfirmWindows,
    [int]    $HostPort = 7480,
    [int]    $PeerPort = 7481,
    [int]    $StageSeconds = 20,
    [int]    $PreviousFirstDesync = 30
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
if (-not (Test-Path -LiteralPath $loader)) { Write-Error "loader missing: $loader"; exit 1 }

function Start-Instance([string]$exe, [int]$port, [string[]]$extra) {
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $loader; $psi.UseShellExecute = $false
    $psi.WorkingDirectory = Split-Path $exe -Parent
    $psi.ArgumentList.Add($exe)
    foreach ($a in $extra) { $psi.ArgumentList.Add($a) }
    $psi.ArgumentList.Add('--listen'); $psi.ArgumentList.Add("$port")
    [void][System.Diagnostics.Process]::Start($psi)
}

Write-Host 'launching HOST...'
Start-Instance 'C:\th08game\th08.exe' $HostPort @('--host')
Start-Sleep -Seconds 2
Write-Host 'launching PEER...'
Start-Instance 'C:\th08game_p\th08.exe' $PeerPort @('--peer', "127.0.0.1:$HostPort")
Start-Sleep -Seconds 6

$procs = @(Get-Process -Name th08 -EA SilentlyContinue)
if ($procs.Count -lt 2) { Write-Error "expected 2 instances, found $($procs.Count)"; Stop-ThGameProcess; exit 1 }
Write-Host "instances: $($procs.Id -join ', ')"

function LogOf([int]$p) {
    $f = Join-Path $logDir "log_pid$p.txt"
    if (Test-Path -LiteralPath $f) { Get-Content -LiteralPath $f -EA SilentlyContinue } else { @() }
}

# Drive BOTH into a stage. focuspid matters: plain focus always hits the first
# th08 window, so both sets of keys would land on one instance.
Write-Host ''
Write-Host 'driving both instances into a stage...'
foreach ($k in @('2C','2C','2C','50','2C','2C','2C','50','2C')) {
    foreach ($p in $procs) {
        $null = & $helper focuspid $p.Id
        Start-Sleep -Milliseconds 220
        $null = & $helper tap $k 1 220
    }
    Start-Sleep -Milliseconds 400
}
Write-Host "  done; holding the stage $StageSeconds s"
for ($t = 0; $t -lt $StageSeconds; $t += 4) {
    Start-Sleep -Seconds 4
    foreach ($p in $procs) {
        $null = & $helper focuspid $p.Id
        $null = & $helper tap 50 1 220
    }
}

# ---- evaluate ----
$allMatch = 0
$firstDesync = [int]::MaxValue
$desyncFrames = @()

foreach ($p in $procs) {
    $l = LogOf $p.Id
    $m = @($l | Where-Object { $_ -match 'thp: hash match' })
    # Catch BOTH desync log sites. The immediate path logs
    # "thp: DESYNC at frame N" (thp_session.cpp:453); the deferred path and the
    # dispatcher log "thp: DESYNC detected at session frame N"
    # (lockstep.cpp:337). Reading only one of them is how a false negative in
    # the detector hid for hours -- and this script is the thing that would
    # have caught it.
    $d = @($l | Where-Object { $_ -match 'thp: DESYNC (at|detected at )(session )?frame (\d+)' })
    $allMatch += $m.Count
    foreach ($line in $d) {
        if ($line -match 'thp: DESYNC (at|detected at )(session )?frame (\d+)') { $desyncFrames += [int]$matches[3] }
    }
}
if ($desyncFrames.Count -gt 0) {
    $firstDesync = ($desyncFrames | Measure-Object -Minimum).Minimum
}

Write-Host ''
Write-Host '=== per instance ==='
foreach ($p in $procs) {
    $l = LogOf $p.Id
    $human = @($l | Where-Object { $_ -match 'human=1' }).Count
    $attract = @($l | Where-Object { $_ -match 'ATTRACT/NO-INPUT' }).Count
    $m = @($l | Where-Object { $_ -match 'thp: hash match' }).Count
    $d = @($l | Where-Object { $_ -match 'thp: DESYNC' }).Count
    Write-Host ("  pid {0,-6} human={1,-4} attract={2,-4} matches={3,-5} desyncs={4}" -f $p.Id, $human, $attract, $m, $d)
}

Write-Host ''
Write-Host '=== VERDICT ==='
Write-Host "  positive hash matches:      $allMatch"
if ($desyncFrames.Count -gt 0) {
    Write-Host "  first desync frame:         $firstDesync   (previous run: $PreviousFirstDesync)"
    Write-Host "  all desync frames seen:     $((($desyncFrames | Sort-Object -Unique) -join ', '))"
} else {
    Write-Host '  first desync frame:         none'
}

$verdict = 'INCONCLUSIVE'
if ($allMatch -eq 0 -and $desyncFrames.Count -eq 0) {
    $verdict = 'INCONCLUSIVE'
    Write-Host ''
    Write-Host '  NO comparisons ran. Zero matches AND zero desyncs means the detector'
    Write-Host '  never executed, which is not a pass.'
} elseif ($desyncFrames.Count -eq 0) {
    $verdict = 'PASS'
    Write-Host ''
    Write-Host '  PASS: comparisons ran and the two simulations stayed identical.'
} elseif ($firstDesync -gt $PreviousFirstDesync) {
    $verdict = 'PROGRESS'
    Write-Host ''
    Write-Host "  PROGRESS: first divergence moved from frame $PreviousFirstDesync to $firstDesync."
    Write-Host '  The authoritative input is reaching the game, but the simulations still'
    Write-Host '  diverge. This is a measurable step, not a pass.'
} else {
    $verdict = 'NO-IMPROVEMENT'
    Write-Host ''
    Write-Host "  NO IMPROVEMENT: first divergence is still frame $firstDesync."
    if ($firstDesync -eq $PreviousFirstDesync) {
        Write-Host '  Identical to before. The authority rule is very likely not being applied'
        Write-Host '  to the frame the game actually reads.'
    } else {
        Write-Host '  It moved EARLIER, which means the change made divergence worse.'
    }
}
Write-Host ''
Write-Host "  VERDICT: $verdict"

Stop-ThGameProcess
Write-Host 'both instances stopped.'
exit 0