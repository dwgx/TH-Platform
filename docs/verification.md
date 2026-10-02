# Verification status

What has actually been executed on this machine, and what has not. Updated
2026-10-01, after the CORS fix landed. Transcripts are in
[`reports/THP-E2E-20261001.md`](reports/THP-E2E-20261001.md).

The rule this table follows: a row is verified only if a command was run and its
real output seen. "It should work", "the code looks right" and "it passed on
someone else's machine" are all `[UNVERIFIED]`.

## Verified

| # | Claim | How it was verified | Result |
|---|---|---|---|
| 1 | Go API builds | `go build ./...` | exit 0, 10 packages |
| 2 | Go API vets clean | `go vet ./...` | exit 0 |
| 3 | Go API tests pass | `go test ./...` | exit 0, 84 test functions, 10 packages ok |
| 4 | 17 client routes match the server field by field | `contract_check.ps1` against live API responses | exit 0 |
| 5 | Client type-checks | `node node_modules/typescript/bin/tsc -b` | 0 errors |
| 6 | Client bundles | `node node_modules/vite/bin/vite.js build` | built in 1.80s |
| 7 | All six pages render with a live backend | `pwsh -NoProfile -File $env:TEMP\thp\e2e_check.ps1` | **exit 0**, `E2E OK: all 6 pages rendered with a live backend` |
| 8 | Pages render *data*, not just chrome | same run, PNG sizes against the pre-fix run on the identical bundle | lobby 68,817 → 147,005 B; dm 47,285 → 95,001 B; profile 19,437 (blank) → 61,017 B |
| 9 | API `/healthz` and `/readyz` answer 200 | `run-product.ps1` step 3 | 200/200, every run |
| 10 | `THP_SERVER_PORT` overrides `config.yaml` | started the API with `config.yaml` at 8080 and `THP_SERVER_PORT=8091` | process listened on **8091** |
| 11 | `VITE_*` are baked in at build time, not read at serve time | built with `VITE_API_BASE_URL=http://example.invalid:9999`, `VITE_HANDLE=bakecheck`, `VITE_API_USE_MOCK=1`, then grepped the emitted bundle | both strings present in `dist/assets/*.js`, mock branch baked in |
| 12 | One-command run script starts and stops both halves | `run-product.ps1`, twice in a row on the same ports | both exit 0; independent OS check found nothing listening afterwards |
| 13 | Run script tears down on failure after both are up | `run-product.ps1 -ExpectWebStatus 404` | exit 1, both pids stopped, ports free |
| 14 | Run script refuses a port it did not open | unrelated squatter on the API port, run without `-ForcePort` | exit 1 naming the finding command; squatter still alive |
| 15 | Run script handles dev mode and mock mode | `run-product.ps1 -ClientMode dev -UseMock` | exit 0, torn down clean |
| 16 | Run script detects a CORS mismatch | `-WebPort 4190`, an origin not on the allowlist | reported `cors BLOCKED`, exit 1 |
| 17 | API now emits `Access-Control-Allow-Origin` | `GET /v1/me` with `Origin: http://127.0.0.1:4173` | `HTTP 200`, header present, `Vary: Origin` |
| 18 | Before that fix the browser really was refused | headless Chrome fetch to `http://127.0.0.1:8080/v1/me` | `TypeError: Failed to fetch`; and no ACAO header on the response |

## Not verified

| # | Claim | Why it is still open |
|---|---|---|
| 1 | **DLL gameplay lockstep sync** | UDP packets cross, `peer connected` is logged, 20 ghost packets arrive both ways. Both instances sat on the title screen: `f=0` constant, `x=0.0 y=0.0` constant, score moving. Lockstep has never been observed actually syncing. Proving it needs a human to drive both instances **into a stage**, which needs the game window, which the owner has not authorised. |
| 2 | **Postgres store** | `THP_STORE_BACKEND=postgres` has never run against a real database. The code path exists and the API is supposed to fail loudly rather than degrade, but neither has been observed. No Postgres was ever started on this machine. |
| 3 | **Human click-through** | Nobody has clicked anything. Every page result in this repo comes from headless screenshots. No lane had a browser-driving channel, and `tauri dev` is banned while the owner is at the machine. Rendering real data is verified; *interacting with it* is not. |
| 4 | **WebSocket chat, in a browser** | The hub and its routes exist and are unit tested server-side. No browser has ever held a socket open, so message delivery is unproven end to end. |
| 5 | **The packaged Tauri app** | Never built or run. `tauri build` untested. The webview origin (`tauri://localhost` on Windows) is on the CORS allowlist but nothing has confirmed that is what it actually reports. |
| 6 | **Redis** | `redis.addr` is configured and defaulted. Nothing in the API reads it and no Redis was ever started. |
| 7 | **matchmaking / relay** | `cmd/relay` and `internal/matchmaking` are placeholders. |
| 8 | **Multi-game beyond th08** | Six routes, one game. The `game` query parameter is wired but only ever exercised with `th08`. |
| 9 | **Auth** | Out of scope by decision. Identity is the `X-Handle` header, and CORS credentials are deliberately disabled. |
| 10 | **The game, at all** | No lane in this wave launched `th08.exe`. Everything above is platform-side. |

## Deliberately not tested

Some things look like they want tests and should not have any:

- the run script's own exit codes, driven by `-ExpectWebStatus`. That parameter
  exists to make the teardown-on-failure path provable on demand; it is not a
  product feature and gets no test suite of its own;
- `docs/` prose.

---

## Reading the page results correctly

The e2e gate prints one line per page and fails on anything under 20 KB. That
catches a genuinely blank page. It does **not** catch a page that rendered its
full layout with no data in it, because the client's failure policy degrades 11
of its 17 routes to `[]` on any error, including a blocked cross-origin request.

That is not hypothetical. Between the first run of this wave and the CORS fix,
five of six pages were reported as `rendered` while the browser was receiving
nothing at all, and `profile` was blank only because `getMe` throws instead of
degrading. The byte sizes in row 8 are the tell: real data roughly doubled them.

**A green screenshot is evidence about layout, never about data.**