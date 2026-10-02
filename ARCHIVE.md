# ARCHIVE — 项目归档说明

**归档日期**:2026-10-02
**状态**:主动停止,不是崩溃。代码处于可编译、测试全绿的状态。

---

## 一句话结论

**联机锁步没跑通。**平台层(客户端/服务端/大厅/好友/群组/私信)是完整可用的,
游戏侧 netcode 卡在「还差一个状态字段没定位」。停止的原因是方向问题,不是难度问题——
详见第四节。

---

## 一、归档时的真实状态(全部有命令可复现)

### 绿的

| 检查 | 命令 | 结果 |
|---|---|---|
| 客户端类型 | `node node_modules/typescript/bin/tsc -b` | EXIT 0 |
| 客户端构建 | `node node_modules/vite/bin/vite.js build` | EXIT 0 |
| DLL 32 位构建 | `pwsh -File tools/th-debug/dll_build.ps1` | `BUILD OK` |
| 权威规则 | `dll/tests/run_authority_test.ps1` | 379 checks, 0 failures |
| P2 slot 归属 | `dll/tests/run_p2_slot_test.ps1` | 41 checks, 0 failures |
| 失步检测 | `dll/tests/run_desync_test.ps1 -Socket` | 29 checks, 0 failures |
| 字段级二分 | `dll/tests/run_bisect_test.ps1 -Socket` | 48 checks, 0 failures |
| 服务端 | `go build ./... && go vet ./... && go test ./...` | 全部 ok |

### 红的 / 未完成的

**两个 th08 实例仍然会分岔。**归档前最后一次实测:

```
thp: DESYNC at frame 90 (deferred, remote 0x1BDB2FBE vs local 0x4C539BE0)
thp: DESYNC detected at session frame 90 (mismatch 1 this session)
```

定位到「还差一个字段」这一步,但**没有定位到是哪个字段**——因为需要再开一次
游戏窗口做实测,而 owner 已决定停止。`lockstep.cpp` 里已经写好了字段级日志
(`dump_local_field_table_locked`),下次跑一次双实例就能读出答案。

`[UNVERIFIED]` 真游戏内行为:最后一次带字段日志的运行被中止,没拿到数据。

---

## 二、能用的东西(不要删)

**平台层是完整的,而且它不是问题所在:**

- 客户端:React 18 + TS + Vite + Tauri 2,六页(大厅/房间/群组/私信/资料/设置)
- 服务端:Go + chi + Postgres + Redis,房间/大厅/好友/群组/私信全有测试
- loader + 注入:能把 DLL 注入 `th08.exe`
- SendInput 驱动:能真实把游戏开进关卡(`human=1` 已验证)

**工具链在 `tools/th-debug/`,全部入仓,不依赖 TEMP:**
`dll_build.ps1` / `dll_test.ps1` / `drive_visual.ps1` / `two_instance_sync.ps1` /
`verify_authority.ps1`

---

## 三、今晚修掉的七个静默 bug(有价值的部分)

这些是真 bug,换成任何实现都要注意:

1. 传缓冲区**容量**而非实际包长(发 76 收 512)
2. `reader_for()` 解码头部却丢进局部变量 → `ver_major` 恒为 0
3. NEGOTIATE + WELCOME 塞进一个 datagram → 接收端只解一个,另一个静默丢弃
4. `on_hello` 五条拒绝路径全部不打日志
5. guest 的 `on_welcome` 从不回发 START
6. `Action::Rejected/Starved/Disconnected` **零消费者**(产生了但没人读)
7. `store_local_hash` 的 `Result` 被丢弃 + 延迟分支不设 `desync_frame`
   ⇒ **失步检测器的假阴性**,而 `delay=3` 让延迟分支成为正常路径

另有一个**测量本身是错的**:`g_Chain` 和 `g_Player` 尾部含堆指针
(`new ChainElem()`,game/src/Global.cpp:218),两进程地址必然不同,
所以哈希每次都报失步。已把指针字段排除出覆盖表。

方法论沉淀在 `docs/METHOD-silent-failures.md`。

---

## 四、为什么停:这是方向问题

**我们从一开始就在自己造 netcode,而这部分别人已经做完并发版了。**

- `koishikois259/th08-multi` —— MIT,1198 commits,v0.4,已在真实游戏里跑
- `RUEEE/th06_multi_net` —— CC0,1543 commits,54★
  (TH06 甚至在 commit `5bbe65f` "removed P1 as host" 删掉了弹性方案)

两边独立收敛到同一条规则:**网络角色绑定玩家序号,host ≡ P1、guest ≡ P2**,
无奇偶分帧、无逐帧选举。我们最终也选了同一条(见 `docs/research/THP-UPSTREAM-20261002.md`)。

我们比 th08-multi 晚开工 15 个月(他们首个提交 2025-01-09,我们 2026-04-26),
且其全仓从未提及本项目。今晚的时间基本花在修**本不该存在的自制协议**的 bug 上。

**如果重启,正确做法:**

1. **删掉 THP netcode 那一层**(`dll/src/net/` 的 session/transport/hash/authority/失步检测)
2. **改用 th08-multi 的 netcode** —— 我们的 loader 注入机制已经通了,只差换被注入的东西
3. **保留平台层** —— 房间/好友/聊天/客户端/服务端,th08-multi 完全没有这些
4. 只在需要的地方保留 THP:幽灵渲染、第二玩家 HUD

`docs/protocol/THP-PROTOCOL-REVIEW-20261002.md` 里有 20 个缺陷 + 3 个设计阻塞,
可以省下接手的人重新踩一遍。

---

## 五、接手须知

### 坑(每一条都踩过)

- **本机 ANSI 代码页是 1252**,原版 loader 读不了中文路径。
  双实例测试需要 junction `C:\th08game` / `C:\th08game_p`,**修好 loader 宽字符入口后删掉它们**
- **日志文件名是 `log_pid<pid>.txt`,不是 `log.txt`**(`dll/src/logging.h` 的注释和 README 都写错了)
- **`pnpm typecheck` 是空命令恒退出 0**,真检查是 `node node_modules\typescript\bin\tsc -b`
- **`lockstep.cpp` 的 `_locked` 后缀 = 调用方已持 `g_state.mutex`**。
  在里面再 `lock_guard` 一次是死锁(`std::mutex` 不可重入)——
  症状极隐蔽:日志打了一行然后整个接收线程静默卡死
- **诊断日志必须限频**。今晚一次每包日志写了 1900 万行,把日志淹了还拖慢了对端
- **`%TEMP%\thp` 本会话被清空过三次**,工具和文档一律入仓
- **`/Fo` 末尾反斜杠在 cmd.exe 里会转义收尾引号**,`cl` 会报
  "Cannot open compiler generated file" 而不告诉你真正原因
- Go 服务端:不排空的 stdout 管道会在 ~16 个请求后卡死服务
- PowerShell 里带方括号的路径必须用 `-LiteralPath`

### owner 在同一台机器上工作

**不要弹窗口。**起 `th08.exe`、任何 GUI、`Start-Process` 不带 `-WindowStyle Hidden`
的,全部会打断 owner。跑游戏冒烟必须过 `-ConfirmWindows` 开关。
本次归档最后一段反复弹游戏窗口,是本次协作里最明显的失误。

---

## 六、文档索引

| 文档 | 内容 |
|---|---|
| `docs/METHOD-silent-failures.md` | **先读这个**。排查「不工作」前的检查表 |
| `docs/protocol/THP-PROTOCOL-REVIEW-20261002.md` | 协议评审:20 缺陷 + 3 设计阻塞 |
| `docs/research/THP-UPSTREAM-20261002.md` | 上游深挖,为什么该用 th08-multi |
| `docs/WORKFLOW-20261002.md` | 调试方法论 + 同步进展实测阶梯 |
| `docs/protocol/SPEC-SYNC-20261002.md` | 规范同步记录(含 7 处规范自相矛盾待修) |
| `docs/reports/THP-BISECT-20261002.md` | 字段级二分工具与堆指针误报的发现 |
