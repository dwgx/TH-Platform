# TH-Platform — 工作流程与车道规则

本文件是本项目**唯一**的工作协议。两个仓库共用它：
`D:/Project/TH-Platform`（客户端）与 `D:/Project/TH08-Platform`（DLL + 服务端 + 反编译）。
父代（大脑）只读项目文件；任何写入都由派出的工人完成，工人受本文件的车道规则约束。

---

## 1. 项目是什么

东方 Project STG 第三方联机平台。三块：

| 块 | 位置 | 语言 | 作用 |
|---|---|---|---|
| 客户端 | `D:/Project/TH-Platform` | React 18 + TS + Vite 6 + Tauri 2 | 大厅/房间/群组/私信/资料/设置 六页；Rust 侧负责启动游戏进程并注入 DLL |
| 服务端 | `D:/Project/TH08-Platform/server` | Go 1.26 + chi + Postgres 16 + Redis 7 | 房间/大厅/匹配/聊天的 HTTP + WS 后端 |
| 游戏侧 DLL | `D:/Project/TH08-Platform/dll` | C++20 + MinHook，**必须 32 位** | 注入原版 `th08.exe`，加 UDP lockstep、第二玩家、幽灵渲染、HUD |
| 反编译 | `D:/Project/TH08-Platform/game` | C++（th08 decomp fork，AGPL-3.0） | 结构体布局与函数地址的知识库。**不是关键路径** |

`D:/Project/TH08-Platform/game` 是 th08 上游 fork，不许改成 2P——那是 Path C，六个月后的事。


**能跑（2026-10-01 实测）**
- `th08.exe` v1.00d 在 `D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.exe`，
  SHA256 `330fbdbf58a710829d65277b4f312cfbb38d5448b3df523e79350b879213d924`（与 README 一致）。
- DLL 32 位 Release **编译通过**（VS2022 Community 14.44 + CMake 4.4.3），产物 94 KB / 31 KB。
- DLL **注入成功**：hook 装上、`%LOCALAPPDATA%\th08_platform\log_pid<pid>.txt` 有帧计数。
- 双实例同机联机 **跑通**：host 学到 `127.0.0.1:7481`，`peer connected`，20 个 ghost 包双向收到。
- Go 服务端 `go build ./...` / `go vet ./...` 干净，`go test ./...` 1 passed。
- 客户端 `vite build` 成功（1593 modules）。

**坑（每一条都踩过）**
- **日志文件名是 `log_pid<pid>.txt`，不是 `log.txt`。** `dll/src/logging.h` 的注释和
  README 都写的 `log.txt`，是错的。写文档/脚本时以实测为准。
- **联机没真正同步。** 两台都停在标题画面，`f=0` 恒定、`x=0.0 y=0.0` 恒定，
  分数在跳但坐标不动。UDP 通了，lockstep **没验证过**。要证明同步必须让两个实例
  **进入关卡**（要人按键），不是只看进程活着、只看 `peer connected`。
- **`loader.exe` 读不了 CJK 路径 —— 这是真 bug，不是脚本问题。**
  本机 ANSI 代码页是 **1252**（`HKLM\SYSTEM\CurrentControlSet\Control\Nls\CodePage`：
  `ACP=1252`、`OEMCP=437`），而游戏目录名是 CJK。`loader.cpp` 的 `main(int, char**)`
  按 ANSI 取 argv，CJK 字符到不了它手里，实测报
  `target not found: D:\Game\Touhou\[th08] ????? (???)\th08.exe`。
  **修法**：`wmain` 或 `GetCommandLineW` + `CommandLineToArgvW`，
  `CreateProcessA` → `CreateProcessW`，`LoadLibraryA` → `LoadLibraryW`。
  在这之前同机双实例测试只能用 junction 绕开：`C:\th08game` → 游戏目录，
  `C:\th08game_p` → `C:\th08game`。junction 是**测试脚手架，不是产品代码**。
- **PowerShell 里带方括号的路径必须用 `-LiteralPath`**，否则 `[th08]` 被当通配符。
  启动子进程用 `[System.Diagnostics.Process]::Start()` + `ProcessStartInfo.ArgumentList`
  （不做通配符展开、全程 UTF-16）；`Start-Process -ArgumentList` 在这个路径上直接抛异常。
- **本项目的脚本一律用 `pwsh`（PowerShell 7）写，不要走 MSYS/bash 那一层。**
 bash 会重写参数、把 CJK 路径和方括号搅坏；pwsh + `-LiteralPath` + `ArgumentList` 没有这些问题。
- **`pnpm typecheck` 是空命令。** `tsconfig.json` 是 `files: []` + `references` 的
  solution 风格，`tsc --noEmit` 因此什么都不检查，恒退出 0。真正的检查是 `tsc -b`，
  而它**现在有 5 个错误**：`src/App.tsx` 3 个（Radix `DropdownMenu onSelect` 回调类型
  不匹配）、`ToastMsg` 被推成 `never[]`、`src/lib/api/client.ts:74` 未使用参数 `channelId`、
  `src/lib/api/mock.ts:5` 未使用导入 `Channel`。别相信 `pnpm typecheck` 的绿色。
- 服务端 13 个包是 `doc.go` 占位（auth/channel/chat/friend/i18n/lobby/matchmaking/
  platform/room/store/user/ws），`sqlc.yaml` 是 `sql: []`，`migrations/` 空。
  **后端目前只有 `/healthz` 和 `/v1/version`。**

---

## 2. 车道（lane）—— 独占写路径

**一个路径一个写手。** 派发前 `board.py open --scope` 占坑，撞路径直接拒，别绕。
父代自己也算车道的一部分：不写任何被跟踪的文件。

| 车道 | 独占写路径 | 交付什么 | 验收命令（一条） |
|---|---|---|---|
| **S** server | `D:/Project/TH08-Platform/server` | Postgres schema + sqlc 查询 + 房间/大厅/好友/群组/私信 HTTP + WS | `cd D:/Project/TH08-Platform/server && go test ./... && go vet ./...` |
| **C** client | `D:/Project/TH-Platform/src`、`D:/Project/TH-Platform/package.json`、`D:/Project/TH-Platform/tsconfig*.json` | 真后端接线、消灭 5 个 tsc 错误、修好 `typecheck` 脚本 | `cd D:/Project/TH-Platform && node node_modules/typescript/bin/tsc -b && node node_modules/vite/bin/vite.js build` |
| **D** dll | `D:/Project/TH08-Platform/dll` | lockstep 真同步（进关卡验证）、RNG 种子交换、desync 检测、**loader 改宽字符入口** | `pwsh -NoProfile -File $env:TEMP\thp\dll_build.ps1` 退出 0 且打印 `BUILD OK` |
| **R** rules | `D:/Project/TH-Platform/AGENTS.md`、`D:/Project/TH-Platform/docs` | 本文件 + 车道细则维护 | 文件存在且第 2 节前半的事实与实测一致 |
| **G** decomp | `D:/Project/TH08-Platform/game` | 只读参考。**默认不派活** | — |

跨车道读随便。跨车道写必须先在 IRC 里说「我占 X 到完」。

**没有车道的地方不许写。** 需要新路径，先扩这张表，再派。

---

## 4. 派发协议

一步都别跳：

```
1  board.py open  --id <ID> --worker <名字> --scope <独占路径> --done "<一条命令或一个文件>"
2  写 brief 到 %TEMP%/thp/<ID>.md，含 # Non-Conflict 和 DONE WHEN:
3  briefcheck %TEMP%/thp/<ID>.md      # 退出码非 0 就别派
4  派工（task 子代理 或 dispatch.ps1 -PromptFile）
5  读回执 → 核 DONE WHEN → board.py close --id <ID> --verdict ok --verify "<真跑过的>"
```

- **一波最多 3 个工人。** 后台实测上限约 6，三轮 12/12/6 的扇出交付 0 份报告。
  要更多就分波，下一波先核上一波的回执。
- **回执必须落盘。** 报告路径写进 brief 的 `# Report` 段，只在最终答复里说等于没交。
- **DONE WHEN 只能是第三方能跑的一条命令，或一个能看的文件。** 不许用形容词
  （`appropriate` / `named` / `relevant` / `完成` / `验证过了`）。要写全：cwd、环境变量、
  期望退出码、断言数。
- **没跑过就标 `[UNVERIFIED]`。** 不要拿 `ok` 遮 `failed`。
- 同一波里 brief 互相独立，工人看不到你的上下文和别人的 brief。

---

## 5. 每条车道的「完成」定义

**S server**
- `go test ./...` 全绿，`go vet ./...` 干净
- `migrations/` 有真实 SQL，sqlc 能生成，`go build ./...` 过
- 每个新端点有至少一个 handler 测试
- 端点形状必须和第 6 节的契约逐字段对得上

**C client**
- `tsc -b` 零错误（不是 `pnpm typecheck`，那个是空命令）
- `vite build` 成功
- `client.ts` 走真 HTTP，mock 只在显式开关下兜底
- 页面在浏览器里真的能打开、能点（不许只看编译通过）

**D dll**
- 32 位 Release 编译退出 0
- 注入后日志出现 `peer connected` **并且**两端都进入关卡后 `f=` 单调递增、
  ghost 的 `x/y` 不再恒为 `0.0`
- 改了协议就更新 `docs/6b_lockstep_audit.md` 里那份字节数（`kExpectedPackSize` 是
  `static_assert` 出来的，别手改）

---

## 6. 跨车道契约（客户端 `client.ts` 的 18 个函数 ↔ 服务端路由）

基址 `http://127.0.0.1:8080`。**S 和 C 各自实现，但字段名必须逐字一致。**
类型真源是 `D:/Project/TH-Platform/src/lib/api/types.ts`，服务端照它建 Go struct，
JSON tag 用小驼峰。

| 客户端函数 | HTTP |
|---|---|
| `listRooms(gameId?)` | `GET /v1/rooms?game=th08` |
| `getRoom(id)` | `GET /v1/rooms/{id}` |
| `getRoomSeats(id)` | `GET /v1/rooms/{id}/seats` |
| `getRoomSpectators(id)` | `GET /v1/rooms/{id}/spectators` |
| `getRoomChat(id)` | `GET /v1/rooms/{id}/chat` |
| `listFriends()` | `GET /v1/friends` |
| `listLobbyFriends()` | `GET /v1/lobby/friends` |
| `listPendingFriends()` | `GET /v1/friends/pending` |
| `getLobbyChat(gameId?)` | `GET /v1/lobby/chat` |
| `getDMThread(handle)` | `GET /v1/dm/{handle}/chat` |
| `sendMessage(channelId, text)` | `POST /v1/channels/{id}/messages` body `{text}` |
| `getGroup(handle)` | `GET /v1/groups/{handle}` |
| `listGroupChannels(handle)` | `GET /v1/groups/{handle}/channels` |
| `getGroupAnnouncement(handle)` | `GET /v1/groups/{handle}/announcement` |
| `listGroupMessages(handle, channelId)` | `GET /v1/groups/{handle}/channels/{cid}/messages` |
| `getMe()` | `GET /v1/me` |
| `getProfile(handle)` | `GET /v1/users/{handle}` |

**不做的**：登录鉴权。本轮身份用 `X-Handle` 头（缺省 `local`）。
`types.ts` 里没有 auth 字段，凭空加就是负债。 matchmaking / relay 归 S 的第二波。

**DLL ↔ 服务端**：DLL 只跟对端 UDP 对话，不连服务端。
服务端要做的是把 `ip:port` 通过房间/匹配结果递给客户端，客户端再交给 loader 的
`--peer`。**不要让 DLL 去轮询 HTTP。**

---

## 7. 不许

- 不许改 `D:/Project` 下没被点名的文件
- 不许把 `game/`（th08 上游 fork）改成 2P
- 不许分发或提交 `th08.exe`、`th08.dat`、`thbgm.dat`
- 不许改 `protocol.h` 的 `#pragma pack` 布局或字段顺序而不更新 `docs/6b_lockstep_audit.md`
  （wire 格式刻意对齐 RUEEE/th06_multi_net，改了就不兼容了）
- 不许用 `pnpm typecheck` 当验收证据（空命令）
- 不许给 DLL 加 always-on 常驻钩子而不给 `TH08_PLATFORM_*=0` 关法
- 不许建第二套约定：路由、类型、协议、验收命令，本文件是唯一真源
- 删东西之前先问：这个结构在分类还是在装饰？
- **不许在 Owner 干活的时候往他桌面弹窗口。** 游戏进程（`th08.exe`）、
  任何 GUI、`Start-Process` 不带 `-WindowStyle Hidden` 的，全部算。
  要跑游戏冒烟必须过 `-ConfirmWindows` 开关，且脚本自己把窗口挪到屏幕外。
- **不许 `sleep` / 轮询当心跳。** 后台任务用 `async`，等它回调。
  父代不空转。

---

## 7b. 窗口与前台 hygiene（Owner 在同一台机器上工作）

Owner 就在这台机器前办公。任何抢前台/抢焦点/弹窗口的动作都会打断他，
这一条比"跑通验证"优先。

| 要做的事 | 怎么做 |
|---|---|
| 编译 DLL | `pwsh -File %TEMP%\thp\dll_build.ps1` —— MSBuild 是子进程，不弹窗 |
| 起 `th08.exe` | 只在 Owner 当轮明确要求时；必须带 `-ConfirmWindows`，脚本自动 `SetWindowPos(-32000,-32000)` 挪出屏幕 |
| 起 loader | `ProcessStartInfo.WindowStyle = 'Hidden'` |
| 起 `go` / `node` / `pwsh` | 子进程，默认不弹窗；**不要**加 `-NoNewWindow` 之外的任何前台参数 |
| 跑长任务 | `async`，不阻塞父代，不轮询 |

**判断标准**：如果一个动作会让 Owner 眼前多出窗口或者让他失去焦点，就不做，
或者做了之后立刻藏起来。做之前先问一句"这会弹窗吗"。

---

## 8. 本机跑得起来的命令

```powershell
# 服务端
cd D:\Project\TH08-Platform\server; go build ./...; go test ./...; go vet ./...

# 客户端（注意：不是 pnpm typecheck，那个是空命令）
cd D:\Project\TH-Platform; node node_modules\typescript\bin\tsc -b
cd D:\Project\TH-Platform; node node_modules\vite\bin\vite.js build

# DLL 32 位构建（out of tree，产物进 %TEMP%\th08build）
pwsh -NoProfile -File $env:TEMP\thp\dll_build.ps1

# 双实例联机冒烟 —— 会起游戏窗口，Owner 没点名就不许跑
pwsh -NoProfile -File $env:TEMP\thp\dll_2p.ps1 -ConfirmWindows
```

DLL 构建输出在 `%TEMP%\th08build\bin\Release\`（`th08_platform.dll` + `th08_platform_loader.exe`）。
**不要**把 build 目录放进仓库。

同机双实例测试需要两个 junction（`C:\th08game` → 游戏目录，`C:\th08game_p` → `C:\th08game`），
它们是**测试脚手架**，因为 loader 读不了 CJK 路径。修完 loader 的宽字符入口后删掉它们。

