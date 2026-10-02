<#
Compile and run the host-side DLL tests, then state plainly what the result
does and does not prove.

The tests call the session and state-hash APIs directly. They never open a
socket, never launch the game, and never cross the seam between the protocol
and the transport. **That seam is where five silent bugs lived while all 264
checks stayed green.** A green run here means the units are correct; it says
nothing about whether two machines would agree.

Read the output that way.

Usage:
  pwsh -NoProfile -File tools/th-debug/dll_test.ps1
#>
#Requires -Version 7.0
[CmdletBinding()]
param(
    [string] $SourceRoot = 'D:\Project\TH08-Platform',
    [string] $WorkDir    = (Join-Path $env:TEMP 'th08test')
)

$ErrorActionPreference = 'Stop'

$vcvars = Join-Path $env:ProgramFiles 'Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars32.bat'
if (-not (Test-Path -LiteralPath $vcvars)) {
    throw 'vcvars32.bat not found; these tests must be built x86, matching the DLL.'
}

$src = Join-Path $SourceRoot 'dll\tests\thp_state_test.cpp'
if (-not (Test-Path -LiteralPath $src)) {
    throw "test source not found: $src"
}

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
$exe = Join-Path $WorkDir 'thp_state_test.exe'

$cmd = "`"$vcvars`" >nul 2>&1 && cl /nologo /EHsc /std:c++20 /W4 /O2 " +
       "/I`"$SourceRoot\dll\include`" /I`"$SourceRoot\dll\src`" /I`"$SourceRoot\protocol`" " +
       "/Fe`"$exe`" `"$src`" /Fo`"$WorkDir\\`""

& cmd.exe /c $cmd
if ($LASTEXITCODE -ne 0) {
    throw "compile failed with exit code $LASTEXITCODE"
}

Write-Host ''
Write-Host '--- running ---'
& $exe
$runExit = $LASTEXITCODE

Write-Host ''
if ($runExit -ne 0) {
    Write-Host "TESTS FAILED (exit $runExit)"
    exit $runExit
}

Write-Host ''
Write-Host 'Host-side units pass. What that does NOT establish:'
Write-Host '  - that two instances agree (needs the live two-instance run)'
Write-Host '  - that the socket path is correct (these tests never open one)'
Write-Host '  - that the game is deterministic (needs the live run)'
Write-Host 'Five silent bugs previously survived a fully green run of these tests.'
exit 0