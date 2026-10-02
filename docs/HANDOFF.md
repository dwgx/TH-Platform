# TH-Platform — 历史快照(已归档,勿照此行动)

> **这份文档写于 2026-10-02 归档之前,顶部的「刚刚发生 / 下一个动作」已经过时。**
>
> 当时的「下一个动作」是三条修复车道收口后做双实例复测。那件事**已经做过了**:
> 三个车道全部收口并提交,双实例复测跑完(结果见 `../ARCHIVE.md`),项目随后归档。
>
> **当前状态、坑、以及重启的正确顺序,一律以 [`../ARCHIVE.md`](../ARCHIVE.md) 为准。**
> 保留本文档是因为下面的压缩档案里有 8 条 harness 陷阱和 4 次自我误判的记录,
> 这些内容没有别处副本,且仍然有用。

以下为当时的原始记录,原样保留。

---

**刚刚发生**：**协议评审结论严重**——8 个轴里 6 个判定为 **UNSOUND 或部分不成立**，共 20 个缺陷（F1–F21）+ 3 个设计阻塞（D1–D3）+ 7 处规范自相矛盾（C1–C7），其中 9 个通过执行复现。最重的一条：**修复机制是 TH08 的检测器配 TH06 的修复**——TH06 的重切只重置 RNG 和接收映射，明确**不**重置弹幕/敌人/ECL/位置，它当年能用只因为它的检测器只比一个 u16；THP 给自己换了强得多的检测器，却沿用那个窄修复。另有：版本不匹配对话**不可达**（header_check 先丢掉 ver_major=2）；延迟余量拿「帧数当前时间」用；协议**无法表达「这一帧不能前进」**；`F1` **没有任何比对时也报 MATCH**。评审还诚实标注：原车道的 gcc 半边证据因 WSL 被占**未能自行复核**。评审**没有改任何头文件**——只提案，因为兄弟车道正在改该 API 的消费者。同时 `InjectAuth` 已收口（P1 权威输入完成、倒置测试真失败、补了 socket 接缝测试、诚实声明 P2 仍镜像）；`UiWork` 部分完成但**虚报了 8 行捏造数据仍存在**（我已在源码确认）。已派 `CritFix`/`P2Slot`/`FakeData` 修复。
---

<details>
<summary>以下为上一轮压缩前的完整交接档案（355 行，含 9 个已修缺陷、6 项待办、4 份研究结论、8 条 harness 陷阱、4 次自我误判）。压缩后仍应读。</summary>

原文如下，保留全部细节：

---

## 1. TL;DR for the next session

- The platform **runs end to end** on the web client: `pwsh -NoProfile -File
  D:\Project\TH-Platform\docs\scripts\run-product.ps1` starts the API and the
  client, checks both, tears both down, and leaves no listening port.
- The Tauri desktop shell **compiles for the first time** (it had never built —
  see §5).
- **Gameplay lockstep is NOT proven.** An earlier "PROOF" was retracted in this
  session. Read §4 before believing any sync claim.
- 14 lanes ran; all reports are on disk under
  `D:\Project\TH08-Platform\docs\reports\` and
  `D:\Project\TH-Platform\docs\reports\`.
- One lane (`DemoGate`, board `THP-DEMOGATE-20261002`) is **in flight** at
  compaction time. Check the board first.

---

## 2. Board state

`python C:/Users/dwgx1/.omp/extra-hands/CACHE/board.py reconcile`

| Board ID | Lane | Status |
|---|---|---|
| THP-RULES-20261001 | rules | CLOSE ok |
| THP-CLIENT-20261001 | client wiring | CLOSE ok |
| THP-DLL-20261001 | CJK loader | CLOSE ok |
| THP-SERVER-20261001 | server | CLOSE ok |
| THP-CORS-20261001 | CORS | CLOSE ok |
| THP-E2E-20261001 | integration | CLOSE ok |
| THP-UIAUDIT-20261001 | UI audit | CLOSE ok |
| THP-RESEARCH-20261001 | multi-game research | CLOSE ok |
| THP-MOBILE-20261002 | mobile research | CLOSE ok |
| THP-CN-20261002 | Chinese platform research | CLOSE ok |
| THP-NET-20261002 | networking design | CLOSE ok |
| THP-CLEANUP-20261002 | dead config | CLOSE ok |
| THP-RUSTLOADER-20261002 | Rust loader | CLOSE ok |
| THP-TAURICFG-20261002 | tauri.conf.json | CLOSE ok |
| THP-WIRE-20261002 | room/group wiring | CLOSE ok |
| THP-INPUTHOOK-20261002 | test input override | CLOSE ok |
| **THP-DEMOGATE-20261002** | **attract-mode gating** | **IN FLIGHT** |
| THP-LOCKFILE-20261002 | lockfile repair | OPEN, never dispatched |

---

## 3. What is verified, with the command that proves it

Run from `D:\Project\TH-Platform`:

```powershell
node node_modules\typescript\bin\tsc -b                              # exit 0
node node_modules\vite\bin\vite.js build                            # exit 0
pwsh -NoProfile -File $env:TEMP\thp\e2e_check.ps1                    # exit 0, six pages non-blank
pwsh -NoProfile -File $env:TEMP\thp\contract_check.ps1                # exit 0, 17 routes
pwsh -NoProfile -File D:\Project\TH-Platform\docs\scripts\run-product.ps1   # exit 0
```

From `D:\Project\TH08-Platform\server`: `go build ./...`, `go vet ./...`,
`go test ./...` all exit 0, 156 tests. All 8 migrations were applied up and
down against a real Postgres 16 (EDB native binaries on port 55432, because the
Docker daemon is down and starting Docker Desktop would pop a GUI on the
owner's desktop).

From `D:\Project\TH-Platform\src-tauri`: `cargo build` and `cargo test --bins`
exit 0, 13 tests. The 13th is the wide-character loader work.

**All seven pages now read the real API.** Before this session, zero did.

### The windowed-mode fix — read this before launching the game

th08 defaults to **fullscreen** and there is **no command-line switch**
(`game/src/Supervisor.cpp:834` sets `cfg.windowed = false`; the only override is
the binary `th08.cfg`). The game **rewrites that file on exit**, so the flag
must be re-applied before every launch.

- `cfg.windowed` is **byte offset 34** of the 60-byte `th08.cfg`.
- Offset 17 was tried first and was **wrong** — it lands inside `padYAxis` and
  silently did nothing, which is why the game kept going fullscreen through
  several attempts.
- The offset was established by validating every neighbouring field against the
  game's own defaults: `version@20 == 0x80001`, `padXAxis@24 == 600`,
  `padYAxis@26 == 600`, `lifeCount@28 == 2`, `bombCount@29 == 3`,
  `playSounds@32 == 1`, `defaultDifficulty@33 == 1 (NORMAL)`,
  `effectQuality@36 == 2 (MAXIMUM)`, `musicVolume@39 == 100`, `sfxVolume@40 == 80`.
- Pristine backup: `D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg.orig`.
  Restore fullscreen with `Copy-Item '<path>.orig' '<path>' -Force`.
- `C:\Users\dwgx1\AppData\Local\Temp\thp\force_windowed.ps1` applies it and
  refuses to write if the layout does not validate.

Verify windowed mode by measurement, not assumption — `launch_windowed.ps1`
checks `WS_OVERLAPPEDWINDOW` set, `WS_POPUP` clear, and client area exactly
640x480. A confirmed run reports `outer 646x509 CLIENT 640x480`.

---

## 4. The retracted claim — do not repeat it

**Claimed earlier this session:** frames advanced to 327 and ghost positions
moved, therefore "the netcode reached a real stage".

**Retracted.** The owner pressed no key. A follow-up probe settled it: with a
single instance and no input at all, `g_Supervisor.curState` moves from 1
(title) to 2 (GameManager) after ~26 s and frames run 120→720 unattended.

th08 plays an **attract-mode sequence that reaches the GameManager state**. So
`curState == 2` does **not** mean a human is playing. The measured truth is:

> "the attract sequence runs and the DLL streams ghost positions for a player
> that does not exist."

**Gameplay lockstep remains unproven.** To prove it, a human must drive both
instances into a stage and the two must be compared frame by frame.

### Driving the game without stealing focus

Three approaches were tested, and the results matter:

| Approach | Result |
|---|---|
| `PostMessage(WM_KEYDOWN/UP)` | **Does not work.** th08 reads the keyboard through DirectInput; window messages never reach it. Measured: `input: cur=` stayed `0x0000`. |
| `SendInput` | Would work, but requires the game window to be **foreground** — it is exactly the focus theft the owner forbids. Not used. |
| Writing `g_CurFrameInput` from outside | Fails. `game/src/Supervisor.cpp:74-75` rewrites the word from `Controller::GetInput()` every frame. |
| `TH08_PLATFORM_TEST_INPUT` env var | **Works.** Added by the `InputHook` lane: overrides the input word *inside* the `Controller::GetInput` hook, after `g_original_GetInput()` returns, writing both `g_CurFrameInput` (0x0164D528) and `g_GameInputBits` (0x0164D52C). Verified: `cur=0x0011`, `0x0005`, `0x0080` all reached the game. |

The override is read **once at DLL init**, so changing input mid-session is not
possible with the current design — run one short session per key sequence.
It is test-only, default off, and not reachable from any network path.

**Input bit values — use these, they were wrong in an earlier brief:**

```
0x0001 SHOOT(Z)  0x0002 BOMB(X)  0x0004 FOCUS  0x0008 MENU/SKIP
0x0010 UP         0x0020 DOWN      0x0040 LEFT   0x0080 RIGHT
```

Source: `game/src/Global.hpp:90-106`, ZUN's `TouhouButton` enum. A lane caught
that a brief written earlier in this session had these shifted by two bits,
which would have sent shot-slow when asked for Up.

---

## 5. Defects found and fixed this session

Each was reproduced before and after.

1. **The client could not read the API at all.** No CORS middleware existed:
   preflight returned 405, no `Access-Control-Allow-Origin` on any response, zero
   CORS matches in the tree. Every page silently rendered empty because
   `client.ts` degrades collections to `[]` on a network error. Fixed in the
   server (`internal/api/cors.go`, allowlist from `cors.allowed_origins` /
   `THP_CORS_ALLOWED_ORIGINS`). **No vite proxy** — it only works while vite
   serves the client, and the product ships as a Tauri app where vite is not in
   the request path.
2. **The Tauri desktop app had never compiled.** `withGlobalTauri` sat inside
   the `build` block of `tauri.conf.json`; it belongs at `app` level. It must be
   **moved, not deleted** — `src/lib/tauri/loader.ts` gates the whole
   game-launch path on `window.__TAURI__`, which only exists when the flag is
   true.
3. **The C++ loader could not read a non-ASCII path.** `main(int, char**)` plus
   `CreateProcessA`/`LoadLibraryA`; this machine's ANSI code page is 1252, so a
   Japanese or Chinese install path arrived as `?????`. Converted to
   `wmain` + `CreateProcessW` + `LoadLibraryW`, with the child command line
   re-quoted. **The Rust loader in `src-tauri/src/loader.rs` had the identical
   bug and was fixed too**; it also now emits both `THP_*` and legacy
   `TH08_PLATFORM_*` so the shipped th08 DLL keeps working.
4. **Seven pages displayed fabricated data.** `room.tsx` and `group.tsx` held
   module-level `const SEATS` / `GROUP` / … arrays. All seven now read the API.
5. **The UI lied about encryption.** The room page displayed
   `加密: AES-256-GCM` while the transport is a 152-byte plaintext UDP `Pack`
   and `dll/src` contains no cryptography whatsoever. Now displays `无`, with a
   comment saying why no cipher may be claimed.
6. **The dev page-switcher shipped in the product**, rendered unconditionally
   over the lobby chat composer. Now behind `import.meta.env.DEV`.
7. **Pages did not fill the window.** Tailwind is configured but never applied —
   no `@tailwind` directive anywhere — so `h-full`/`w-full` were inert. Painted
   heights were 864/917/750/571/504/711 of 900; all are 900 now.
8. **The Postgres layer had never been executed.** Running it for real found 8
   defects, 3 of them the in-memory fake lying to the test suite — including a
   seed that claimed a friendship was both accepted and pending, which Postgres
   rejects outright while the fake returned both. Fixed; both backends now agree
   on 55 probes.
9. **A dead second design convention.** `tailwind.config.ts` and
   `postcss.config.js` shipped a token system sharing no variable name with
   `design.css` and read by nothing. Deleted, along with the `tailwindcss` and
   `autoprefixer` devDependencies.

---

## 6. Open work, in the order it should be done

1. **Prove gameplay lockstep.** Needs the owner driving both instances into a
   stage. The discriminator is now going to be logged (see §7), so a future run
   can tell human input from the attract sequence without asking.
2. **`g_delay` and input delay.** `protocol.h` declares `Add_Delay`/`Dec_Delay`
   but nothing implements them; `lockstep.h:40` carries the TODO. RUEEE, whose
   wire format we deliberately match, **is** delay-based lockstep. We copied the
   format and not the mechanism. `NetResearch` also found the 15-frame input
   batch carries 0–233 ms of inherent latency *before* any network contributes,
   which inverts the usual "avoid the relay" instinct.
3. **The address channel is unwired at both ends.** The Rust loader, the C++
   loader and the DLL all read and honour the peer address, but:
   - the `rooms` table has **no address, port or session column**;
   - `launchGame` is defined in `src/lib/tauri/loader.ts` with **zero callers**.
   This is the shortest path from "a working browser" to "a match that starts".
4. **PNP lockfile drift.** `pnpm-lock.yaml` still pins `tailwindcss` and
   `autoprefixer`, which `package.json` no longer lists. A CI running
   `--frozen-lockfile` will fail. `pnpm` is broken on this box
   (`ERR_PNPM_IGNORED_BUILDS`), so this needs a working environment.
5. **Three dead runtime dependencies.** `clsx`, `tailwind-merge` and
   `class-variance-authority` have zero usages in `src/`. `tailwind-merge` has no
   reason to exist now that Tailwind is gone.
6. **`README.md:60` still lists the deleted `tailwind.config.ts`.**

---

## 7. In flight at compaction

`DemoGate` (board `THP-DEMOGATE-20261002`) owns `dll/src/hooks/game_loop.{cpp,h}`,
`dll/src/state/player2_hook.{cpp,h}`, `dll/src/state/peer_ghost.cpp`. Brief:
`C:\Users\dwgx1\AppData\Local\Temp\thp\THP-DEMOGATE-20261002.md`.

Its three deliverables:
1. Do not construct `g_Player2` outside a real, human-driven stage.
2. Do not sample or stream ghost positions outside a real stage.
3. **Make the log distinguish human input from the attract sequence.** This is
   the substance: gating on `curState == 2` alone cannot work, because the demo
   reaches `curState == 2`.

Report path: `D:\Project\TH08-Platform\docs\reports\THP-DEMOGATE-20261002.md`.

---

## 8. Research conclusions (all four reports on disk)

- **th07 before th06, but only after lockstep is proven.** th07 and th08 are the
  same engine: six consecutive `u16` input globals map one-to-one, and
  `some100/th07` publishes the addresses with a 100%-implemented decomp. Cost is
  days, not months. th06 has a single input word instead of the raw/processed
  pair, which is why it ranks lower. `RUEEE/th06_multi_net` already is a working
  th06 co-op — our th06 value-add is the platform, not the netcode.
- **No mobile client.** The demand is real but served, free, by
  `eagler-touhou` (104★, GPL-3.0, pushed the same day) with six games, touch,
  PWA and WebRTC. A dedicated MIT th08 web port (`N0zoM1z0/th08-web`, 55★)
  **declines to claim mobile** in its own browser-support table. Building our own
  would be building a strictly worse copy of a free incumbent.
- **Networking is a discovery problem, not a NAT-traversal problem.**
  `lockstep.cpp` already implements both roles and the host needs no
  configuration — the first inbound packet teaches it the peer address. What is
  missing is discovery, and the two ends that would supply an address are empty
  (§6.3). The 152-byte `Pack` survives all eight topologies considered.
- **The Chinese community has no identity or moderation anywhere.** ThLink
  (32★) is a UDP punch-through tool; eagler routes all support to a QQ group.
  Not one project in the survey has accounts, moderation or reporting. The
  platform's defensible position is depth on native retail-exe injection plus an
  honest platform, and **QQ is where this audience actually lives**.

Compliance was partitioned by evidence strength. **No governing statute was
successfully read** — `gov.cn` 404s, `flk.npc.gov.cn` is a JS SPA,
`beian.miit.gov.cn` 521s. Everything about 版号 / 实名 / 备案 is an open question
for a lawyer, not an answer. Recommendation: run LAN/invite mode as long as
possible; public hosting should be a deliberate decision made afterwards.

---

## 9. Harness traps — these have cost real time

1. **Never start the Go API without draining its stdout.** The pipe fills after
   ~16 requests, the handler goroutine blocks inside `logger.Info`, and the
   whole server wedges *while the process stays alive*. It looks exactly like a
   deadlock and is not one. Measured: undrained wedges at request #17 every
   time; drained answers 40/40. Always `ReadToEndAsync()`.
2. **`Invoke-WebRequest` in PowerShell 7 mis-reads 4xx status enums** —
   `.value__` is `$null`, so every real 404 looks like a failure — and stalls
   the next request on a connection whose 4xx body was never consumed. Use
   `System.Net.Http.HttpClient`.
3. **`Select-String -Path '…\**\*.go'` has no recursive glob.** It reported
   `matches: 0` unconditionally, which agreed with the truth before a fix and
   disagreed after it. Use `Get-ChildItem -Recurse`.
4. **`pnpm typecheck` is a no-op that always exits 0** — the tsconfig is
   solution-style (`files: []` plus `references`). The real check is
   `tsc -b`. Never cite the green.
5. **`pnpm` itself fails here** with `ERR_PNPM_IGNORED_BUILDS`. Use
   `node node_modules\…` directly. `node_modules\.bin\tsc` is not executable
   (Win32 error 193).
6. **The `%TEMP%\thp` script directory loses files** when a lane cleans up
   aggressively; `dll_build.ps1` and `verify_cors.ps1` were both deleted
   mid-session and had to be recreated. If a script is missing, recreate it in
   TEMP only, never in a repo.
7. **A stray `%TEMP%` directory appeared inside `server/`** when a lane built
   with an unexpanded path. `rm -rf` is blocked outside temp by a guard; delete
   the file then `rmdir` the empty directories.
8. **`board.py open` refuses a scope that collides with a live lane** and names
   the holder. It caught a real conflict twice. It also refused to `close` a
   report that did not exist on disk — which is how two research reports that
   could not self-persist were caught rather than silently lost.

---

## 10. Window and focus discipline

The owner works at this machine. Every action is judged by whether it puts a
window on his screen or takes focus:

- Chrome must be `--headless=new`; processes started via `Start-Process` need
  `-WindowStyle Hidden`.
- Game windows are **visible and windowed** (640x480 client) but placed with
  `SWP_NOACTIVATE`, and the owner's original foreground window is restored after
  every placement. **Visible and non-focus-stealing are separate requirements**
  — an earlier version of this work hid the windows entirely, which was
  over-cautious and was corrected at the owner's instruction.
- The owner drives the game with a real keyboard, by clicking the window
  himself.
- Never launch `th08.exe` from a lane, and never write into the game install
  directory.

---

## 11. How this session's own mistakes went

Recorded because the pattern recurred and the next session should not repeat it.

**Three separate times an instrument of mine produced a confident wrong
answer**, and in each case I had written a check, taken its numeric or textual
output as evidence, and never confirmed the check could return anything else:

1. Screenshots taken with no backend running → reported as "the UI is broken".
   It was not; the API simply was not up. **Nearly sent a lane to fix a page
   that was never broken.**
2. `Invoke-WebRequest` reporting 404s as failures → nearly reported a contract
   mismatch that did not exist.
3. `Select-String` reporting `matches: 0` forever → agreed with me while I was
   right, and would have silently hidden a CORS implementation.

A fourth, worse: the service appeared to **deadlock** — every request timing
out, all connections, process alive. A controlled experiment (identical request
sequence, differing only in whether stdout was drained) proved it was my own
harness. Had I dispatched a "fix the deadlock" lane, five workers would have
edited a lock that was never broken while the real bug sat in my script.

**A worker also caught a wrong constant I had written into a brief** — the
input bit table was shifted by two bits, which would have made Up send
shot-slow. It verified against three sources in-repo and refused to follow my
instruction. That is the behaviour to keep.

**And the owner retracted a claim I had already reported** — the lockstep
"PROOF" of §4. Being willing to say "I was wrong" is cheaper than the
alternative.

</details>
