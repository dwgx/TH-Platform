# TH-Platform — operator guide

How to run the API, run the client, point the client at a backend somewhere other
than localhost, switch between mock and real data, and check that any change you
made still works. Everything here has been executed on this machine; the exact
transcripts are in [`reports/THP-E2E-20261001.md`](reports/THP-E2E-20261001.md).

Rules that override anything in this file: [`../AGENTS.md`](../AGENTS.md). This
file only covers running the thing.

---

## 1. What is where

| Block | Path | Language | Notes |
|---|---|---|---|
| Client | `D:/Project/TH-Platform` | React 18 + TS + Vite 6 + Tauri 2 | the repo you are reading this in |
| Server | `D:/Project/TH08-Platform/server` | Go 1.26 + chi + Postgres 16 + Redis 7 | HTTP + WS API |
| Game DLL | `D:/Project/TH08-Platform/dll` | C++20 + MinHook, **32-bit only** | injects into the original `th08.exe` |
| Decompile | `D:/Project/TH08-Platform/game` | C++, AGPL-3.0 | reference only, not on the critical path |

Two config files describe the server, and they are the same file:
`D:/Project/TH08-Platform/server/config/config.example.yaml` is the template, and
`D:/Project/TH-Platform/config.example.yaml` is a copy of it.

The client reads three optional environment variables, all declared in
`src/vite-env.d.ts`, all defaulted inside `src/lib/api/client.ts`, so **the app
runs with no `.env` file at all**:

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8080` | backend origin. Trailing slashes are stripped. |
| `VITE_HANDLE` | `local` | value of the `X-Handle` identity header. There is no auth this round. |
| `VITE_API_USE_MOCK` | unset, i.e. **off** | `1` / `true` / `on` serves `src/lib/api/mock.ts` instead of HTTP. |

---

## 2. Run the whole product in one command

```powershell
pwsh -NoProfile -File docs/scripts/run-product.ps1
```

It builds the API if the sources moved, starts the API on 8080 and the client on
4173, waits for `/healthz` **and** `/readyz` and the web root, prints a summary,
then kills both children and waits for the OS to actually drop the listeners.
Exit code 0 means both came up and both went away. It leaves no listening port
behind, which is why you can run it twice in a row.

Useful switches:

| Switch | Effect |
|---|---|
| `-HoldSeconds 600` | leave both up for ten minutes and print the URLs, for clicking by hand. Ctrl+C still tears down. |
| `-ApiPort 8090 -WebPort 4190` | move off 8080/4173, e.g. when another lane already has them. |
| `-ClientMode dev` | run the Vite dev server instead of serving the built `dist/`. |
| `-UseMock` | client serves mock data and never calls the API. |
| `-ApiBaseUrl http://10.0.0.5:8080` | point the client at another backend. |
| `-RebuildClient` | force a client rebuild. The API is rebuilt on **every** run, on purpose: see the note below. |
| `-SkipApiBuild` | reuse the last API binary instead of rebuilding. Only when you know nothing changed. |
| `-ForcePort` | kill whatever holds the port first. Off by default on purpose: the script will not guess which process is squatting on your port. |

Without `-ForcePort`, a busy port is a hard error that names the port and tells
you how to find the owner, and the process holding it is left alone.

The script always rebuilds the API, and that is not laziness. Several lanes
build this same server into the same `%TEMP%\thp_apibin`, so a cached binary
that is *newer than the newest source file* is not necessarily built from those
sources. During development exactly that staleness made the CORS check below
report `BLOCKED` against a server whose source plainly allowed the origin. A
warm `go build` of this tree is about 1.6 s, so there is nothing to save. The
binary goes to `%TEMP%\thp_apibin\run-product-api.exe`, a path this script owns,
so no other lane can clobber it.

The script also prints the ports it started, the pids it stopped, and a live CORS
verdict for the origin the client is actually served from. If it prints
`cors BLOCKED`, a real browser will show you empty pages, and no amount of
staring at the layout will tell you why.

---

## 3. Run the API by hand

The API reads `config/config.yaml` **relative to its working directory**. That is
the single most common way to start it wrong: from the wrong directory it finds
no config and silently uses defaults.

```powershell
# build
cd D:\Project\TH08-Platform\server
go build -o "$env:TEMP\thp_apibin\thp-api.exe" ./cmd/api

# a run directory that actually has config/config.yaml in it
$run = Join-Path $env:TEMP 'thp_apirun'
New-Item -ItemType Directory -Path (Join-Path $run 'config') -Force | Out-Null
Copy-Item -LiteralPath 'D:\Project\TH08-Platform\server\config\config.example.yaml' `
          -Destination (Join-Path $run 'config\config.yaml') -Force

# start it from there, in-memory store, port 8080
$env:THP_SERVER_PORT   = '8080'
$env:THP_STORE_BACKEND = 'memory'
& "$env:TEMP\thp_apibin\thp-api.exe"   # working directory must be $run
```

Verified: `config.yaml` says `port: 8080`; with `THP_SERVER_PORT=8091` exported
the process listened on **8091**. The env override wins over the file.

Build to a path only you use. `%TEMP%\thp_apibin` is shared with other lanes,
and a binary there can be newer than the sources without having been built from
them, which produces a server that disagrees with the code you are reading.
`docs/scripts/run-product.ps1` sidesteps this by rebuilding every run into its
own filename.

Operational routes: `GET /healthz`, `GET /readyz`, `GET /metrics`,
`GET /v1/version`. Business routes live under `/v1` and are listed in
`../AGENTS.md` section 6.

**`THP_STORE_BACKEND=postgres` has never been run against a real database on this
machine.** The Postgres store exists as code, and the API fails loudly rather
than degrading to memory if you ask for it and cannot reach the DSN, but there is
no proof it works against a live Postgres. Do not assume.

---

## 4. Run the client by hand

Dev server, port 5173:

```powershell
cd D:\Project\TH-Platform
node node_modules\vite\bin\vite.js
```

Production build plus preview, which is what the e2e gate screenshots:

```powershell
cd D:\Project\TH-Platform
node node_modules\typescript\bin\tsc -b          # the real typecheck
node node_modules\vite\bin\vite.js build
node node_modules\vite\bin\vite.js preview --port 4173 --host 127.0.0.1
```

Three things that bite here:

- **`pnpm typecheck` used to be an empty command** and is now `tsc -b`. If you
  ever see it pass in a way you cannot explain, run `tsc -b` directly.
- **`node_modules/.bin/tsc` is not runnable by hand** on this machine; the
  extensionless shim fails with `%1 is not a valid Win32 application`. Always go
  through `node node_modules/typescript/bin/tsc`.
- **Never `tauri dev` or `th08.exe` while the owner is at this machine.** Both
  put windows on his desktop.

### Vite reads `.env` from the client directory

Any `.env`, `.env.local`, `.env.development`, `.env.production` in
`D:/Project/TH-Platform` is picked up automatically. There is none in the repo
today, which is why the defaults in `client.ts` are what you get. Use
`.env.local`; it is gitignored.

---

## 5. Point the client at a backend that is not localhost

Set `VITE_API_BASE_URL` to the backend origin, with the scheme and no trailing
path:

```powershell
# dev server, immediate
$env:VITE_API_BASE_URL = 'http://192.168.1.50:8080'
node node_modules\vite\bin\vite.js

# or via a file
'VITE_API_BASE_URL=http://192.168.1.50:8080' | Set-Content -LiteralPath .env.local
```

For the preview server there is a catch that is easy to get wrong:

> **`VITE_*` values are inlined into the JavaScript bundle at build time.
> `vite preview` serves whatever is already in `dist/`.** Exporting
> `VITE_API_BASE_URL` and then running `preview` against an old `dist/` changes
> nothing, silently. Rebuild, or use `-ClientMode dev`.

```powershell
$env:VITE_API_BASE_URL = 'http://192.168.1.50:8080'
node node_modules\vite\bin\vite.js build      # bakes it in
node node_modules\vite\bin\vite.js preview
```

To make it permanent for a built client, change the default in
`src/lib/api/client.ts` (`BASE_URL`) — one line, one place — or ship a
`.env.production` and rebuild.

Non-localhost backends additionally need the browser to be allowed to read their
responses. See section 8.

---

## 6. Mock data versus real data

The default is **real HTTP**. Mock is opt-in and one variable wide:

```powershell
# mock, dev server
$env:VITE_API_USE_MOCK = '1'
node node_modules\vite\bin\vite.js

# back to real
Remove-Item Env:\VITE_API_USE_MOCK
```

Through the run script: `-UseMock`.

Which route a page consumes determines what a failure looks like, and this
matters when judging whether a page is broken:

- the 11 collection routes degrade to `[]` on any error, so **those pages still
  draw their full layout with zero data**. A screenshot of them proves nothing
  about whether data arrived;
- `getRoom` and `getProfile` degrade to `null`;
- `getMe`, `getGroup`, `getGroupAnnouncement` and `sendMessage` **throw**, and
  pages consuming them can go blank.

Every failure also logs a `console.warn` with the method, URL and status. Open the
browser console before concluding anything about a page.

---

## 7. Verification commands

Run these from `D:/Project/TH-Platform`. Exact transcripts and exit codes are in
[`reports/THP-E2E-20261001.md`](reports/THP-E2E-20261001.md).

```powershell
# client: types, then bundle
node node_modules\typescript\bin\tsc -b
node node_modules\vite\bin\vite.js build

# server: build, vet, tests
cd D:\Project\TH08-Platform\server
go build ./...
go vet ./...
go test ./...

# both at once, health-checked, torn down, no ports left
cd D:\Project\TH-Platform
pwsh -NoProfile -File docs\scripts\run-product.ps1

# full page gate: real API + real client, six routes screenshotted headlessly,
# fails if any page renders essentially empty
pwsh -NoProfile -File $env:TEMP\thp\e2e_check.ps1

# contract: 17 client routes vs the server, field by field
pwsh -NoProfile -File $env:TEMP\thp\contract_check.ps1
```

`run-product.ps1` and `e2e_check.ps1` both start and stop the API and the client
on the same ports, so **do not run them at the same time**. `e2e_check.ps1`
force-kills whatever holds 8080 and 4173; `run-product.ps1` refuses to unless you
pass `-ForcePort`.

### What the gate does not prove

Headless screenshots prove that pixels appeared. They do not prove the pixels
were data, do not prove a human can click anything, and do not touch the game at
all. See section 8 and [`verification.md`](verification.md).

---

## 8. CORS: fixed on 2026-10-01, and it will bite you again

The browser could not reach the API at all until this was fixed. Measured, not
assumed:

- the client fetches an absolute URL, `http://127.0.0.1:8080`, from a page served
  on `http://127.0.0.1:4173`, so every request is cross-origin;
- before the fix the API sent **no `Access-Control-Allow-Origin`**, and a real
  headless Chrome doing exactly that fetch got `TypeError: Failed to fetch`.

It is fixed now. `server/internal/api/cors.go` answers the allowlist from
`cors.allowed_origins`, defaulting to `127.0.0.1:4173`, `localhost:4173`,
`tauri://localhost` and `http://tauri.localhost`. With the fix, `GET /v1/me`
carrying `Origin: http://127.0.0.1:4173` answers:

```
HTTP 200
  Access-Control-Allow-Origin: http://127.0.0.1:4173
  Vary: Origin
```

Two consequences worth knowing:

- **The allowlist is an exact match and only contains port 4173.** Serve the
  client on any other port and the browser is refused again. Override it on the
  API with a comma separated list:
  `THP_CORS_ALLOWED_ORIGINS=http://127.0.0.1:4190,http://192.168.1.5:4173`.
  `docs/scripts/run-product.ps1` checks this for you and exits 1 when the page's
  origin is not allowed, instead of letting you stare at empty pages.
- **Credentials are never enabled.** Identity is the `X-Handle` header, so this
  does not matter yet, but it will when real auth lands.

### Why "the page rendered" is not evidence

This is the trap that cost the most time, and it is still live. When a fetch
fails for any reason, 11 of the client's 17 routes degrade to `[]`. Those pages
then draw their **complete layout with zero data**. A screenshot of them looks
perfect and proves nothing.

Only the profile page went visibly blank, for one reason: `getMe` is one of the
four routes that throws instead of degrading, and `src/pages/profile.tsx` does
`if (!me) return null`. The blank profile was a symptom of a cross-origin
problem, not a bug in `profile.tsx`.

So when you judge a page, look at the data in it, or at the `console.warn` line
the client logs on every failed request. Not at the pixels.

---

## 9. The two harness traps

Both of these have already cost this project real time. Read them before writing
any script that starts the API or makes HTTP calls.

### Trap 1: an undrained stdout pipe wedges the API after about 16 requests

The Go API logs every request to stdout. Start it with
`ProcessStartInfo.RedirectStandardOutput = $true` and then never read the pipe,
and after roughly 16 requests the pipe buffer fills, the handler goroutine blocks
inside `logger.Info`, and **the whole server stops responding while the process
is still alive**. It looks exactly like a deadlock. It is not one, and hunting it
as a deadlock wastes the afternoon.

The fix is two lines, and dropping them is the whole bug:

```powershell
$null = $apiProc.StandardOutput.ReadToEndAsync()
$null = $apiProc.StandardError.ReadToEndAsync()
```

Both calls must be made immediately after `Start`, and the tasks must be held for
the process lifetime. Doing it only for stderr is not enough.

### Trap 2: `Invoke-WebRequest` mis-reads 4xx in PowerShell 7

In PS7, `Invoke-WebRequest` on a 4xx gives a status whose `.value__` is `$null`,
and it never consumes the 4xx response body. The connection is left in a state
where **the next request on it stalls**, so one ignored 404 turns into an
apparent hang one call later, on a completely unrelated endpoint.

Use `System.Net.Http.HttpClient` instead, and always drain the body before you
look at anything else:

```powershell
$http = [System.Net.Http.HttpClient]::new()
$r = $http.SendAsync([System.Net.Http.HttpRequestMessage]::new(
        [System.Net.Http.HttpMethod]::Get, $url)).GetAwaiter().GetResult()
$null = $r.Content.ReadAsStringAsync().GetAwaiter().GetResult()   # ALWAYS drain
$code = [int]$r.StatusCode
```

`run-product.ps1` uses exactly this and nothing else.

### Two more, for whoever writes the next script

- **Windows paths with square brackets need `-LiteralPath`.** The game lives in
  `D:\Game\Touhou\[th08] ...`, and `Copy-Item 'D:\...\th08.exe'` treats `[th08]`
  as a wildcard. Also start child processes with
  `[System.Diagnostics.Process]::Start()` plus `ProcessStartInfo.ArgumentList`;
  `Start-Process -ArgumentList` throws outright on these paths.
- **Write scripts in `pwsh`, not bash.** The MSYS layer rewrites arguments and
  mangles CJK paths and square brackets.

---

## 10. Where the verified line is

[`verification.md`](verification.md) is the table of what has actually been run
and passed versus what is still `[UNVERIFIED]`. Short version: the API builds,
vets and tests green, the client type-checks and bundles, the 17 client routes
match the server field by field, and six of six pages render with a live backend
in a headless browser. **The DLL gameplay sync is not verified. Postgres has
never run against a real database. No human has clicked through this.**