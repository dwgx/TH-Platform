# th-debug — TH08 debugging & smoke-test tooling / TH08 调试与冒烟工具

**Everything needed to drive, observe and gate-verify the original `th08.exe`.**

These tools used to live only in `%TEMP%\thp\`, where they were lost and
rebuilt at least twice and where one lane deleted the whole directory during
cleanup. They are here now because they were expensive, not because they are
fragile.

> **Golden rule / 金律**
>
> **Connecting proves nothing. Only a state-hash comparison over a real,
> human-driven stage proves synchronization.**
>
> **"连上了"什么都不能证明。只有在真人操作的关卡上做 state hash 比对，才能证明同步。**
>
> This project has already retracted one "proof of synchronization" that was
> actually the game's unattended attract demo. `peer connected` in the DLL log
> means a UDP handshake happened. It says nothing about frames agreeing.

---

## 1. What is in here / 里面有什么

| File | What it does |
|---|---|
| `input_helper/THPInput.cs` | SendInput scancode driver. The **only** viable synthetic-input path into th08. |
| `input_helper/build.ps1` | Compiles it to `thp_input.exe`. Exists because getting this C# to compile cost half an hour. |
| `input_helper/thp_input.exe` | Build output. Not committed; produced by `build.ps1`. |
| `ThDebug.psm1` | Shared window/process P/Invoke and the single copy of the `th08.cfg` byte-34 writer. |
| `force_windowed.ps1` | Sets `th08.cfg` byte 34 = `windowed`, after validating the layout. Does not launch the game. |
| `launch_windowed.ps1` | Launches two instances and **measures** that both are really windowed. |
| `verify_gate_live.ps1` | **Phase A.** Unattended. The DemoGate latch must stay closed. |
| `verify_gate_human.ps1` | **Phase B.** Real held input. The DemoGate latch must open. |

`launch_windowed.ps1`, `verify_gate_live.ps1` and `verify_gate_human.ps1`
**launch the game and put windows on your desktop**. Per `AGENTS.md` §7b they
refuse to run without `-ConfirmWindows`.

---

## 2. The input helper / 输入器

### 2.1 Build it

```powershell
pwsh -NoProfile -File tools/th-debug/input_helper/build.ps1
```

Prints `BUILD OK: ...thp_input.exe (9728 bytes)` and exits 0.
Override the toolchain with `-Csc`, `-FrameworkDir`, `-OutputExe`.

### 2.2 The four traps that will recur

1. **`INPUT` must be exactly the platform size.** x64 = **40 bytes**
   (`type` 4 + 4 alignment + 32 union). Hand-rolled padding gives 56 and
   `SendInput` fails with **error 87, `ERROR_INVALID_PARAMETER`**. The union is
   `[StructLayout(LayoutKind.Explicit)]` and `MOUSEINPUT` is what makes it 32.
   *Good news: a wrong-sized struct is rejected outright, so it cannot
   silently half-work.*

2. **Reference-assembly paths contain spaces** (`C:\Program Files (x86)\...`).
   Unquoted, csc splits them into bogus source-file arguments and reports
   **CS2001** for fragments like `(x86)` and `Files`. Every `/r:` switch in
   `build.ps1` is individually quoted.

3. **Do not build this with the PowerShell `Add-Type` compiler.** It dies with
   `System.OutOfMemoryException` on the full `INPUT` union. That is the entire
   reason this is a standalone EXE.

4. **The hold belongs BETWEEN down and up.** See §2.3.1 — this one is
   measured, and getting it wrong produces silent nothing rather than an error.

`/noconfig` is also passed so csc does not pick up its `csc.rsp`.

### 2.3 Use it

```
thp_input.exe focus                       # bring the th08 window to the foreground
thp_input.exe focuspid <pid>              # focus a SPECIFIC instance (needed when two run)
thp_input.exe tap <scancode> [n] [gap_ms] # press+release a scancode
thp_input.exe seq <scan:hold:gap> ...     # scripted sequence
thp_input.exe click                       # click client-area centre (also focuses)
thp_input.exe client                      # print client-area centre in screen coords

thp_input.exe tap 2C 3 300                # Z three times, 300ms apart
thp_input.exe seq "2C:200:350 50:200:300" # Z, then Down
```

**Why scancodes and not virtual keys.** th08 reads **DirectInput**, not window
messages, so `PostMessage(WM_KEYDOWN)` never reaches it — proven, the injected
DLL logged `input: cur=0x0000` forever. `SendInput` with
`KEYEVENTF_KEYEVENT_VK` only drives the window-message queue;
**`KEYEVENTF_SCANCODE` drives the real input stack that DirectInput polls.**

A medium-integrity, non-admin process can use `SendInput` fine. Error 87 is a
struct-size problem, never a permissions problem.

### 2.3.1 THE FOURTH TRAP: the hold must sit BETWEEN down and up

This one is measured, not theoretical, and it cost the most time.

`Tap()` sends the key-down, **sleeps `holdMs`**, then sends the key-up. An
earlier version sent both immediately and slept afterwards. From the outside
those look identical. They are not:

> th08 polls DirectInput device state; it does not receive edge notifications.
> A key that is already back up by the time the next poll runs is **never
> observed at all**.

Measured, with the window correctly focused and `SendInput` returning success
every time:

| hold | what the game logged |
|---|---|
| 80 ms | `input: cur=0x0000` — nothing arrived |
| **200 ms** | `input: cur=0x0001` — arrived, then correctly released to `0x0000` |

**Use 200 ms or more.** Below that you get silent nothing, which is
indistinguishable from "the method does not work".

### 2.3.2 Two more measurement traps

- **Sampling point lies.** Reading the DLL log immediately after a tap often
  lands in the gap and shows `0x0000`. Read the `scene:` line's `edge_frames` /
  `held_frames`, which are latched counters.
- **Silence is not success.** An earlier version of `drive_visual.ps1`
  discarded the screenshot tool's output and printed the filename regardless,
  so a failed capture still looked like a success. `Grab()` now checks the
  file exists and returns `CAPTURE-FAILED(...)` otherwise.

### 2.3.3 Two instances: focus each one by pid

`focus` finds the **first** th08 window. With two instances running, every
keystroke then goes to the same one and the other sits in its attract demo —
which looks exactly like "input is not working". Use `focuspid <pid>`.

### 2.3.4 Seeing where you are

`drive_visual.ps1` takes a PNG after every keystroke. **Use your eyes rather
than guessing from a log line**: the th08 title menu has screens you cannot
distinguish from log output alone, and the first real screenshot is what proved
the menu navigation was reaching a stage at all.

### 2.4 Scancode table (PS/2 set 1)

| Key | Code | | Key | Code |
|---|---|---|---|---|
| Z | `0x2C` | | Up | `0x48` |
| X | `0x2D` | | Down | `0x50` |
| Enter | `0x1C` | | Left | `0x4B` |
| Shift | `0x2A` | | Right | `0x4D` |
| | | | Esc | `0x01` |

### 2.5 ZUN input bit table

The DLL reads this word, **not** the scancode. Set it with
`TH08_PLATFORM_TEST_INPUT` (see §5).

```
0x0001  SHOOT (Z)     0x0002  BOMB (X)     0x0004  FOCUS      0x0008  MENU/SKIP
0x0010  UP            0x0020  DOWN          0x0040  LEFT       0x0080  RIGHT
```

Source: `game/src/Global.hpp:90-106`. An earlier brief shifted these by two
bits, which turned Up into shot-slow; that is fixed.

---

## 3. th08 config facts / `th08.cfg` 的事实

**Byte 34 is `windowed`.** It was established empirically, not guessed, by
validating neighbouring fields against a config the game itself wrote:

| offset | field | expected |
|---|---|---|
| 20 | `version` | `0x80001` (`GAME_VERSION`) |
| 24 | `padXAxis` | 600 |
| 26 | `padYAxis` | 600 |
| 28 | `lifeCount` | 2 |
| 29 | `bombCount` | 3 |
| 34 | **`windowed`** | **1 = windowed** |
| 39 | `musicVolume` | 100 |
| 40 | `sfxVolume` | 80 |

`game/src/Supervisor.cpp:866` rejects any config that is not exactly **60
bytes**. There is no command-line switch for fullscreen:
`game/src/Supervisor.cpp:834` sets `cfg.windowed = false` as the default and
this file is the only override.

**The game rewrites `th08.cfg` on exit. It must be re-applied before every
single launch.** That is why it is a call (`Set-Th08Windowed`) and not a
one-time edit — all four scripts call the same function.

An earlier attempt wrote byte 17. That landed inside `padYAxis`, silently did
nothing, and the game stayed fullscreen through several rounds of
"fixing the launcher". `Set-Th08Windowed` validates the layout and **refuses
to write** if it does not match, so that class of bug is now loud.

```powershell
pwsh -NoProfile -File tools/th-debug/force_windowed.ps1
```

Safe at any time — it does not launch the game. Add `-Backup` to keep a
`th08.cfg.orig` (off by default; the layout check already bounds the blast
radius to one byte).

---

## 4. The auto-play trap / 自动播放陷阱

**This is the single biggest source of false proof in this project.**

**th08 plays an unattended attract demo and enters the GameManager state about
26 seconds after start.** So `curState == 2` and advancing frames **do not mean
a human is playing.** A previous "proof of synchronization" in this project was
exactly this attract demo and had to be retracted.

The DemoGate lane added a `human_latch`: the DLL reads `g_CurFrameInput` and
tags every scene line. **The gate is keyed on `human=1`.**

| Log line | Meaning |
|---|---|
| `scene: frame=N curState=2 input=0x0000 last=0x0000 human=0 (ATTRACT/NO-INPUT)` | Attract demo. **Not a human.** |
| `scene: ... human=1` | A real keypress is arriving. |

Anything you intend to call synchronization evidence must be collected while
the log is showing `human=1`.

th08-multi hit the same wall; their fix was to disable the title demo outright.

---

## 5. The gate smoke test / 门控冒烟

Two phases. **Run both.** Phase A alone proves the gate is closed, which is
also what a no-op that never runs looks like.

```powershell
# PHASE A — unattended. Sends nothing. The gate must STAY CLOSED.
pwsh -NoProfile -File tools/th-debug/verify_gate_live.ps1 -ConfirmWindows

# PHASE B — a real held input word. The gate must OPEN.
pwsh -NoProfile -File tools/th-debug/verify_gate_human.ps1 -ConfirmWindows -Input 0x0001
```

`-Input` is the ZUN bit word from §2.5; `0x0001` is Z/SHOOT, which is what the
title screen needs to start a game. It is injected through the DLL's test-only
override `TH08_PLATFORM_TEST_INPUT`
(`dll/src/hooks/input.cpp`), which is read **once at DLL init** — one word per
run. That override is used instead of `thp_input.exe` precisely because it
does **not** take focus; for real hand-feel input use `thp_input.exe`.

`verify_gate_live.ps1` deliberately watches **longer than the ~26 s attract
timeout**. A run that never enters a stage exercises nothing and proves
nothing; both scripts print `INCONCLUSIVE` rather than a verdict in that case.

The DLL log is `%LOCALAPPDATA%\th08_platform\log_pid<pid>.txt`.
**The filename is `log_pid<pid>.txt`, not `log.txt`** — the comment in
`dll/src/logging.h` is wrong and has been wrong.

---

## 6. Machine-specific paths / 本机相关路径

Every path is a parameter. Defaults are this machine's:

| Default | Why |
|---|---|
| `D:\Game\Touhou\[th08] 东方永夜抄 (日文版)\th08.cfg` | CJK install path. |
| `C:\th08game\th08.exe`, `C:\th08game_p\th08.exe` | ASCII junctions that exist **only** because the loader used to be unable to read the CJK path. Test scaffolding, not product code. |
| `%TEMP%\th08build\bin\Release\th08_platform_loader.exe` | Out-of-tree DLL build output. |
| `%LOCALAPPDATA%\th08_platform` | DLL log directory. |

PowerShell needs `-LiteralPath` for the bracketed `[th08]` path, or the
brackets are read as a wildcard. The module uses it everywhere.

Child processes are started with `ProcessStartInfo.ArgumentList`, never
`Start-Process -ArgumentList`, which throws on this path.

---

## 7. Verifying the scripts without running them

`launch_windowed.ps1` and both gate scripts launch the game. To check they are
syntactically valid **without launching anything**:

```powershell
Get-ChildItem tools/th-debug -Recurse -Include *.ps1,*.psm1 | ForEach-Object {
  $e = $null
  [void][System.Management.Automation.Language.Parser]::ParseFile($_.FullName, [ref]$null, [ref]$e)
  "{0,-34} parse errors = {1}" -f $_.Name, @($e).Count
}
```

Current state: **6 files, 0 parse errors**.

---

## 中文摘要

| 工具 | 作用 |
|---|---|
| `input_helper/build.ps1` | 编译 SendInput 输入器。三个坑：x64 `INPUT` 必须正好 40 字节（否则 `SendInput` 报 err=87）；reference assembly 路径带空格必须逐个加引号（否则 CS2001）；**不要**用 PowerShell `Add-Type` 编译（会 `OutOfMemoryException`），必须独立 EXE。 |
| `ThDebug.psm1` | 窗口/进程 P/Invoke 和 `th08.cfg` byte 34 写入的唯一一份实现。 |
| `force_windowed.ps1` | 设 `th08.cfg[34]=1`，布局校验不过就拒写。**不启动游戏**，随时可跑。 |
| `launch_windowed.ps1` | 起双实例并**实测**窗口化（`WS_OVERLAPPEDWINDOW` set、`WS_POPUP` clear、客户区 640×480、窗口真在被摆放的位置）。 |
| `verify_gate_live.ps1` | Phase A：无人值守，门控必须**保持关闭**。 |
| `verify_gate_human.ps1` | Phase B：真实输入，门控必须**打开**。 |

**配置事实**：`th08.cfg` **byte 34 是 `windowed`**。偏移是拿游戏自己写的配置交叉验证出来的，不是猜的。文件必须正好 60 字节。**游戏退出时会重写这个文件，所以每次启动前都必须重设。**

**自动播放陷阱**：th08 无人操作约 **26 秒**后会自动播放并进入 GameManager 状态，
所以 **`curState == 2` 不代表有人在玩**。判据是日志里的
`human=1`（真人）/ `human=0 (ATTRACT/NO-INPUT)`（自动播放）。

**金律**：**连上了什么都不能证明；只有在真人操作的关卡上比对 state hash 才能证明同步。**
本项目之前那份「同步已证明」其实是自动播放，已经撤回。

**所有会启动游戏的脚本都必须带 `-ConfirmWindows`**，否则直接抛异常（`AGENTS.md` §7b）。