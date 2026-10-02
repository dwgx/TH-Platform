# 静默失败排障法

**来源**：TH-Platform 项目一晚实战提炼。不是理论——每一条都对应一个真实踩过的坑。

---

## 核心命题

> **失败有两种：会喊的，和不喊的。会喊的从来不浪费时间。**
>
> 所有昂贵的调试时间都花在第二种上。

---

## 1. 先证明仪器能失败

**在相信「测到了失败」之前，先证明这套仪器能测出失败。**

实例：我的 SendInput 探针打印「NO INPUT REACHED THE GAME」。
真实原因：C# shim 编译失败，**一个键都没发出去**。
如果我照单全收，就会得出「合成输入不可行」这个完全错误的结论，并放弃整条技术路线。

**做法**：故意注入一个已知失败，看仪器是否报出来。

```
注入 const x: number = "a string" 到被 @ts-nocheck 覆盖的文件
→ tsc -b  完全沉默
→ vite build  成功
```

结论：**这两个命令对页面文件毫无检查能力**。此前所有「tsc -b 绿」的记录全部作废。

---

## 2. 静默失败的四种常见形态

按本项目实际遇到的顺序：

| 形态 | 症状 | 真因 |
|---|---|---|
| **被压制** | 检查永远通过 | `@ts-nocheck` / `t.Skip()` / 空命令 |
| **传错量** | 收发数据不一致 | 传了**缓冲区容量**而非**实际长度** |
| **丢弃结果** | 收到的字段全是零值 | 解码到局部变量然后扔掉 |
| **合并发送** | 只收到一半 | 两个包塞进一个 datagram，接收端只解一个 |

**四种都不会报错。** 进程活着，断言不触发，日志安静。

---

## 3. 让失败路径说话

**每一条失败路径都必须自己说自己是哪一条。**

改之前（`on_hello` 五条拒绝路径，全部静默）：

```c
if (hello.header.ver_major != THP_VERSION_MAJOR) {
    res.action = Action::Rejected;
    return res;                    // ← 什么都没说
}
```

改之后：

```c
if (hello.header.ver_major != THP_VERSION_MAJOR) {
    log_line("thp: HELLO rejected VERSION_MISMATCH (peer v%u.%u, ours v%u.%u)", ...);
    res.action = Action::Rejected;
    return res;
}
```

**这一条改动直接定位了 5 个 bug 中的 2 个。**

---

## 4. 两侧都报，然后用差值定位

单侧日志只能说「我这边看到什么」。两侧都报，**差值就是线索**。

```
发送端：thp: send 76 bytes to 127.0.0.1:7480
接收端：thp: HELLO rejected MALFORMED (512 bytes)
```

同一个包，76 vs 512。**差值 436 恰好是缓冲区尾部**。
→ 结论：发送端发对了，是接收端用错了长度。10 秒定位一个「不可能」的 bug。

---

## 5. 逐包记录类型与尺寸

```
thp: recv type=1 size=76     ← HELLO
thp: recv type=2 size=98     ← NEGOTIATE
（没有 type=3）              ← WELCOME 从未出现
```

**「缺少某一类」是最难从代码里看出来的信息**，因为代码里它看起来完全合理。
只有把实际收到的包列出来，「缺哪一类」才成为事实。

---

## 6. 匹配路径也必须打日志

```
失步：log("DESYNC at frame %u")
匹配：（静默）
```

于是「匹配」和「从来没比对过」在日志上**完全一样**。

> **失败时沉默已经很糟；成功时沉默更糟，因为它伪装成正常。**

实例：`thp: hash match frame=...`（限频）加上之后，
一次运行才第一次能区分「同步了」和「根本没同步」。

---

## 7. 让工具自己说这些话

```
$ tools/th-debug/dll_test.ps1
264 checks, 0 failures

Host-side units pass. What that does NOT establish:
  - that two instances agree (needs the live two-instance run)
  - that the socket path is correct (these tests never open one)
  - that the game is deterministic (needs the live run)
Five silent bugs previously survived a fully green run of these tests.
```

**写在文档里的话会被跳过，工具自己打印的话不会。**

---

## 8. 单元测试覆盖不到接缝

**264 项测试全绿，而 5 个真 bug 就住在里面。**

原因不是测试写得差，是**测试绕过了出问题的那一层**：

```
测试调的是  session.on_hello()      ✓ 被测 264 次
实际出问题的是 handle_datagram_locked() ← 从未被测
              转发时的长度传递
```

> 单测证明的是「单元对」，不是「接缝对」。
> 而静默失败几乎总是住在接缝上。

**做法**：为接缝写测试。上面三个 bug 的第一个，如果有一个「socket 收到 76 字节、
分发函数收到 76 字节」的测试，当场就会红。

---

## 检查表

排查任何「不工作」之前，逐条回答：

- [ ] 我能**证明**这套检查能返回失败吗？（注入一个已知失败）
- [ ] 每条失败路径都**自己说自己是哪一条**吗？
- [ ] 两侧都报了吗？差值有意义吗？
- [ ] 我记录了**实际收到的每一个包/字段**吗？
- [ ] 成功路径也报了吗？还是只有失败路径在说话？
- [ ] 这个测试跨过了出问题的那一层吗，还是绕过了它？
- [ ] **每个返回结构体的函数，调用点真的用了返回值吗？**（有返回值 ≠ 有效果）
- [ ] **每个枚举值都有消费者吗？** 数一下：
      `grep -rn "Action::X" src/ | grep -v "action = " | wc -l` → 0 就是死值

任何一条答「否」，你看到的就可能不是真相。

---

## 附：本项目的第 6、7 例——评审车道找到的

第 6、7 例不是「测试没覆盖」，而是**代码里有一条完整路径，其返回值从头到尾没人读**。

```c
// thp_session.cpp：唯一把延迟比对结论变成 Action 的地方
Result Session::store_local_hash(uint32_t frame, uint32_t hash) {
    const thp_hash_verdict v = thp_store_local_hash(&session_, frame, hash);
    if (v == THP_HASH_MISMATCH) { res.action = Action::Desync; ... }
    return res;
}

// lockstep.cpp：调用它，然后把返回值扔了
g_state.session.store_local_hash(g_state.session_frame, digest);   // Result dropped
```

**后果**：延迟路径的失步永远报不出来。

**为什么外部看不出来**：非延迟路径的失步**能**报出来，所以我们确实看到了
`DESYNC at frame 30`，于是合理地推断「检测在工作」。
**它只在工作一半时看起来完全正常。**

### 通用形态：枚举值写了没人读

同一份评审还发现：`Action::Rejected` / `Starved` / `Disconnected`
**消费者数量均为 0**。全树只有一处读 `res.action`，且只处理 `Desync`。

会话在拒绝对端、在饿死、在断开——**没有任何代码对此采取行动**。

---

## 附：规范与实现分叉——评审说实现改对了，规范没跟上

`ProtoReview` 指出 TH08 profile 声明的覆盖「只含弹幕/敌人计数」。我核对源码，**它是对的**：

```c
// D:/Project/TH08-Platform/protocol/thp_profile_th08.h:178
"activeEnemyCount(u32) activeBulletCount(u32)  <-- COUNTS ONLY, see spec 8.4\n"
```

而 DLL 的 `dll/src/state/state_hash.h` 已经改成哈希**整块区域**
（`kLabelBulletManager` / `kLabelEnemyManager`），并明确注释「no activeBulletCount
/ activeEnemyCount anywhere」。

**修复车道只改了实现，没改规范。**

### 为什么这类分叉特别危险

1. **它对当前代码无害**——DLL 用的是 `state_hash.h`，不是 profile 头
2. **它对新代码有毒**——任何按规范实现 TH06 / TH07 的人，会原样复现 th08-multi 那个弱点
3. **评审看到的是规范，测试看到的是实现**，两边都不出错

> **修 bug 时要问：还有哪些地方描述了同一件事？**
> 规范、profile、类型定义、注释、文档——它们不会因为实现修好了就自动更新。
> **一个 bug 修完，只有一处变了，那通常意味着还有几处没变。**

### 检查动作

```
grep -rn "<被修掉的标识符>" <规范目录> <类型定义> <文档>
```

实现里删掉的东西，在规范里往往还在。

---

## 一句话版本

> **先让失败可见，再让它自己说，最后才去读代码。**
>
> 读了半天代码猜出来的结论，不如让程序喊一嗓子。