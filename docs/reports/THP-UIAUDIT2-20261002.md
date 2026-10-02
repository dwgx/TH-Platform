# THP-UIAUDIT2-20261002 — Web client audit

Lane: `src/**` + this report. No git. Headless Chrome only.

## Pre-flight: is the API actually up?

Checked before blaming any page — this project has already paid once for
screenshotting with the API down and calling a working UI broken.

```
curl http://127.0.0.1:8080/healthz                       -> 200
curl -H "X-Handle: local" ".../v1/rooms?game=th08"       -> 200, 6 rooms
curl http://127.0.0.1:4173/                              -> 200
```

The API was **live for the entire audit**. Every finding below is a real client
defect or a real backend gap, not a dead-server artefact.

**Headless browser only** — managed Chromium, `headed: false`, no window ever
put on the owner's desktop.

## Verification commands (both re-run last, after all edits)

```
node node_modules\typescript\bin\tsc -b    -> exit 0
node node_modules\vite\bin\vite.js build  -> exit 0, 1600 modules, built in 4.87s
```

Screenshots: `C:\Users\dwgx1\AppData\Local\Temp\thp\uiaudit2\*.png`

## The most important thing this audit found

**`tsc -b` cannot catch a broken page.** All six page files begin with
`// @ts-nocheck`, so they are parsed but not type-checked. During this work I
deleted a `const [tab, setTab] = useState(...)` line from `lobby.tsx`; `tsc -b`
exited 0 and `vite build` exited 0, and **the entire application rendered a blank
page** — all six pages, because `App.tsx` imports all six. The two commands the
brief names as acceptance would both have declared success on a totally broken
build.

So I added a real browser render check and ran it after every change
(`%TEMP%\thp\uiaudit2\smoke.mjs`). Final state, all seven routes:

```
PASS lobby     root=60388 text=980  err=0
PASS room      root=98634 text=1223 err=0
PASS group     root=47053 text=884  err=0
PASS dm        root=46352 text=445  err=0
PASS dmthread  root=37094 text=493  err=0
PASS profile   root=29336 text=336  err=0
PASS settings  root=27446 text=420  err=0
```

`PASS` = `#root` rendered content, >50 chars of visible text, zero console errors.

## Findings — page / element / clicked / happened / screenshot / fixed

| # | Page | Element | What I clicked | What happened | Shot | Fixed |
|---|---|---|---|---|---|---|
| F1 | settings | 个人资料 / 通知 / 网络 sections | the nav item | Rendered **"该章节正在搭建中，下次 Claude Design 续 prompt 时会补齐。"** — a note addressed to the next person authoring the file, shipped to the user on 3 of 10 sections | `26-settings-stub-fixed.png` (after) | ✅ |
| F2 | dm | whole thread | opened `#/dm/dm/sakuya` | Rendered a **hardcoded module-level array**, not `GET /v1/dm/{handle}/chat`. Every peer showed 咲夜's canned 20:48 conversation. `useDMThread` existed and was unused | `23-dmthread-fixed.png` | ✅ |
| F3 | dm | header line | read the thread header | `"添加好友于 2024.03.14 · 共同群组 3 个 · 共同好友 8 人"` — identical for sakuya, marisa, patchouli **and** reimu | `23-dmthread-fixed.png` | ✅ |
| F4 | dm | "正在输入…" | read the thread | Hardcoded, permanent "X 正在输入…" on every thread, forever, with no event behind it | `23-dmthread-fixed.png` | ✅ |
| F5 | dm / group | chat composer | typed text + Enter | **dm**: input had no handler, nothing happened. **group**: same | `23-dmthread-fixed.png` | group ✅ real POST · dm ✅ real POST + honest failure |
| F6 | lobby | 大厅 / 好友 / 房间 tabs | each of the 3 | `active="lobby" onChange={() => {}}` — **three buttons wired to nothing** | `20-lobby-friends-tab.png` | ✅ |
| F7 | lobby | chat composer | typed + sent | Toasted **"已发送" without sending anything** — a success message for a request never made | — | ✅ |
| F8 | lobby | `# lobby-th08` header | read it | Literal `"47 online"`, contradicting the computed header two columns over ("当前 6 个房间在线 · 15 名玩家") | `21-group-fixed.png` | ✅ |
| F9 | room | 复制邀请 | clicked the copy icon | Toasted **"已复制邀请链接" without touching the clipboard** — user pastes stale text into a chat | — | ✅ |
| F10 | room | 难度 Easy/Normal/Hard/Lunatic/Extra | each of the 5 | `DiffRadio` buttons with **no `onClick`** — looked editable, changed nothing, said nothing | — | ✅ honest |
| F11 | room | 最大 Lives / 最大 Bombs `−` `+` | all 4 | `StepperR` buttons with **no `onClick`**, `value` hardcoded to 3 | — | ✅ honest |
| F12 | room | 模式 dropdown, 随机种子 reroll, 可见性 dropdown | each of the 3 | Enabled buttons with no handler; two of them render a `chevron-down` implying a menu that never opens | — | ✅ honest |
| F13 | room | seat role chip 正常/观战/缺席 | all 3 on seat #1 | Enabled (host seat), no `onClick`, no feedback | — | ✅ honest |
| F14 | settings | 圆角风格 锐利/标准/柔和 | each of the 3 | Three buttons, no handler; app always rendered 标准 | `25-settings-soft.png` | ✅ **really works** |
| F15 | profile | 查看全部 → | clicked | Button with **no `onClick`**, rendered above an empty state saying there are no records | — | ✅ |
| F16 | profile | `…` next to 围观对局 | clicked | `BtnP` with no `onClick` | — | ✅ |
| F17 | settings | 退出登录 | clicked | Toast: `"点击确认按钮以确认（暂未实现）"` — admits it does nothing, and there is no login to exit | — | ✅ copy |
| F18 | dm | 待处理 badge | read it | Literal `count: 1` next to a heading computed from real data reading **2** | — | ✅ |
| F19 | dm | 接受 / 忽略 on pending requests | clicked | Two enabled buttons, no handler | — | ⚠️ backend gap |

**F19 and the room params are backend gaps, not client bugs** — see below. F10–F13
were changed to *say* what is missing rather than silently do nothing.

## Fixed and re-verified in the browser

- **Group chat now really sends.** Typed `uiaudit2 real send 1790907947700` into
  the channel, pressed Enter, and confirmed it both rendered in the UI **and**
  came back from `GET /v1/groups/yegumi/channels/yegumi.th08/messages`. End to
  end, through the real write path. `22-group-sent.png`
- **Lobby 好友 tab switches** and lists the live roster. `20-lobby-friends-tab.png`
- **DM shows real API data**, no fake thread, no permanent typing indicator.
  `23-dmthread-fixed.png`
- **DM send fails honestly**: typing into the DM thread now produces the toast
  *"服务端没有这个频道 · POST /v1/channels/sakuya/messages 未实现"* and **keeps
  the draft in the input** (verified `input.value`). Previously the composer
  either did nothing or lied. `24-dm-send-failure.png`
- **圆角风格 really restyles the app**: 柔和 → `<html class="radius-soft">`,
  `--r-md` 10px→16px; 锐利 → `--r-md` 3px. `25-settings-soft.png`
- **Leaked authoring note replaced** with per-section copy naming the missing
  route. `26-settings-stub-fixed.png`

## Backend gaps — precise, not stubbed

Each of these is a control the client cannot implement without a route the
server does not mount. I did **not** fake them.

1. **`PATCH /v1/rooms/{id}`** — needed by F10, F11, F12 (difficulty, mode, max
   lives/bombs, seed, visibility). The room router mounts only four GETs:
   `listRooms`, `getRoom`, `listSeats`, `listSpectators` (`server/internal/room/room.go:27-31`).
2. **`PATCH /v1/rooms/{id}/seats/{idx}`** — needed by F13 (seat role).
3. **`POST /v1/rooms`** — "新房间" / "开一间" cannot create a room.
4. **Writable DM / lobby / room channels** — `POST /v1/channels/{id}/messages`
   exists and returns **201 for group channels**, but `Memory.CreateChannelMessage`
   gates on `hasChannelLocked`, and `m.channels` is seeded only with `yegumi.*`
   (`server/internal/store/seed.go:272-287`). Probed:
   `POST /v1/channels/yegumi.th08/messages` → **201**;
   `POST /v1/channels/lobby-th08/messages` → **404**;
   `POST /v1/channels/room-1/messages` → **404**;
   `POST /v1/channels/sakuya/messages` → **404**.
   Fix: seed `m.channels` with the lobby/room/DM channel ids, or extend
   `CreateChannelMessage` to accept the `dm` scope it already stores under.
5. **`POST /v1/friends/{handle}/accept|ignore`** — needed by F19.

## Backend data inconsistency (not mine, worth someone's attention)

`GET /v1/rooms/1` reports `taken:3, total:4`, but `GET /v1/rooms/1/seats`
returns **12 seats, all occupied**. The room header therefore reads `3/4` while
the seat grid shows a full 12-person lobby. The client renders both faithfully;
the seed data disagrees with itself.

## False positives I eliminated — the instrument lied, not the UI

| Suspected | Instrument said | Reality |
|---|---|---|
| Theme buttons dead (all pages) | "NOTHING" | **Works.** My signature was `innerText`, which a colour change cannot move. Re-probed via `getComputedStyle`: light→`rgb(247,247,245)`, dark→`rgb(10,11,13)`, system→dark. |
| DM "在线" filter dead | "NOTHING" | **Works.** It is the default tab; the API has 6 non-offline of 7 (`remilia:offline`), and 全部 correctly added 蕾米莉亚 back. |
| No responsive breakage | — | Measured 1440/900/620 px: `scrollWidth === clientWidth` on lobby, room, profile, settings. Zero elements wider than viewport. |
| "开始对局" fails in browser | toast "需要桌面版客户端" | **Correct and honest** — game launch needs the Tauri host. |

**5 things I suspected that were not findings. 0 findings I could not reproduce.**

## Two environment hazards this project now has on record

1. **`vite build` kills the running `vite dev`.** They share
   `node_modules/.vite`; the build wiped the cache and the dev server on :4173
   stopped accepting connections mid-audit. Run `vite build` only when you are
   done browsing, or from a separate `node_modules` copy.
2. **The Vite dev server served stale transforms for several minutes after my
   edits**, and Chromium's module cache held them even across reloads, which is
   how a page "passed" a local HTTP check and still ran old code. Confirm a fix
   by **rendering it**, never by fetching the module. (My own grep for
   `useStateL('lobby')` reported 0 on a file that contained it, because esbuild
   rewrites quotes to double. Grepping source for transformed output is
   unreliable.)

## Changes made (all in `src/`)

- `components/chat-composer.tsx` *(new)* — one real composer, shared by lobby /
  room / group / DM. POSTs, keeps the draft on failure, distinguishes "server has
  no such channel" from "server unreachable".
- `lib/clipboard.ts` *(new)* — one honest copy helper used by every invite button.
- `lib/radius.ts` *(new)* + `styles/design.css` — corner-radius tokens, applied
  on `<html>`, persisted to localStorage.
- `pages/lobby.tsx` — working tabs, real composer, real online count.
- `pages/dm.tsx` — real thread via `useDMThread`, real composer, no fake typing
  indicator, honest pending count, working copy button.
- `pages/group.tsx` — real composer (backend supports it).
- `pages/room.tsx` — real clipboard copy; every dead param control now names the
  missing route.
- `pages/settings.tsx` — leaked note replaced; 圆角风格 made real; sign-out copy
  made honest.
- `pages/profile.tsx` — 查看全部 collapses/expands; `…` wired.

No feature deleted. No redesign. No stub added. No git.