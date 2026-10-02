<#
.SYNOPSIS
    Put th08 into windowed mode by setting byte 34 of th08.cfg to 1.

.DESCRIPTION
    The game rewrites th08.cfg on exit, so this is NOT a one-time edit. It
    must be re-applied before every launch. Every other script here calls the
    same Set-Th08Windowed function rather than carrying its own copy of the
    byte-34 write.

    Does not launch the game. Safe to run at any time.

.PARAMETER CfgPath
    Full path to th08.cfg. The default is this machine's CJK install path and
    is therefore machine-specific; override it on any other box.

.PARAMETER Backup
    Copy th08.cfg to th08.cfg.orig before writing, if that backup does not
    already exist. Off by default: the layout validation plus the
    exactly-one-byte-changed check already bound the blast radius to a single
    byte, and the backup otherwise litters the game directory.

.EXAMPLE
    pwsh -NoProfile -File tools/th-debug/force_windowed.ps1
#>
[CmdletBinding()]
param(
    [string] $CfgPath = 'D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg',
    [switch] $Backup
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

Import-Module (Join-Path $PSScriptRoot 'ThDebug.psm1') -Force

if ($Backup) {
    $bak = "$CfgPath.orig"
    if (-not (Test-Path -LiteralPath $bak)) {
        Copy-Item -LiteralPath $CfgPath -Destination $bak
        Write-Host "backed up -> $bak"
    } else {
        Write-Host "backup already exists, left alone: $bak"
    }
}

try {
    $changed = Set-Th08Windowed -CfgPath $CfgPath
    if ($changed) {
        Write-Host "th08 is now configured for WINDOWED mode."
    } else {
        Write-Host "th08.cfg was already windowed; nothing written."
    }
    Write-Host "NOTE: the game rewrites th08.cfg on exit. Run this again before the next launch."
    exit 0
} catch {
    Write-Error $_
    exit 1
}