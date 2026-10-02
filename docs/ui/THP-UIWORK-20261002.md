# THP-UIWORK — every interactive element on six pages, and what it does now

Lane: `THP-UIWORK` · scope `D:/Project/TH-Platform/src/**`, `docs/ui/**`
Date: 2026-10-02

## 0. The frame

`tsc -b` and `vite build` both exit 0. Neither one runs anything. This lane's
starting position was that eight runtime bugs had already survived both gates,
and that what the owner actually reports is not crashes but **controls that
exist and do nothing**. So the enumeration below is not "does it throw"; it is
"what does it *do*", and every (a)/(b) item names the concrete defect.

**Backend reality**, read from `D:/Project/TH08-Platform/server/internal/api/router.go`
and the per-handler `Mount` calls — this is the ground truth for "can it
support this":

```
GET    /healthz  /readyz  /v1/version
GET    /v1/rooms  /v1/rooms/{id}  /v1/rooms/{id}/seats
       /v1/rooms/{id}/spectators  /v1/rooms/{id}/chat
GET    /v1/friends  /v1/friends/pending  /v1/lobby/friends  /v1/lobby/chat
GET    /v1/groups/{handle}  /v1/groups/{handle}/channels
       /v1/groups/{handle}/announcement
       /v1/groups/{handle}/channels/{cid}/messages
GET    /v1/dm/{handle}/chat
GET    /v1/me  /v1/users/{handle}
POST   /v1/channels/{id}/messages          <- the ONLY write endpoint
GET    /ws  /ws/channels/{channelID}       (no client subscriber exists)
```

There is no `POST /v1/rooms`, no `PATCH` of any kind, no account/auth, no
invite, no reaction endpoint. `CreateChannelMessage` requires a row in
`channels` (`internal/store/sql/chat.sql:48`), and only the group channels are
seeded — so lobby / room / DM scopes 404 on write. Everything below follows
from that table.

## 1. Gates

```
$ node node_modules/typescript/bin/tsc -b
(no output, exit 0)

$ node node_modules/vite/bin/vite.js build
dist/assets/index-JTYylnV8.css     10.07 kB │ gzip:   2.84 kB
dist/assets/index-CSRpoC81.js   1,078.79 kB │ gzip: 220.47 kB
✓ built in 6.88s

$ grep -rn "ts-nocheck\|ts-ignore\|ts-expect-error" src/
src/pages/profile.tsx:196:  // `vite build`, because the file carried @ts-nocheck. …
```

One hit, and it is a comment recording why that file is safe, not a directive.
`pnpm typecheck` was not run or cited.

## 2. Enumeration — intended vs actual

Legend: **(a)** does something wrong · **(b)** looks live, does nothing ·
**(c)** honestly unfinished. "Was" = behaviour before this lane.

### 2.1 App shell (`src/App.tsx`, `src/router/index.tsx`)

| Control | Intended | Was | Now |
|---|---|---|---|
| Profile popover 消息 | open a DM with *me* | **(a)** navigated to a hardcoded `peer: 'yuyuko'` from any account | navigates to `/v1/me`'s own handle |
| Profile popover 更多 | more actions | **(b)** enabled, no `onClick` | `Unavailable` — "没有可列的动作" |
| Profile popover 当前游戏 | current room | **(a)** rendered "永夜抄 PvP — 北京 / #4912 / 18 分钟" for everyone; no field backs it | renders `me.presence` + `me.joined` |
| Popover banner "夜组 · 管理员" | a role | **(a)** literal for every account | `@me.handle` |
| Settings ESC / 关闭 | close | worked | unchanged |
| Settings section ↔ URL | deep-link + back | **(b)** state seeded from the URL once; a hash change kept the old pane | `useEffect` syncs `active` to `section`; `onSection` writes it back |
| `?tab=` on `#/dm` | — | did not exist | added, validated in `parseHash`/`toRoute`/`buildHash` |

### 2.2 Lobby (`src/pages/lobby.tsx`)

| Control | Intended | Was | Now |
|---|---|---|---|
| ServerRail 06/07/08/09 | switch game | worked | unchanged |
| ServerRail Add server | add a server | **(b)** "该功能将在 V1 后期开放" toast | rail routes it to the honest path: base URL comes from `VITE_API_BASE_URL`, there is no runtime switch |
| ServerRail Discover | discover | **(b)** same toast | routes to the lobby it would have discovered into |
| Search box | search | **(b)** `onFocus` fired a "coming in V1" toast; typing did nothing | filters the room list live; `⌘K` now actually focuses it (the badge advertised a shortcut that had no handler) |
| `⌘K` badge | focus search | **(b)** no handler anywhere | `useEffect` keydown handler |
| 分类 官方房间 / 个人房间 | filter | **(b)** both toasted "V1 后期开放" | real `kind` filter over the fetched rooms |
| 分类 社区频道 | community channels | **(b)** dimmed, no handler, no reason | `Row disabledReason` — needs a channel directory route |
| 版本 TH06–TH09 | switch game | worked | unchanged |
| 我的房间 | my rooms | **(a)** two hardcoded rooms ("昨日的房间 #1 TH08 3 人", "咲夜的茶话会 #2 TH07 待机中") that no request produced | 最近房间 — the real list from `GET /v1/rooms` |
| 好友在线 rows | open DM | worked | unchanged |
| `CN-East · 24ms` in the header | server ping | **(a)** literal, contradicting the real region/ping two columns over | reachability dot + 已连接/未连接 |
| 排序 | sort | **(b)** "V1 后期开放" | real: 延迟最低 / 人数最多 / 按区域, all from `Room` fields |
| 筛选 | filter | **(b)** "V1 后期开放" | real: 全部 / 官方 / 个人 |
| Header room count | count of the list | counted the unfiltered list | counts what is actually shown, with `N / total` when filtered |
| 新房间 / 开一间 | create a room | **(b)** "V1 后期开放" | `disabled` + `POST /v1/rooms` named on the tooltip |
| Empty state "开一间" | create a room | **(b)** same | same; and a real 清除条件 action when a filter is hiding rooms |
| Room row occupancy glyphs | occupants | **(a)** invented 幽/妖/咲/魔 standing in for real players | neutral pips; a share/room list carries no roster |
| Tabs 大厅/好友/房间 | switch panel | worked (earlier lane) | unchanged |
| `# lobby-th08` "47 online" | online count | **(a)** literal, fixed earlier | counted from the roster |
| Share card 立即加入 | join *that* room | **(a)** `nav({name:'room', id: 1})` — always room 1, whatever was shared | `resolveSharedRoom` matches title+host against `GET /v1/rooms`; a miss says so |
| Lobby composer | post a message | posts for real; server 404s the scope | unchanged — the 404 is reported with the draft kept |

### 2.3 Room (`src/pages/room.tsx`)

| Control | Intended | Was | Now |
|---|---|---|---|
| 返回大厅 | back | worked | unchanged |
| 可见性 chip | change visibility | toast naming the missing `PATCH` | unchanged (already honest) |
| 复制邀请 | copy link | works, real clipboard | unchanged |
| 房间设置 | room settings | **(b)** bare "房间设置" info toast, no reason | covered by the panel's read-only treatment |
| 队伍 rows | open that player's profile | **(b)** toast "`<name>` 个人主页" | routes to the profile page; profile now honours the handle |
| Seat role chip | set role | toast naming the missing route | unchanged |
| Empty seat 邀请玩家 | invite | a card labelled 邀请玩家 with nothing to click | the room's own 复制邀请 is the working path; the param panel carries the honest text |
| Param 难度/模式/Lives/Bombs/种子 | edit | toasts naming the missing `PATCH` | unchanged |
| Param seed `0x4F2A91C7` | the seed | **(a)** a literal — no request produces it | not shown; the real `endpoint.sessionId` is what the room page shows as 主机地址 |
| Param tab 网络: 连接方式 | transport | **(a)** showed four options (P2P/Relay/LAN/FRP) as if selectable | P2P 直连, the truth (AGENTS.md: the DLL talks UDP peer-to-peer) |
| Param tab 网络: NAT `Full Cone`, MTU `1492` | measurement | **(a)** literals; the client measures nothing | removed |
| Param tab 反作弊: DLL SHA-256, 哈希校验 已通过, 最近注入 20:58:14, 完整性 98/100 | verification | **(a)** four literals; nothing hashes anything and no injection is observed | replaced by the copy that is true |
| Param tab 进阶 | match rules | **(a)** literals (60 Hz, 10s grace, …) | not claimed |
| Bottom bar last-message "展开 #room-N →" | expand the chat | **(b)** `cursor: pointer` div, no handler | the drawer is always visible; no affordance that goes nowhere |
| Chat drawer X | close the drawer | **(b)** no `onClick` | the drawer is not closable, so the X is gone |
| Chat embed 立即加入 | join | **(b)** `onJoin={() => {}}` | same resolver as the lobby |
| START | launch the game | real `launchRoomGame`; honest error outside Tauri | unchanged |

### 2.4 Group (`src/pages/group.tsx`)

| Control | Intended | Was | Now |
|---|---|---|---|
| Channel rows | switch channel | worked | unchanged |
| Category `+` | new channel | **(b)** enabled, no handler | still **(b)** — *see the gap list in §4* |
| 群内搜索 / 群组设置 | search / settings | **(b)** bare toasts | still **(b)** — *see §4* |
| bell / pin / users in the channel header | notifications, pins, members | **(b)** bare toasts | still **(b)** — *see §4* |
| 搜索消息 box | search messages | **(a)** a `div` styled as an input; typing could never do anything | still **(a)** — *see §4* |
| Composer | post a message | **real** — this is the one writable scope | unchanged |
| Footer "支持 Markdown · /room 分享当前房间 · @ 提及" | three features | **(a)** none of the three exists in this client | still **(a)** — *see §4* |
| Share aside 立即加入 | join | **(b)** "加入房间" toast | still **(b)** — *see §4* |

### 2.5 DM (`src/pages/dm.tsx`)

| Control | Intended | Was | Now |
|---|---|---|---|
| 消息请求 | open message requests | **(a)** `onPick('inbox')` → `nav({view:'dm', peer:'inbox'})`; no such peer, so the page fell back to `friends[1]` and **opened an unrelated conversation** | opens `#/dm/friends?tab=pending`, the tab the label names |
| Peer resolution | the person named | **(a)** `friends.find(…) \|\| friends[1]` — an unknown handle became a *different* person | friends list, else `GET /v1/users/{handle}`; if neither, an explicit "服务器上没有 @handle" panel |
| Sidebar search box | find a DM | **(a)** a `div` styled as an input | a real `Input` that filters the list below it |
| Sidebar `+` next to 私聊 | new DM | **(b)** no handler | `Unavailable` — no user search route |
| Unread badge `3` | unread count | **(a)** a literal for a thread never read | removed; no unread route exists |
| 发消息 on a friend row | open the thread | worked | unchanged |
| 更多 on a friend row | more | **(b)** no handler | `Unavailable` |
| 接受 / 忽略 on a request | accept / ignore | **(b)** enabled, no handler | `Unavailable` — `PATCH /v1/friends/{handle}` does not exist |
| 添加好友 | add a friend | **(b)** "V1 后期开放" | `disabled` — `POST /v1/friends` does not exist |
| 好友 tab search input | search | **(b)** a real input wired to nothing | filters the visible list; an empty result says "没有匹配「…」" |
| 待处理 / 已屏蔽 tabs | switch | worked | unchanged; 已屏蔽 says why it is empty |
| 待处理 dot | pending count | counted for real (earlier lane) | unchanged |
| Thread header presence | peer status | **(a)** "添加好友于 2024.03.14 · 共同群组 3 个 · 共同好友 8 人" for *every* peer | `peer.subtle`, or nothing when the API has nothing |
| 置顶 / 邀请群聊 in the thread | pin, invite | **(b)** bare toasts | `Unavailable` with the missing route |
| MiniRoomShare | that room | **(a)** every field a literal — "永夜抄 Lunatic · 4B 路线练习", "#4912", "主 咲夜 · 28ms · 3/6" | renders `m.share` |
| Identity card | who am I | **(a)** "东方霖之助 / @rinnosuke / UID 100029481" | `GET /v1/me` (see §3) |

### 2.6 Profile (`src/pages/profile.tsx`)

| Control | Intended | Was | Now |
|---|---|---|---|
| 5 sidebar rows | go to that section | **(b)** all five were toasts | they scroll to the section they name; 战绩/对局/徽章/群组 all exist on this page |
| 录像 row | replays | **(b)** was one of the toasts | `Unavailable` — no replay route at all |
| Route `handle` | *that person's* profile | **(a)** `ProfileFull` accepted `handle` and always read `/v1/me`; every "open profile" in the app showed the viewer | `GET /v1/users/{handle}` when the handle is not the viewer's |
| 发消息 | DM them | worked | only shown when looking at someone else |
| 围观对局 | spectate | **(b)** "V1 后期开放" | `disabled` — no per-player current-room field exists |
| 更多操作 | more | **(b)** "V1 后期开放" | `disabled` |
| 查看全部 N 场 | expand | worked (earlier lane) | unchanged |
| Empty states | — | said "加入一个房间打完一局" while the server simply has no rows | they now say the server has no records |
| Identity card | who am I | **(a)** invented person | `GET /v1/me` |

### 2.7 Settings (`src/pages/settings.tsx`)

| Control | Intended | Was | Now |
|---|---|---|---|
| 我的账号: 名字 / @handle / UID | the account | **(a)** "幽幽子 / @yuyuko / UID 4128920" | `/v1/me` |
| 我的账号: 邮箱 / 手机号 | contact | **(a)** `y***ko@protonmail.com`, `+86 138 **** 0512` — invented | removed; the pane says the server stores neither |
| 我的账号: 两步验证 | 2FA | **(a)** a switch stuck on, for a service that does not exist | `lockedReason` |
| 我的账号: 修改密码 / 登出全部 | password / sign-out | **(b)** bare toasts | `Unavailable` — no auth this round |
| 我的账号: 编辑资料 | edit | **(b)** bare toast | `disabled` — needs `PATCH /v1/me` |
| 主题 swatches | set theme | worked (earlier lane) | unchanged |
| 显示字体 ×3 | set the font | **(b)** no `onClick` on any; `active` was a literal on the first; two of the three name fonts this machine may not have | real, and `document.fonts.check` decides: an absent font is labelled 本机未安装 and wrapped `Unavailable`, because picking it would render identical glyphs |
| 字号 | set the size | **(a)** a `div` with a knob at 40% labelled 100% — not draggable, always 100% | 90/100/110/125 %, applied through `--ui-scale` to the whole size scale |
| 紧凑模式 | compact | **(b)** a local boolean, reverted on reload | `--lh-body-base`, the line-height scale and `--row-stagger` |
| 减少动效 | reduce motion | **(b)** a local boolean, reverted on reload | `:root.thp-no-motion` zeroes every duration and iteration count |
| 圆角风格 | radius | worked (earlier lane) | unchanged |
| 第三方绑定 ×6 | bind accounts | **(a)** four "已绑定" accounts with live handles, plus a 绑定 button per row; nothing was ever bound and no OAuth route exists | an honest panel naming what is missing |
| 游戏注入器 status | injector state | **(a)** "v0.4.12 · 在线 / 延迟 24 ms / 最近一次 21:04:10" | the three things that are actually checked: Tauri shell present, `VITE_GAME_PATH_TH08`, `VITE_DLL_PATH` |
| 游戏注入器 已检测到的游戏 ×4 | detected games | **(a)** four games with `sha256:…` prefixes and 已就绪 / 需要更新 | four rows reading 本机配置; the client scans no disk and cannot hash from a web view |
| 游戏注入器 folder buttons | pick a path | **(b)** no handler | `Unavailable` — Tauri exposes only `launch_game` / `terminate_game` |
| 注入器 toggles ×3 | autostart / save isolation / logging | **(b)** local booleans for things the DLL reads from env vars | `lockedReason` each |
| 语言 ×5 | change language | **(b)** a `button` list with `i === 0` hardcoded as active, no handler; the whole UI is hardcoded Chinese | honest panel — no i18n layer exists |
| 日期格式 ×3 | date format | **(b)** same, `i === 0` literal | covered by the same panel |
| 协助翻译 打开 | open the repo | **(b)** no handler | covered by the same panel |
| 快捷键 | key bindings | **(a)** fell through to the 个人资料 stub: it rendered "个人资料还没有开放" under a 快捷键 heading | the four bindings that are actually installed |
| 关于 | about | **(a)** same fall-through — "个人资料还没有开放" under a 关于 heading; the sidebar footer read "v0.7.0 · build 2026.04.26" | the resolved API base URL, the `X-Handle`, backend reachability, whether the Tauri shell is loaded, and a note that `GET /v1/version` exists but the client does not read it (it is not in the AGENTS.md §6 function table, so this lane did not add it) |
| 退出登录 | sign out | **(b)** a live button | `Unavailable` — the identity is a request header; there is no session to end |
| Sidebar footer version | version | **(a)** invented | the API base URL and the real handle |

### 2.8 Cross-cutting (`src/components/design/shared.tsx`)

| Control | Was | Now |
|---|---|---|
| `IdentityCard` | invented name / handle / UID and a permanent green presence dot, on **every** page | `GET /v1/me`; explicit 未载入 while loading; no presence claim |
| `Row` | clickable whenever `onClick` was passed | `disabledReason` drops the handler *inside* the component, so a row cannot be both live and labelled unavailable |
| `ServerCardFlat` | hardcoded `TH08` tag; invented occupant glyphs; join enabled with `onJoin` supplied by the caller | visibility tag; occupancy pips; `joinBlockedReason` |
| `ChatMessage` reactions | `cursor: pointer`, no handler | a readout |
| `Input` | could not be focused programmatically | `inputRef` |
| `ChatComposer` 表情 | enabled, no handler | **still (b)** — see §4 |

## 3. New modules

- `src/lib/prefs.ts` — one persisted, validated store for the four appearance
  preferences, applied to `<html>` at module load. `localStorage` is treated as
  untrusted: every field is sanitised on read.
- `src/lib/room-share.ts` — `resolveSharedRoom(share, rooms)`: a
  `RoomShareEmbed` has no id, so the only honest resolution is to match
  title+host against the room list and say so on a miss.
- `src/components/unavailable.tsx` — `Unavailable` (inert + reason on tooltip,
  `aria-disabled`, visible glyph) and `UnavailablePanel`.

## 4. What this lane did NOT finish — read this

The backend is the constraint on all of it. These are still (a)/(b) and are
**not** claimed as fixed:

1. `src/pages/group.tsx` — 群内搜索, 群组设置, bell / pin / users in the channel
   header, the category `+`, and 分享卡 立即加入 still toast. I ran out of
   budget after the other five pages; they are the same shape as the lobby's
   already-fixed controls and are listed in §2.4 so they can be picked up
   directly. The category `+`, bell, pin and users have no route at all and
   should be `Unavailable`.
2. `src/pages/group.tsx` — the 搜索消息 box is still a `div` styled as an input,
   and the footer still claims "支持 Markdown · /room · @ 提及", which this
   client does not implement. Both are (a) and should be fixed next.
3. `src/components/chat-composer.tsx` — the 表情 button is enabled with no
   handler, on all four chat surfaces.
4. `src/pages/room.tsx` — the 聊天抽屉 X was removed rather than made
   collapsible, and the 邀请玩家 empty seat is still a non-clickable card. The
   honest versions (a real collapse, and a real 复制邀请 on the empty seat) were
   not reached.
5. `src/pages/room.tsx` — the read-only parameter controls still *toast* on
   click rather than being `disabled`. The toast names the missing route, which
   is honest, but a control that cannot work should not look pressable.
6. `src/App.tsx` `DevSwitcher` still points `Room` at id 4912 and `Group` at
   `yegumi` with hardcoded ids. It is `import.meta.env.DEV`-gated and is not in
   the shipped bundle, so it is a dev-only wart, not a user-facing one.
7. `Room` results card (the `post` state) still renders a fixed score table.
   It is unreachable from the product — nothing sets `state: 'post'` — but it is
   invented data and should be deleted rather than wired.
8. `useRooms` is not cached, so every surface that needs the room list issues
   its own `GET /v1/rooms`. Fine at six rooms; worth a shared cache later.

## 5. Verification — what was actually run

Headless Chromium against the **already-running** dev server on
`http://127.0.0.1:4173` and the **already-running** backend on
`http://127.0.0.1:8080`. Nothing was started and nothing was killed.

### 5.1 Every route renders, and the console is clean

```
#/lobby/th08        chars 987   buttons 38  disabled 2
#/room/1            chars 1202  buttons 75  disabled 28
#/group/yegumi      chars 893   buttons 33  disabled 1
#/dm/friends        chars 445   buttons 39  disabled 8
#/dm/dm/sakuya      chars 453   buttons 26  disabled 4
#/profile           chars 446   buttons 23  disabled 2   h1 "本地用户"
#/settings/appear   chars 487   buttons 30  disabled 0   h2 "外观"
#/settings/about    chars 452   buttons 23  disabled 0   h2 "关于"
#/settings/inject   chars 486   buttons 27  disabled 4   h2 "游戏注入器"
#/settings/account  chars 463   buttons 27  disabled 3   h2 "我的账号"
#/settings/oauth    chars 294   buttons 23  disabled 0   h2 "第三方绑定"
#/settings/kbd      chars 320   buttons 23  disabled 0   h2 "快捷键"
```

Console errors across that sweep, verbatim:

```
GET http://127.0.0.1:8080/healthz: net::ERR_ABORTED      (x11)
GET http://127.0.0.1:8080/healthz: net::ERR_CONNECTION_REFUSED
GET http://127.0.0.1:8080/v1/me: net::ERR_CONNECTION_REFUSED  (x2)
```

`ERR_ABORTED` is React 18 StrictMode double-mounting `useBackendReachable` and
cancelling the first in-flight probe — dev-only, and it is logged as a
`requestfailed` network entry, not a page exception. The
`ERR_CONNECTION_REFUSED` entries are §5.4.

### 5.2 Behavioural assertions — what each control DOES

Run against the production-shaped app, headless, asserting the effect and not
the absence of an exception.

```
lobby: 新房间 disabled with a reason                        PASS
  {"found":true,"disabled":true,
   "reason":"开房间需要 POST /v1/rooms。服务端目前只有 GET /v1/rooms、/v1/rooms/{id}、/seats、/spectators、/chat，没有任何创建接口。"}

dm: 消息请求 opens the pending tab, not a random DM          PASS
  #/dm/friends?tab=pending :: "好友 消息请求 私聊 … 好友 在线"

dm: unknown peer shows no-such-person, not another thread    PASS
  "服务器上没有 @nosuchperson"  (and the header shows no "与 <name> 的私聊")

settings: 125% applied                                       PASS
  <html class> = "thp-font-app dark radius-sharp thp-scale-125 | scale=1.25"
  computed .t-body-lg font-size: 13.5px -> 16.875px
settings: 90% applied                                        PASS  thp-scale-90
settings: 紧凑模式 applies thp-compact                        PASS
  --lh-body-base: 1.38
settings: 减少动效 applies thp-no-motion                      PASS
  before: "thp-font-app thp-scale-100 dark"
  after:  "thp-font-app thp-scale-100 dark thp-no-motion"
  localStorage: {"font":"app","scale":100,"compact":false,"reduceMotion":true}
theme: 日间 applies light, 夜间 applies dark                 PASS
radius: 柔和 --r-md 16px / 锐利 --r-md 3px                    PASS
settings: about reports the real API base + X-Handle          PASS
```

The two DM assertions are the ones that matter most: `消息请求` and the unknown
peer both used to land in a **different person's** conversation without
throwing, and both are now asserted on the resulting route and the resulting
text.

### 5.3 Two harness mistakes, recorded because they nearly became findings

Both of these first read as failures and were **not**:

- `sw('减少动效')` walked up six ancestors looking for the label, and the
  first switch it reached in the 紧凑模式 row also had 减少动效 in that
  ancestor's text. It toggled 紧凑模式 off instead. The app was right; the
  selector was wrong.
- `settings: 柔和 radius applies` measured `.h-display-md`, a heading, which has
  `border-radius: 0` regardless of the radius tokens. Re-measured against the
  `--r-md` custom property, which the same test then read as `16px`.

An assertion that cannot fail is not evidence. The `--r-md` reading is the one
to re-run.

### 5.4 What could NOT be verified, and why

**The backend stopped responding part-way through this session.** It answered
`/healthz`, `/v1/rooms`, all four room sub-routes, `/v1/friends`,
`/v1/lobby/friends`, `/v1/friends/pending`, `/v1/lobby/chat`, `/v1/me`,
`/v1/groups/yegumi`, `/v1/groups/yegumi/channels`,
`/v1/groups/yegumi/announcement` and `/v1/dm/sakuya/chat` with real payloads
when this lane started — the enumeration in §2.4 and the share-resolution
design in `src/lib/room-share.ts` are built on data read from it. It then began
answering `ERR_CONNECTION_REFUSED` and had not come back at the end of the run.
This lane did not stop it and is not permitted to start it.

Consequently these are **`[UNVERIFIED]`** — the code paths exist and typecheck,
but no assertion was run against live data after the change:

- `resolveSharedRoom` hitting rather than missing, i.e. a share card opening
  *its* room rather than room 1. The lobby share is 永夜抄 PvP — 北京 / 幽幽子,
  which is room id 1 in the list I read, so the fixed case and the old buggy
  case coincide for that one card. It must be re-checked with a share whose
  room is not id 1.
- Lobby 排序 / 筛选 reordering the list — needs the room list.
- The 好友 search filter and the group/DM empty states with a populated list.
- The identity card rendering `本地用户` rather than 未载入 — needs `/v1/me`.
- `ProfileFull` resolving `GET /v1/users/{handle}` for a non-self handle.

To re-run, once the backend is back:
`curl -s http://127.0.0.1:8080/healthz` must answer before any of the above
mean anything.

## 6. For whoever picks up §4

`src/lib/room-share.ts` and `src/components/unavailable.tsx` are the two pieces
the remaining group.tsx work needs; both are already used by lobby, room and
dm, so the group fixes are the same three lines each.
