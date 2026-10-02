<#
Build the injected DLL and the loader, 32-bit Release.

Out of tree: everything lands under %TEMP%\th08build, never in the repository.
The build directory is not a source artifact and must not be committed.

Why out of tree: MSBuild's intermediate directory cannot safely live in the
repo, and putting a build tree next to the sources is how people accidentally
commit one.

MSB8029 ("the Intermediate directory or Output directory cannot reside under
the Temporary directory") is EXPECTED here and is not an error. The build is
out of tree precisely because this project has no other writable location it is
entitled to use. Do not "fix" it by moving the output into the repo.

Usage:
  pwsh -NoProfile -File tools/th-debug/dll_build.ps1
#>
#Requires -Version 7.0
[CmdletBinding()]
param(
    [string] $SourceRoot = 'D:\Project\TH08-Platform\dll',
    [string] $BuildDir   = (Join-Path $env:TEMP 'th08build'),
    [string] $Config     = 'Release'
)

$ErrorActionPreference = 'Stop'

$vcvars = Join-Path $env:ProgramFiles 'Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars32.bat'
if (-not (Test-Path -LiteralPath $vcvars)) {
    $vcvars = (Get-ChildItem -Path (Join-Path $env:ProgramFiles 'Microsoft Visual Studio') `
        -Filter 'vcvars32.bat' -Recurse -EA SilentlyContinue |
        Where-Object { $_.FullName -like '*Auxiliary\Build\*' } |
        Select-Object -First 1).FullName
}
if (-not $vcvars -or -not (Test-Path -LiteralPath $vcvars)) {
    throw 'vcvars32.bat not found; the 32-bit toolchain is required. th08 is a 32-bit process and a 64-bit DLL cannot load into it.'
}

New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null

Write-Host "source : $SourceRoot"
Write-Host "build  : $BuildDir"

$cmd = "`"$vcvars`" >nul 2>&1 && cmake -S `"$SourceRoot`" -B `"$BuildDir`" -A Win32 && cmake --build `"$BuildDir`" --config $Config"

& cmd.exe /c $cmd
if ($LASTEXITCODE -ne 0) {
    throw "configure or build failed with exit code $LASTEXITCODE"
}

# The build succeeding is not the same as the artifacts existing. Report the
# real sizes so a truncated or stale binary cannot pass unnoticed.
$expected = @('th08_platform.dll', 'th08_platform_loader.exe')
$missing = @()
foreach ($name in $expected) {
    $p = Join-Path $BuildDir "bin\$Config\$name"
    if (Test-Path -LiteralPath $p) {
        $kb = [math]::Round((Get-Item -LiteralPath $p).Length / 1KB, 1)
        Write-Host ("  {0,-28} {1,7} KB" -f $name, $kb)
    } else {
        $missing += $name
    }
}
if ($missing.Count -gt 0) {
    throw "build reported success but these artifacts are missing: $($missing -join ', ')"
}

Write-Host 'BUILD OK'