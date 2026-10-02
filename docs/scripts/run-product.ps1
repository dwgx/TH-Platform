#Requires -Version 7.0
<#
.SYNOPSIS
    Runs the whole TH-Platform product locally in one command: the Go API plus the
    client, health-checked, then torn down leaving no listening port behind.

.DESCRIPTION
    Start -> verify -> tear down, in that order, on every exit path: success,
    failure, and Ctrl+C. The teardown guarantee is the point of this script:
    after it returns, both ports are free, so it can be run twice in a row and
    the second run must succeed. That is the proof the first run cleaned up.

    Nothing appears on the owner's desktop. Both child processes are started
    through ProcessStartInfo with WindowStyle=Hidden and UseShellExecute=false.

    Two harness traps this script is built around. Both have already cost a lane
    time; do not "simplify" them away.

    TRAP 1 -- an undrained stdout pipe wedges the API.
        The Go API logs every request to stdout. A redirected pipe that nobody
        reads fills after roughly 16 requests; the handler goroutine then blocks
        inside logger.Info while the process stays alive, so it looks exactly
        like a deadlock and is not one. Both children therefore get an immediate
        ReadToEndAsync() on stdout AND stderr, held for the process lifetime.

    TRAP 2 -- Invoke-WebRequest mis-reads 4xx in PowerShell 7.
        In PS7 the .value__ of the status enum comes back $null for 4xx, and the
        body of a 4xx response is never consumed, so the NEXT request on that
        connection stalls. Every HTTP check here uses System.Net.Http.HttpClient
        and always drains Content before inspecting anything else.

    A third thing this script refuses to do: kill a port holder it did not start.
    If the port is busy it stops and tells you the pid. -ForcePort is opt-in.

.PARAMETER ClientMode
    preview : serve the built dist/ (default; this is what the e2e gate shoots).
    dev     : run the Vite dev server instead, which reads VITE_* at start.

.PARAMETER HoldSeconds
    >0 keeps both processes up that many seconds and prints the URLs, for
    driving the app by hand. Ctrl+C during the hold still tears everything down.

.EXAMPLE
    pwsh -NoProfile -File docs/scripts/run-product.ps1
    Starts both, health-checks both, tears both down, exits 0, no ports left.

.EXAMPLE
    pwsh -NoProfile -File docs/scripts/run-product.ps1 -HoldSeconds 600
    Same, but leaves the product up for ten minutes to click through by hand.
#>
[CmdletBinding()]
param(
    [int]$ApiPort = 8080,
    [int]$WebPort = 4173,
    [ValidateSet('preview', 'dev')]
    [string]$ClientMode = 'preview',
    [string]$ApiBaseUrl = '',
    [string]$Handle = 'local',
    [switch]$UseMock,
    [int]$HoldSeconds = 0,
    [switch]$SkipApiBuild,
    [switch]$RebuildClient,
    [switch]$ForcePort,
    [string]$ServerDir = 'D:\Project\TH08-Platform\server',
    # Verification hook. The web root must answer exactly this status; the
    # default is the normal case. Pass a different value to prove that a
    # failure raised AFTER both processes are already up still tears them down
    # and frees the ports.
    [int]$ExpectWebStatus = 200
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $PSCommandPath
$clientDir = Split-Path -Parent (Split-Path -Parent $scriptDir)   # repo root
$binDir    = Join-Path $env:TEMP 'thp_apibin'
$apiRunDir = Join-Path $env:TEMP 'thp_apirun'
$viteJs    = 'node_modules/vite/bin/vite.js'

if ([string]::IsNullOrWhiteSpace($ApiBaseUrl)) { $ApiBaseUrl = "http://127.0.0.1:$ApiPort" }
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

$children = New-Object System.Collections.ArrayList
$claimedPorts = New-Object System.Collections.ArrayList
$exitCode = 0

function Start-Hidden {
    param(
        [string]$File,
        [string]$Cwd,
        [hashtable]$EnvVars = @{},
        [string[]]$Pre = @()
    )
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $File
    $psi.UseShellExecute = $false          # required for redirection + Hidden
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.WindowStyle = 'Hidden'
    $psi.WorkingDirectory = $Cwd
    foreach ($a in $Pre) { $psi.ArgumentList.Add($a) }
    foreach ($k in $EnvVars.Keys) { $psi.Environment[$k] = [string]$EnvVars[$k] }
    return [System.Diagnostics.Process]::Start($psi)
}

function Drain {
    # TRAP 1. Never drop these calls: an unread stdout pipe wedges the Go API
    # after ~16 requests while the process still looks alive.
    param([System.Diagnostics.Process]$Proc)
    $null = $Proc.StandardOutput.ReadToEndAsync()
    $null = $Proc.StandardError.ReadToEndAsync()
}

# Listening TCP ports, straight from the OS socket table.
#
# Deliberately not Get-NetTCPConnection: that is a CIM cmdlet, it is slow, and it
# returned an empty set inside a child pwsh during development, which made this
# script report "ports released" while both of its children were still alive and
# listening. IPGlobalProperties cannot silently do that.
function Get-ListeningPorts {
    [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().
        GetActiveTcpListeners().Port
}

function Assert-PortFree {
    param([int]$Port, [string]$What)
    $taken = @(Get-ListeningPorts | Where-Object { $_ -eq $Port })
    if ($taken.Count -eq 0) { return }
    if (-not $ForcePort) {
        throw (@(
            "{0} port {1} is already listening and this script did not start it." -f $What, $Port
            "Find the owner:  Get-NetTCPConnection -LocalPort $Port -State Listen | Select-Object -ExpandProperty OwningProcess"
            "Stop it yourself, or re-run with -ForcePort to let this script do it."
            "The default refuses to guess so it can never take down an unrelated process."
        ) -join [Environment]::NewLine)
    }
    Write-Host "  -ForcePort: freeing port $Port"
    $pids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
              Select-Object -ExpandProperty OwningProcess -Unique)
    $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    for ($i = 0; $i -lt 50; $i++) {
        if (-not (@(Get-ListeningPorts | Where-Object { $_ -eq $Port }).Count)) { return }
        Start-Sleep -Milliseconds 100
    }
    throw "port $Port still listening after -ForcePort"
}

# TRAP 2. HttpClient plus a mandatory content drain. Never Invoke-WebRequest.
function Get-Status {
    param([System.Net.Http.HttpClient]$Http, [string]$Url)
    try {
        $res = $Http.SendAsync([System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $Url)).
            GetAwaiter().GetResult()
        $null = $res.Content.ReadAsStringAsync().GetAwaiter().GetResult()   # always drain
        [int]$res.StatusCode
    } catch {
        $null   # not up yet
    }
}

# One response header, with the body drained first. Same TRAP 2 rules as
# Get-Status: never leave a response body unread.
function Get-Header {
    param(
        [System.Net.Http.HttpClient]$Http,
        [string]$Url,
        [string]$Name,
        [string]$Origin
    )
    try {
        $msg = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $Url)
        if ($Origin) { $msg.Headers.TryAddWithoutValidation('Origin', $Origin) | Out-Null }
        $res = $Http.SendAsync($msg).GetAwaiter().GetResult()
        $null = $res.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $vals = $null
        if ($res.Headers.TryGetValues($Name, [ref]$vals)) { return ($vals -join ', ') }
        return $null
    } catch {
        $null
    }
}

function Wait-For {
    param(
        [System.Net.Http.HttpClient]$Http,
        [string]$Url,
        [int]$Expected,
        [string]$What,
        [System.Diagnostics.Process]$Proc
    )
    for ($i = 0; $i -lt 120; $i++) {
        if ($Proc -and $Proc.HasExited) { throw "$What exited early (exit code $($Proc.ExitCode))" }
        $code = Get-Status -Http $Http -Url $Url
        if ($code -eq $Expected) { return }
        Start-Sleep -Milliseconds 250
    }
    throw "$What never answered $Expected on $Url (last seen: $(Get-Status -Http $Http -Url $Url))"
}

function Invoke-Tool {
    param([string]$Tool, [string]$Cwd, [string[]]$ToolArgs, [hashtable]$EnvVars = @{})
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $Tool
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.WindowStyle = 'Hidden'
    $psi.WorkingDirectory = $Cwd
    foreach ($a in $ToolArgs) { $psi.ArgumentList.Add($a) }
    foreach ($k in $EnvVars.Keys) { $psi.Environment[$k] = [string]$EnvVars[$k] }
    $p = [System.Diagnostics.Process]::Start($psi)
    $out = $p.StandardOutput.ReadToEndAsync()
    $err = $p.StandardError.ReadToEndAsync()
    $p.WaitForExit()
    $stdout = $out.GetAwaiter().GetResult()
    $stderr = $err.GetAwaiter().GetResult()
    if ($p.ExitCode -ne 0) {
        throw "$Tool exited $($p.ExitCode)`n--- stdout ---`n$stdout`n--- stderr ---`n$stderr"
    }
    return $stdout
}

try {
    $http = [System.Net.Http.HttpClient]::new()
    $http.Timeout = [TimeSpan]::FromSeconds(8)

    Write-Host "thp run-product  client=$ClientMode  api=$ApiBaseUrl  handle=$Handle  mock=$([bool]$UseMock)"
    Write-Host ''

    # ---------- 1. ports ----------
    Write-Host '[1/6] ports'
    Assert-PortFree -Port $ApiPort -What 'api'
    Assert-PortFree -Port $WebPort -What 'web'
    Write-Host "  $ApiPort and $WebPort are free"

    # ---------- 2. api build ----------
    Write-Host '[2/6] api build'
    # Always rebuild, into a path this script owns.
    #
    # Both halves of that are deliberate. A warm go build of this tree is about
    # 1.6 s, so there is nothing to save. And a cached binary at a shared temp
    # path is a lie waiting to happen: several lanes build this same server into
    # the same %TEMP%\thp_apibin, and a binary newer than the sources is not
    # therefore built from them. During development exactly that staleness made
    # the CORS check below report BLOCKED against a server whose source plainly
    # allowed the origin. "Newer than the newest source" is not "up to date".
    $apiExe = Join-Path $binDir 'run-product-api.exe'
    if ($SkipApiBuild -and (Test-Path -LiteralPath $apiExe)) {
        Write-Host "  reusing $apiExe (-SkipApiBuild)"
    } else {
        New-Item -ItemType Directory -Path $binDir -Force | Out-Null
        Write-Host '  go build ./cmd/api ...'
        Invoke-Tool -Tool 'go' -Cwd $ServerDir -ToolArgs @('build', '-o', $apiExe, './cmd/api') | Out-Null
    }

    # ---------- 3. api start ----------
    Write-Host '[3/6] api'
    $cfgDir = Join-Path $apiRunDir 'config'
    New-Item -ItemType Directory -Path $cfgDir -Force | Out-Null
    $cfgSrc = Join-Path $ServerDir 'config\config.example.yaml'
    if (-not (Test-Path -LiteralPath $cfgSrc)) { $cfgSrc = Join-Path $clientDir 'config.example.yaml' }
    Copy-Item -LiteralPath $cfgSrc -Destination (Join-Path $cfgDir 'config.yaml') -Force
    Write-Host "  starting on $ApiPort (store=memory) ..."
    $apiProc = Start-Hidden -File $apiExe -Cwd $apiRunDir -EnvVars @{
        THP_SERVER_PORT   = "$ApiPort"
        THP_STORE_BACKEND = 'memory'
    }
    $null = $children.Add($apiProc)
    $null = $claimedPorts.Add($ApiPort)
    Drain -Proc $apiProc
    Write-Host "  api pid=$($apiProc.Id)"
    Wait-For -Http $http -Url "http://127.0.0.1:$ApiPort/healthz" -Expected 200 -What 'api /healthz' -Proc $apiProc
    Wait-For -Http $http -Url "http://127.0.0.1:$ApiPort/readyz" -Expected 200 -What 'api /readyz' -Proc $apiProc
    Write-Host '  api healthy (/healthz and /readyz both 200)'

    # ---------- 4. client ----------
    Write-Host "[4/6] client ($ClientMode)"
    $clientEnv = @{
        VITE_API_BASE_URL = $ApiBaseUrl
        VITE_HANDLE       = $Handle
    }
    if ($UseMock) { $clientEnv['VITE_API_USE_MOCK'] = '1' }

    if ($ClientMode -eq 'preview') {
        $distIndex = Join-Path $clientDir 'dist\index.html'
        if ($RebuildClient -or -not (Test-Path -LiteralPath $distIndex)) {
            Write-Host '  vite build ...'
            $built = Invoke-Tool -Tool 'node' -Cwd $clientDir -ToolArgs @($viteJs, 'build') -EnvVars $clientEnv
            ($built -split "`r?`n") | Where-Object { $_ -match 'built in|error' } |
                Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
        } else {
            # VITE_* are inlined at build time, not read at serve time. Serving a
            # dist that was built against other settings silently ignores them.
            Write-Host '  serving existing dist (use -RebuildClient to re-bake VITE_* into it)'
        }
        $webArgs = @($viteJs, 'preview', '--port', "$WebPort", '--host', '127.0.0.1', '--strictPort')
    } else {
        $webArgs = @($viteJs, '--port', "$WebPort", '--host', '127.0.0.1', '--strictPort')
    }
    $webProc = Start-Hidden -File 'node' -Cwd $clientDir -Pre $webArgs -EnvVars $clientEnv
    $null = $children.Add($webProc)
    $null = $claimedPorts.Add($WebPort)
    Drain -Proc $webProc
    Write-Host "  client pid=$($webProc.Id)"
    $webRoot = "http://127.0.0.1:$WebPort/"
    Wait-For -Http $http -Url $webRoot -Expected $ExpectWebStatus -What 'client web root' -Proc $webProc
    Write-Host "  web up on $WebPort"

    # ---------- 5. summary ----------
    Write-Host '[5/6] summary'
    Write-Host "  api        $ApiBaseUrl        (/healthz /readyz /v1/version)"
    Write-Host "  client     $webRoot"
    if ($UseMock) {
        Write-Host '  data       mock (no backend calls at all)'
    } else {
        Write-Host "  data       real HTTP -> $ApiBaseUrl"
    }
    Write-Host "  identity   X-Handle: $Handle"
    if (-not $UseMock) {
        # The client calls the API cross-origin, so the browser can only read the
        # response if the API sends Access-Control-Allow-Origin for the page's
        # origin. Report the truth rather than a remembered verdict: this is the
        # single thing that silently turns every page into an empty layout.
        $pageOrigin = $webRoot.TrimEnd('/')
        $allow = Get-Header -Http $http -Url "$ApiBaseUrl/v1/me" -Name 'Access-Control-Allow-Origin' -Origin $pageOrigin
        Write-Host ''
        if ($allow) {
            Write-Host "  cors       OK, API allows $allow"
        } else {
            Write-Host '  cors       BLOCKED: the API sends no Access-Control-Allow-Origin for'
            Write-Host "             $pageOrigin . A real browser will refuse every fetch. Pages that"
            Write-Host '             degrade to [] will still draw their layout with no data.'
            Write-Host '             Allow this origin: THP_CORS_ALLOWED_ORIGINS=<origin> on the API.'
            Write-Host '             See docs/README.md section 8.'
            $exitCode = 1
        }
    }

    # ---------- 6. hold / tear down ----------
    Write-Host ''
    if ($HoldSeconds -gt 0) {
        Write-Host "[6/6] holding $HoldSeconds s -- Ctrl+C tears down too"
        Start-Sleep -Seconds $HoldSeconds
    } else {
        Write-Host '[6/6] tearing down'
    }
}
catch {
    Write-Host ''
    Write-Host ("FAILED: {0}" -f $_.Exception.Message)
    $exitCode = 1
}
finally {
    # Kill what this script started, and only that. WaitForExit is the
    # authoritative "it is gone" signal; the port table is the second opinion.
    $survivors = @()
    foreach ($p in $children) {
        if ($null -eq $p) { continue }
        $gone = $p.HasExited
        if (-not $gone) {
            Write-Host ("  stopping pid {0}" -f $p.Id)
            try {
                $p.Kill($true)                 # whole tree, not just the root
                $gone = $p.WaitForExit(8000)
            } catch {
                Write-Host ("  kill failed for pid {0}: {1}" -f $p.Id, $_.Exception.Message)
            }
        }
        if (-not $gone) { $survivors += $p.Id }
    }

    # Only ports this run actually claimed. A run that aborted before starting
    # anything must not report someone else's listener as its own failure.
    $mine = @($claimedPorts | Sort-Object -Unique)
    if ($mine.Count -gt 0) {
        for ($i = 0; $i -lt 50; $i++) {
            $stillUp = @(Get-ListeningPorts | Where-Object { $mine -contains $_ })
            if ($stillUp.Count -eq 0) { break }
            Start-Sleep -Milliseconds 100
        }
        $stillUp = @(Get-ListeningPorts | Where-Object { $mine -contains $_ } | Sort-Object -Unique)
        if ($stillUp.Count -eq 0) {
            Write-Host ("ports released: {0}" -f ($mine -join ', '))
        } else {
            Write-Host ("  WARNING: this run left something listening on {0}" -f ($stillUp -join ', '))
            $exitCode = 1
        }
    }
    if ($survivors.Count -gt 0) {
        Write-Host ("  WARNING: child processes survived teardown: {0}" -f ($survivors -join ', '))
        $exitCode = 1
    }
}

exit $exitCode