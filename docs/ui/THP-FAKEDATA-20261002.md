# 客户端显示值清扫 — THP-FAKEDATA-20261002

范围：`src/**`。判据：`src/lib/api/types.ts` 是唯一契约。**任何不能从契约字段推导出来的
显示值都是编造的。** 编造值要么接到真实字段上，要么显式标为不可用（`Unavailable` /
`UnavailablePanel`）。不发明替代数字。

验证命令（两条都真跑过，退出码 0）：

```
cd D:/Project/TH-Platform
node node_modules\typescript\bin\tsc -b          # EXIT=0
node node_modules\vite\bin\vite.js build         # EXIT=0，1603 modules
```

`pnpm typecheck` 是空命令（`tsconfig.json` 是 `files: []` 的 solution 风格），本报告
不引用它。

---

## 1. 主工作：房间页参数面板（`src/pages/room.tsx`）

上一轮把这一面板列进「已修复」，实际八行全在。本轮全部处理。

新增两个小helper（`room.tsx:221-253`）：`ParamMissing`（渲染 `—` 并把「缺什么」挂在
`title`/`aria-disabled` 上）与 `NEEDS_ROOM_FIELD` / `NOT_MEASURED` / `SEED_NOT_READABLE`
三个理由常量。

| 行 | 原值 | 判定 | 现在的显示 | 依据 |
|---|---|---|---|---|
| NAT 类型 | `Full Cone` + 绿点 | 编造 | `—` | 无 NAT 探测代码；要 STUN 或服务端探测 UDP 打洞 |
| MTU | `1492` | 编造 | `—` | 路径 MTU 由 OS/链路协商，客户端从不读取 |
| DLL 签名 | `SHA256:af3c…91d2` | 编造 | `—` | WebView 读不到注入的 DLL，也算不出哈希 |
| 哈希校验 | `已通过` + 绿勾 | 编造 | `—` | 无任何代码比对哈希 |
| 最近注入 | `20:58:14` | 编造 | `—` | 时刻只写进桌面壳日志；src-tauri 只有 `launch_game`/`terminate_game` |
| 完整性评分 | `98 / 100` + 98% 进度条 | 编造 | `—` | 无评分算法 |
| 掉线宽限 | `10s` | 编造 | `—` | 由 DLL 的 KEEPALIVE 判定，不经过客户端 |
| 符卡同步频率 | `60 Hz` | 编造 | `—` | lockstep 跟随游戏帧，无可配置频率字段 |
| 随机种子 | `0x4F2A91C7` + 重掷按钮 | 编造 | `—`（按钮已删） | 种子由 DLL 握手自抽（`dll/src/net/lockstep.cpp`：读 `TH08_PLATFORM_SEED`，否则 `GetTickCount64()` 异或 PID），只走 THP START 包，客户端读不到也无法重掷 |
| 连接方式 | `P2P 直连 / Relay / LAN / FRP` 四选一 | 编造 | `P2P 直连 203.0.113.10:7480` 或 `未公布` | 四个 span 不是按钮，没有 route 上报 transport。改为由 `Room.endpoint` + `peerAddr()` 推导，唯一真实存在的传输方式 |
| 最大 Lives | stepper `3` | 编造 | `—` | `Room` 无 lives 字段 |
| 最大 Bombs | stepper `3` | 编造 | `—` | `Room` 无 bombs 字段 |
| 自机机型 锁定 | `关闭` | 编造 | `—` | `Room` 无该字段 |
| 允许中途加入 | `否` | 编造 | `—` | `Room` 无该字段 |
| 难度 | `DiffRadio`，值来自 `room.diff` | **真实** | 保留 | 契约字段 |
| 模式 | `room.mode` | **真实** | 保留 | 契约字段 |
| 当前 RTT | `room.ping` | **真实** | 保留 | 契约字段 |
| 加密 | `无` | **真实** | 保留 | `dll/src` 无任何加密代码（已 grep 确认） |

StepperR 组件随之删除（`noUnusedLocals` 会拒绝留着）。

### 同一页另外三处编造值

- **结算卡 `ResultsCard`（`room.tsx:435-464`）** — 整个组件是假的：`21:42:08 · 用时
  18:24`、`妖梦 通关 永夜抄 2 面`、`魔理沙·B装备 · Lunatic · 3 lives`、得分
  `4,128,920,470`、`Lives / Death 2 / 1`、四张关键符卡（各带时刻与 try 数）。契约里
  没有 `MatchResult`，服务端没有结果路由。路由 `#/room/{id}?state=post` 玩家手改 URL
  就能进。改为标题「没有这一局的结算数据」+ `UnavailablePanel` 说明缺
  `GET /v1/rooms/{id}/results` 与 `MatchResult` 类型；两个真按钮（再来一局 / 返回席位）
  保留。
- **`战术讨论` 频道行（`room.tsx:556-563`）** — 房间只有一个频道 `room-{id}`（就是
  composer POST 的那个 id，也是 `GET /v1/rooms/{id}/chat` 回答的 id）。`战术讨论`
  没有任何 route 服务，点它 toast 自己的名字。已删除。
- **`主机可调整 · 拖拽换位`（`room.tsx:637-642`）** — 席位卡没有 drag handler。改为
  「席位顺序由服务端返回 · 暂不可换位」。

---

## 2. 过时引用：`dll/src/net/protocol.h`

该文件已删除（152 字节 `Pack` 被 THP 协议取代）。全 `src/` 只有一处引用，已改写为
当前事实（`room.tsx:289-296`）：

> The transport is plaintext UDP. `dll/src/net/protocol.h` — the fixed 152-byte `Pack`
> this comment used to cite — no longer exists: `dll/src/net/thp_session.h` documents its
> deletion and its replacement by the versioned THP protocol, and there is no
> cryptography anywhere in dll/src.

依据：`dll/src/net/thp_session.h` 的 "WHY THE 152-BYTE PACK IS GONE" 段落；`ls dll/src/net`
确认无 `protocol.h`；对 `dll/src` grep `encrypt|aes|chacha|cipher|dtls|tls` 只命中一条
关于 TLS callback 的无关注释。

**其余引用已核实不存在**：`src/` 内再无 `protocol.h` / `152` 的断言。`docs/6b_lockstep_audit.md`
提到 `kExpectedPackSize`，但那是 DLL 车道与 R 车道的地盘，不在本轮范围。

---

## 3. 全量清扫表

复核方式：读 `src/lib/api/types.ts`（契约）与 `server/internal/model/types.go`（服务端
镜像），逐个显示值对字段。`#` 列为源码行号。

### 3.1 `src/pages/room.tsx`

| 显示值 | 字段 | 判定 |
|---|---|---|
| 房主 / ping / taken / total / diff / mode / region / vis（顶栏 + 侧栏 + 房间信息卡） | `Room.*` | 真实 |
| 主机地址 | `Room.endpoint` → `peerAddr()` | 真实 |
| 席位姓名 / handle / 角色 / 字符 / ready | `Seat.*` | 真实 |
| 观战人数 | `getRoomSpectators()` 返回长度 | 真实 |
| `N ready` | `named.filter(ready).length` | 真实 |
| 频道 id `room-{id}` | 与 composer 的 `channelId` 一致 | 真实 |
| 八行参数 + 四选项 transport + 两个 stepper + 两条静态文案 | — | **编造 → 已显式不可用/删除** |
| 结算卡全部字段 | — | **编造 → 已替换为不可用面板** |

### 3.2 `src/pages/lobby.tsx`

| 显示值 | 字段 | 判定 |
|---|---|---|
| 房间标题 / 房主 / ping / 区域 / 难度 / 模式 / 占用 | `Room.*` | 真实 |
| `N / M 个房间符合条件 · K 名玩家` | 对 `rooms` 数组 reduce | 真实 |
| `N 在线好友` | `friends.filter(status!=='offline').length` | 真实 |
| `已连接 / 未连接` | `useBackendReachable()` 探测 `/healthz` | 真实 |
| 排序（延迟/人数/区域）、筛选（官方/个人）、搜索 | 纯函数，输入全是 `Room.*` | 真实 |
| **标题 `永夜抄`** | 硬编码 | **编造 → 已修**：TH06/07/09 页面会显示「永夜抄 · TH06」。改为 `GAME_TITLES[gameId]`（红魔乡/妖妖梦/永夜抄/弹幕天童） |

### 3.3 `src/pages/dm.tsx`

| 显示值 | 字段 | 判定 |
|---|---|---|
| 好友姓名 / handle / 状态 / 游戏 / mutual | `Friend.*` | 真实 |
| `共 N 条消息` | `msgs.length` | 真实 |
| 待处理数 / 待处理红点 | `listPendingFriends()` | 真实 |
| `subtle` 副标题 | `Friend.subtle`（无则不渲染） | 真实 |
| MiniRoomShare 各字段 | `RoomShareEmbed.*` | 真实 |

### 3.4 `src/pages/profile.tsx`

| 显示值 | 字段 | 判定 |
|---|---|---|
| 姓名 / handle / pronoun / presence / joined / bio / badges / ranks / recent / groups | `Profile.*` | 真实 |
| 共同群组计数 | `me.groups.length` | 真实 |
| `PortraitPlate` 默认 `mono = '幽'` | 默认参数 | **编造默认值 → 见 not_finished**：两个调用点都传 `me.name.slice(0,1)`，实际不显示，但默认值仍是不存在的人的字形 |
| 空态文案「/v1/me 的 ranks 永远是空的」等 | 契约注释 | 真实（对当前服务端成立） |

### 3.5 `src/pages/group.tsx`

| 显示值 | 字段 | 判定 |
|---|---|---|
| 群名 / handle / `since established` / online / members | `Group.*` | 真实 |
| 频道 label / unread / mention / muted / voice / count / tag | `Channel.*` | 真实 |
| 公告 pinnedBy / time / title / body | `Announcement.*` | 真实 |
| 消息 who / t / msg / share | `ChatMsg.*` | 真实 |
| **`支持 Markdown · /room 分享当前房间 · @ 提及`** | 硬编码能力声明 | **编造 → 已修**：三项都没实现。composer 原样 POST，服务端 `CreateChannelMessage` 直接存 `in.Text`（无 markdown 解析、无 `/room` 命令），`mention` 只由服务端设置。改为「纯文本发送 · @ 提及由服务端解析后才会高亮」 |
| **侧栏「输入 /room 即可分享」「粘贴自动展开」** | 硬编码 | **编造 → 已修**：改为说明卡片由服务端挂在 `share` 字段上，客户端不生成 |

### 3.6 `src/pages/settings.tsx`

| 显示值 | 字段 | 判定 |
|---|---|---|
| 后端地址 / 身份 / Tauri 或浏览器 / 连通性 | `API_BASE_URL` / `API_HANDLE` / `isTauri()` / 探测 | 真实 |
| 注入器三行（Tauri 已加载 / 游戏路径 / DLL 路径） | `import.meta.env.VITE_*` + `isTauri()` | 真实 |
| 支持的四作路径状态 | 逐个 `VITE_GAME_PATH_*`，未配置写「未配置路径」 | 真实 |
| 字号 / 字体 / 紧凑 / 减少动效 / 圆角 | `src/lib/prefs.ts` + `radius.ts`，模块加载时 apply 并持久化 | 真实 |
| 账号行（状态 / 注册时间 / 称谓） | `Profile.status/joined/pronoun` | 真实 |
| 邮箱手机号 / 两步验证 / 改密码 / 登出 | 无对应接口 | 已显式「服务端未提供」或 `Unavailable` |
| 快捷键四条 | 实际装在组件里（Esc、Enter、Shift+Enter、⌘K） | 真实 |
| 版本号 | 服务端有 `/v1/version`，客户端没读 | 已显式「还没有接进来」 |

### 3.7 `src/components/design/shared.tsx`

| 显示值 | 判定 |
|---|---|
| `IdentityCard` | 上一轮已修（真实 `X-Handle`）。本轮复核：无残留字面量 |
| `ServerCardFlat` 各字段 | 全部来自 `RoomShareEmbed`（含 `vis`，未虚构 gameId） |
| 占用圆点 | 由 `taken/total` 计数，不再画虚构的幽/妖/咲/魔 |
| reaction chip | `Reaction.count`，无点击光标 |

### 3.8 `src/lib/**`

| 位置 | 判定 |
|---|---|
| `api/types.ts` | 契约本身，未改 |
| `api/client.ts` | `BASE_URL` / `HANDLE` 来自 env；`nowHHMM()` 只在 mock 分支用 |
| `api/mock.ts` | **假数据，但默认关闭**：`USE_MOCK` 需 `VITE_API_USE_MOCK=1/true/on`，`client.ts:27` 默认关。里面的 `4,128,920,470` 等只在这个显式开关下出现。**未改**（理由见 not_finished） |
| `prefs.ts` / `radius.ts` / `theme.tsx` | 真偏好，读写 localStorage，模块加载即 apply |
| `room-share.ts` | 按 title+host 匹配真实房间列表，匹配不到明说 |
| `clipboard.ts` | 返回真实成功/失败，调用方如实上报 |
| `tauri/launch.ts` / `loader.ts` | 只用 `Room.endpoint`，缺路径/缺 endpoint 时抛可读错误 |
| `unavailable.tsx` | 不可用态的唯一渲染方式 |

### 3.9 `src/App.tsx` / `router` / `hooks`

无显示编造值。`DevSwitcher` 被 `import.meta.env.DEV` 包住，不进生产包。`App.tsx:78`
的 `ProfilePopover` 消息按钮用 `me?.handle`（上一轮已修）。

---

## 4. `not_finished`

诚实列出，这一轮**没有**处理的项目及原因：

1. **`PortraitPlate` 默认 `mono = '幽'`（`src/pages/profile.tsx:22`）** — 这是默认值，
   不是显示值：两个调用点（`ProfilePopover:108`、`ProfileFull:253`）都显式传
   `me.name.slice(0,1)`，所以运行时永远看不到「幽」。改它需要把可选参数改成必填，
   属于签名调整而非本轮的显示值清扫，留给下一轮顺手做。

2. **`src/lib/api/mock.ts` 里的整套假数据** — 包括 `4,128,920,470`、群成员 `248`、
   `online 42`、`established 2019.08`、`uid 4128920`。**判定：不是编造值**，因为
   `client.ts:27` 的 `USE_MOCK` 默认关闭，只有显式设 `VITE_API_USE_MOCK=1` 才会返回
   它们——那时界面上显示的是「后端返回的数据」，语义正确。但它确实是编造数据，
   要彻底消灭需要删除 mock 文件或改名为 `fixtures`，那会牵动 `client.ts` 的每个
   分支，超出本轮范围。

3. **`docs/6b_lockstep_audit.md` 里的 `kExpectedPackSize`** — 提到 152 字节包。
   属 R 车道（`docs/`）与 D 车道，不在 `src/**` 范围内，未动。

4. **`stub()` toast 一族**（`room.tsx` 的「发现」「添加服务器」「房间设置」、
   `group.tsx` 的「群内搜索」「群组设置」「频道通知设置」「置顶消息列表」「成员名单」）
   — 这些按钮点下去弹一个只有标题、没有解释的 toast。**它们不是编造的显示值**，
   但确实属于「点了只回一句话」的类别，本轮只清扫显示值，未统一改成 `Unavailable`。
   已在清扫中确认它们没有伴随任何编造数字。

5. **`group.tsx` 的分类标题旁 `+` 按钮（`group.tsx:188`）与消息搜索框
   （`group.tsx:210`）** — 前者 `onClick` 缺失，后者是 div 假输入框。都无编造值，
   属死控件，未动。

6. **可视化验证的边界** — 见下节。

---

## 5. 验证：跑了什么，看到什么

### 编译门（两条都真跑）

```
$ node node_modules\typescript\bin\tsc -b
EXIT=0

$ node node_modules\vite\bin\vite.js build
vite v6.4.2 building for production...
✓ 1603 modules transformed.
✓ built in 5.46s
EXIT=0
```

### 浏览器实证（无头，未启动任何服务）

端口 4173 上**已有一个** preview 服务在跑（`netstat` 确认 PID 15128 LISTENING）。
按 brief 要求**没有杀掉它，也没有启动新的**。用无头 Chromium 连它，用 `init_scripts`
桩掉 `fetch` 返回一份真实形状的 `Room`（含 `endpoint`），让参数面板真的渲染出来。

**基础 tab**（`tab.text('body')` 实际输出片段）：

```
最大 Lives
—
最大 Bombs
—
随机种子
—
席位顺序由服务端返回 · 暂不可换位
```

**网络 tab**：

```
连接方式
P2P 直连 203.0.113.10:7480
NAT 类型
—
当前 RTT
24 ms
MTU
—
加密
无
```

**反作弊 tab**（`ariaSnapshot` 实际输出，含 `Unavailable` 的 `aria-disabled` 理由）：

```
- generic [ref=e16]: DLL 签名
- generic "客户端跑在 WebView 里，读不到注入的 DLL 文件，也算不出它的 SHA-256；服务端没有校验接口——客户端没有任何代码测量它，服务端也没有这个字段，所以这里没有可显示的值。":
  - generic [ref=e19]: —
  - img [ref=e20]
- generic [ref=e24]: 哈希校验
- generic "没有任何代码比对哈希，这条结论没有来源——……": —
- generic [ref=e32]: 最近注入
- generic "注入时刻只写进桌面壳的注入日志，客户端没有读日志的命令：src-tauri 只暴露 launch_game 与 terminate_game。": —
- generic [ref=e40]: 完整性评分
- generic "没有任何评分算法，这条分数没有来源——……": —
```

**结算卡**（`#/room/4912?state=post`）：

```
SESSION ENDED
没有这一局的结算数据
结算还没有数据来源
需要服务端为一场对局落库并下发结果：GET /v1/rooms/{id}/results 一类的接口，
以及 src/lib/api/types.ts 里的一个 MatchResult（得分、用时、剩余残机、通关面数与关键符卡）。
目前这两样都不存在，Room 只带 state，不带结果——所以这里不显示任何分数。
再来一局
返回房间席位
```

**截图**（`omp-sshots-159605d563e62caa.webp`）目视确认：反作弊 tab 四行全是 `—` 加
禁止图标，没有哈希、没有时刻、没有 `98 / 100` 进度条。

**自动化清扫**（一次性脚本，跑完已删）：用 Vite 的 SSR transform 渲染五个受影响页面
（room post / room lobby / lobby th06 / lobby th08 / group），剥掉 `<svg>` 与标签后
在可见文本里 grep 27 个编造值（`Full Cone`、`1492`、`SHA256`、`98 / 100`、`60 Hz`、
`10s`、`0x4F2A91C7`、`战术讨论`、`Relay`/`LAN`/`FRP`、`4,128,920,470`、`18:24`、
`Lives / Death`、四张符卡名、`拖拽换位`、`支持 Markdown` …）。

```
ok   room · post     18044 chars  invented=none
ok   room · lobby    18044 chars  invented=none
ok   lobby · th06    27521 chars  invented=none
ok   lobby · th08    27521 chars  invented=none
ok   group           18028 chars  invented=none

lobby th06 heading : 红魔乡 · TH06 当前 0
lobby th06 old bug : gone

PROBE PASS
```

（剥 `<svg>` 是必要的：第一版探测把 Lucide 图标的 `path d="…0.498…"` 里的 `98` 当成了
显示值，误报了一次。加上剥离后干净通过。）

### 验证的边界（诚实说明）

- 页面数据来自我注入的 `fetch` 桩，不是真的 8080 后端 —— 本轮**没有启动服务端**
  （brief 明令），因此「参数面板拿到真实 `Room.endpoint` 时显示 `P2P 直连 <addr>`」
  这一条是**用契约形状的数据验证的**，不是对着真服务端验证的。
- 未启动 Tauri 桌面壳，未启动游戏，符合 brief 要求。
- `test_input_override.obj` / `test_scene_gate.obj` 是仓库里既有的未跟踪文件
  （时间戳早于本轮），非本轮产物，未触碰。

---

## 6. 复核者最短路径

1. 打开 `src/lib/api/types.ts` —— 这是判据。
2. 打开 `src/pages/room.tsx:221-253`（`ParamMissing` 与理由常量）与
   `:255-311`（四个 tab）。八行全部渲染 `—`，每行带 `title` 说明缺什么。
3. `src/pages/room.tsx:435-464` 结算卡、`:556-563` 频道、`:637-642` 席位说明。
4. `src/pages/lobby.tsx:23-37` `GAME_TITLES`。
5. `src/pages/group.tsx:298-305` 与 `:327-333`（能力声明改正）。
6. 跑 `node node_modules\typescript\bin\tsc -b && node node_modules\vite\bin\vite.js build`。
7. 第 3.8 节说明 `mock.ts` 为什么不在本轮范围；第 4 节列出全部未完成项。
