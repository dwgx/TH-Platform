<#
.SYNOPSIS
    Compile the TH08 SendInput helper (THPInput.cs) into thp_input.exe.

.DESCRIPTION
    This script exists because getting this C# to compile cost about half an
    hour. All three traps below were hit for real and will recur:

    1. INPUT must be exactly the platform size.
       INPUT is { DWORD type; UNION u; } and the union is as large as its
       biggest member, MOUSEINPUT. On x64 that is exactly 40 bytes:
       type(4) + 4 bytes of alignment padding + 32-byte union. Hand-rolled
       trailing padding produced 56 bytes and SendInput failed with error 87
       (ERROR_INVALID_PARAMETER). Use [StructLayout(LayoutKind.Explicit)] on the
       union and let MOUSEINPUT size it. A wrong-sized struct is rejected
       outright, which is at least a loud failure.

    2. Reference-assembly paths contain spaces ("Program Files (x86)").
       Unquoted they split into bogus source-file arguments and csc reports
       CS2001 "could not be found" for fragments like "(x86)" and "Files".
       Every /r: switch is individually quoted below.

    3. Do NOT build this through the PowerShell Add-Type compiler.
       It dies with System.OutOfMemoryException when compiling the full
       INPUT union. That is why this is a standalone EXE at all.

    /noconfig is also passed so csc does not auto-load its csc.rsp, which
    would make the invocation environment-dependent.

.PARAMETER OutputExe
    Where to write thp_input.exe. Default: next to this script.

.PARAMETER Csc
    Path to csc.exe. Default: VS2022 Community Roslyn.

.PARAMETER FrameworkDir
    .NET Framework v4.8 reference-assembly directory. Default: the machine's.

.EXAMPLE
    pwsh -NoProfile -File tools/th-debug/input_helper/build.ps1
#>
[CmdletBinding()]
param(
    [string] $OutputExe,
    [string] $Csc,
    [string] $FrameworkDir
)

$ErrorActionPreference = 'Stop'

$here = $PSScriptRoot
if (-not $OutputExe) { $OutputExe = Join-Path $here 'thp_input.exe' }
$src = Join-Path $here 'THPInput.cs'

if (-not $Csc) {
    $Csc = 'C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\Roslyn\csc.exe'
}
if (-not $FrameworkDir) {
    $FrameworkDir = 'C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8'
}

foreach ($p in @($Csc, $src, "$FrameworkDir\mscorlib.dll", "$FrameworkDir\System.dll", "$FrameworkDir\System.Core.dll")) {
    if (-not (Test-Path -LiteralPath $p)) { throw "missing: $p" }
}

$outDir = Split-Path -Parent $OutputExe
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$cmdline = '/noconfig /nostdlib+ /target:exe ' +
           "/out:`"$OutputExe`" " +
           "/r:`"$FrameworkDir\mscorlib.dll`" " +
           "/r:`"$FrameworkDir\System.dll`" " +
           "/r:`"$FrameworkDir\System.Core.dll`" " +
           "`"$src`""

Write-Host "csc   : $Csc"
Write-Host "src   : $src"
Write-Host "out   : $OutputExe"
Write-Host "refs  : $FrameworkDir"
Write-Host ''

& cmd.exe /c "`"$Csc`" $cmdline"
if ($LASTEXITCODE -ne 0) { throw "csc failed: $LASTEXITCODE" }
if (-not (Test-Path -LiteralPath $OutputExe)) { throw 'no exe produced' }

$exe = Get-Item -LiteralPath $OutputExe
Write-Host "BUILD OK: $OutputExe ($($exe.Length) bytes)"
exit 0