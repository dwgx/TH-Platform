# THP-CLIENT-20261001 — 客户端车道交付报告

- board: `THP-CLIENT-20261001`
- lane: C (client)
- 范围: `D:/Project/TH-Platform/src`、`package.json`、三个 tsconfig
- 提交: 未做（`git add` / `commit` / `push` 归父代）

## 结论

1. `tsc -b` 从 8 行 `error TS`（5 个独立问题）降到 **0**。
2. `typecheck` 从恒退出 0 的空命令改成 `tsc -b`，并用注入错误反证它现在会失败。
3. `src/lib/api/client.ts` 从「永远返回 mock」改成真 HTTP：基址可配置、17 条路由严格照
   AGENTS.md 第 6 节、mock 只在显式开关下兜底、失败不崩页（`[]` / `null` / 抛出）。

---

## 一、逐文件改动与理由

### `src/router/index.tsx` —— 新增 `toRoute()` 收窄函数

**为什么**：`App.tsx` 的 5 个报错来自同一个根因 —— 页面把 `onNavigate` 声明成
`(target: { [k: string]: any; name: string }) => void`，而 `navigate` 是
`(next: Route) => void`。`Route` 是字面量判别联合，`{ name: string }` 不是它的超类型，
函数参数逆变检查直接失败。

**怎么改**：没有把回调 cast 成 `any`，也没有把 `Route` 放宽。在 router 里加了真正的收窄
函数 `toRoute(target: { name: string; [k: string]: unknown }): Route`，按 `name` 分支
逐字段做 `typeof` / `isGameId` 检查，非法值退回默认值。用 `unknown` 不用 `any` ——
未校验输入按规则用 `unknown` 收窄。`isGameId` 是类型守卫（规则允许：它保留 narrowing）。

### `src/App.tsx` —— 接上收窄，显式 toast 类型

- import 改为 `useRoute, toRoute, type Route` 和 `ToastHost, type ToastItem`。
- 新增 `onNavigate`（`useCallback`）：接收页面传来的宽松 target，交给 `toRoute` 收窄后
  调 `navigate`。5 处页面（lobby / room / group / dm / profile）全部改用它。
- `type ToastMsg = ToastItem` —— 复用设计系统导出的类型，消掉原来那份重复定义。

### `src/components/design/ui.tsx` —— 给 `Toast` / `ToastHost` 补 props 类型

**为什么**：`ToastHost({ toasts = [], onClose })` 无类型解构，默认值 `[]` 让 `toasts`
推断成 `never[]`，于是 `App.tsx` 报 `ToastMsg[] is not assignable to never[]`。
按 brief 要求在**源头**修：显式声明 `toasts?: ToastItem[]; onClose: (id: number) => void`，
并导出 `ToastItem` 接口。调用点没有 cast。
（文件顶部虽有 `// @ts-nocheck`，但那不影响调用方看到错误的 props 类型，这里加类型有效。）

### `src/lib/api/client.ts` —— 真 HTTP 重写（主要交付）

配置三项，全部可选，默认值写在 client 里：

| 环境变量 | 默认 | 作用 |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8080` | 后端基址，末尾斜杠会被剥掉 |
| `VITE_HANDLE` | `local` | `X-Handle` 身份头（本轮无鉴权） |
| `VITE_API_USE_MOCK` | 关 | `1`/`true`/`on` 才走 mock，**默认真 HTTP** |

17 条路由逐条照 AGENTS.md 第 6 节，一个没多一个没少。`{id}` / `{handle}` 统一过
`encodeURIComponent`，handle 里带斜杠不会逃出自己的路径段。

失败策略（brief 的硬要求）：

- 集合路由（返回 `[]` 的 11 条）→ 网络错误、非 2xx、body 非法，一律 `?? []`；
- 可空路由（`getRoom` / `getProfile`）→ 返回 `null`；
- 契约返回类型非空的 4 条（`getMe` / `getGroup` / `getGroupAnnouncement` /
  `sendMessage`）→ 抛出。**这 4 条不能返回 `null`**：`getMe` 被
  `profile.tsx:27` 的 `if (!me) return null` 消费，而 `useAsync` 本就把 rejection 转成
  `data === undefined`，正是页面已在渲染的分支；返回 `null` 反而造出第三种状态。
- 每次失败 `console.warn`，带 method、URL、状态码。

`request()` 是唯一传输层；`decode()` 只做容器检查（数组或对象）就交给泛型 —— 字段级解析
不在客户端做，因为服务端 lane 已逐字段照 `types.ts` 建 struct，再解析一遍就是第二套真源。
全 client 只有 `decode` 里一处 `as T`，且前面刚做过 `unknown` 检查。

原来 `sendMessage` 的未使用参数 `channelId` 顺带解决：它现在进了 URL。
`mock.ts` 保留为 dev 兜底数据，分支收在每个函数第一行，关闭时会被树摇掉。

### `src/lib/api/mock.ts` —— 删掉未使用的 `Channel` 导入

TS6136。未使用导入，删掉即可；`Channel` 通过 `ChannelCategory.items` 间接使用。

### `src/vite-env.d.ts` —— 新建

`/// <reference types="vite/client" />` + `ImportMetaEnv` 三个字段声明，让
`import.meta.env.VITE_*` 有类型且拼错名字会报错。字段全 optional —— 不配 `.env` 也能跑。

### `package.json`

`"typecheck": "tsc --noEmit"` → `"tsc -b"`。
`tsconfig.json` 是 solution 风格（`files: []` + `references`），`tsc --noEmit` 对它一个
文件都不检查、恒退出 0；`tsc -b` 走 references 才是真正的项目检查。

### tsconfig 三个文件

**没有改**。报出来的都是真错误，靠改配置「消掉」等于把检查删了。

---

## 二、验收证据

退出码用 `$?` 确认（本 bash 层 `$LASTEXITCODE` 打印为空，不可用）：

```
TSC_EXIT=0
VITE_EXIT=0
```

### `node node_modules/typescript/bin/tsc -b`

零 `error TS` 行。（首次跑带 `--force` 排除增量缓存；不带同样退出 0。）

### `node node_modules/vite/bin/vite.js build`

```
vite v6.4.2 building for production...
transforming...
Browserslist: browsers data (caniuse-lite) is 6 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
✓ 1593 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.22 kB │ gzip:   0.63 kB
dist/assets/index-P1VaM1xo.css      7.60 kB │ gzip:   2.22 kB
dist/assets/index-CzlJ7Qrl.js   1,055.39 kB │ gzip: 211.11 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
  - Using dynamic import() to code-split the application
  - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
  - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 28.06s
```

> chunk 体积警告是既有的（React + Radix 全量打进一个包），非本次改动引入，
> brief 没要求分包，没动。

---

## 三、`typecheck` 不再是空命令 —— 反证

光看「退出 0」不能证明它会失败，所以往 `client.ts` 注入一个类型错误再跑：

```
src/lib/api/client.ts(172,11): error TS2322: Type 'string' is not assignable to type 'number'.
src/lib/api/client.ts(172,11): error TS6133: 'proof' is declared but its value is never read.
```

注入已撤销，`tsc -b` 回到 0 错误。原来的 `tsc --noEmit` 对这个错误**不会有任何输出**。

---

## 四、真 HTTP 的实测证据

编译通过不等于接对了。临时起了一个只监听 `127.0.0.1:8099` 的 Node 桩服务（无窗口，
事后已关停，端口已确认释放），把转译后的 `client.ts` 真的打过去。

### 实际发出的 17 条请求

```
GET /v1/rooms?game=th08  X-Handle=yuyuko
GET /v1/rooms/4912  X-Handle=yuyuko
GET /v1/rooms/4912/seats  X-Handle=yuyuko
GET /v1/rooms/4912/spectators  X-Handle=yuyuko
GET /v1/rooms/4912/chat  X-Handle=yuyuko
GET /v1/friends  X-Handle=yuyuko
GET /v1/lobby/friends  X-Handle=yuyuko
GET /v1/friends/pending  X-Handle=yuyuko
GET /v1/lobby/chat?game=th08  X-Handle=yuyuko
GET /v1/dm/sakuya/chat  X-Handle=yuyuko
POST /v1/channels/chan-1/messages  X-Handle=yuyuko  body={"text":"hello from smoke"}
GET /v1/groups/yegumi  X-Handle=yuyuko
GET /v1/groups/yegumi/channels  X-Handle=yuyuko
GET /v1/groups/yegumi/announcement  X-Handle=yuyuko
GET /v1/groups/yegumi/channels/th08/messages  X-Handle=yuyuko
GET /v1/me  X-Handle=yuyuko
GET /v1/users/sakuya  X-Handle=yuyuko
```

与 AGENTS.md 第 6 节逐行一致；`X-Handle` 17 条全带；POST body 是 `{"text": ...}`；
`listRooms` / `getLobbyChat` 只在传了 `gameId` 时才带 `?game=`。

### 后端挂掉时（`127.0.0.1:9`，端口关闭）

```
listRooms -> []
getRoomSeats -> []
getRoom -> null
getProfile -> null
getGroup -> REJECTED
sendMessage -> REJECTED
```

没有任何一条把异常抛给页面。失败时的 `console.warn` 也确实打了（上面省略）。

### mock 开关

```
listRooms count -> 6 | first title -> 永夜抄 PvP — 北京
getMe handle -> yuyuko
```

设了 `VITE_API_USE_MOCK=1` 才走 mock；不设就是真 HTTP（上面 17 条请求即证据）。

---

## 五、没做的 / 需要知道的

- **`pnpm typecheck` / `node_modules/.bin/tsc` 不能用作证据**：`.bin/tsc` 是无扩展名
  shim，直接执行报 `%1 is not a valid Win32 application (os error 193)`。
  `package.json` 里写 `tsc -b` 是对的（走 `tsc.CMD`，正常），但**命令行手敲**要用
  `node node_modules/typescript/bin/tsc`。
- **页面浏览器实测没做** `[UNVERIFIED]`。brief 明确禁止起 `tauri dev`（会弹窗打断
  Owner），本车道也无浏览器驱动通道。已验证的是：编译干净、产物生成、路由与失败行为在
  Node 层逐条跑通。
- **服务端目前只有 `/healthz` 和 `/v1/version`**（AGENTS.md 坑位记录）。真跑起来时业务
  请求会 404，页面显示空列表而不是 mock 数据 —— 这是预期的，server lane 建好后自动通。
  开发时想看数据就设 `VITE_API_USE_MOCK=1`。
- 没加任何依赖；没起窗口、没跑游戏进程、没 `pnpm install`、没做 git 写操作。
- 临时桩服务与冒烟脚本已全部删除；`git status` 只剩本车道范围内的 6 改 1 新增。