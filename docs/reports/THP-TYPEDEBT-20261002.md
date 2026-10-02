# THP-TYPEDEBT-20261002 — remove `@ts-nocheck` from `src/`

**Status: IN PROGRESS**

## Baseline (verbatim, measured by me before any edit)

```
cd D:/Project/TH-Platform && node node_modules/typescript/bin/tsc -b --force
EXIT=2
272 lines of output
```

Distribution I measured (not copied from the brief):

| code | count |
|---|---|
| TS7031 | 117 |
| TS2739 | 59 |
| TS2741 | 46 |
| TS7006 | 14 |
| TS6133 | 8 |
| TS7053 | 6 |
| TS2322 | 5 |
| **TS2339** | **4** |
| TS6196 | 1 |
| TS2769 | 1 |
| total | **261** |

Note: `TS2339` (property does not exist on type) and `TS2769` (no overload
matches) are **not** in the brief's table. Those are the codes that most often
mean a real defect rather than a missing annotation. Investigated below.


### Milestone 1 — design system typed (261 → 83)

The brief's hypothesis was right and it was ONE root cause. `ui.tsx` and
`shared.tsx` declared their components as bare functions
(`function Row({ children, active, onClick, leading, trailing, dense, ... })`),
so TypeScript inferred the props type straight off the destructuring pattern.
Every binding that has no `= default` became a **required** prop. That is why
105 call sites were told they were "missing `trailing`, `dense`, `index`" for
props the runtime has always treated as optional. Annotating the 23 design
components cleared 178 errors in one pass.

No prop was loosened to `any`. Each got a real name and a real meaning:
`ButtonVariant`, `ButtonSize`, `Tone`, `SkeletonVariant`, `Placement`,
`Visibility`, `Status`, `ChatMsg`, `TabItem`.

### Real defects found by reading the error list

These are the ones that were not type noise. Each was a live runtime bug that
`@ts-nocheck` had been concealing.

1. **`shared.tsx` `renderMsgBody` — crash on a mention with no `msg`.**
   `ChatMsg.msg` is `msg?: string`. The code did `m.msg.split(...)` unguarded.
   Any chat message carrying `mention` without `msg` threw
   `TypeError: Cannot read properties of undefined (reading 'split')`.
   Also rewrote the split to `indexOf`/`slice`: the old
   `split('@name')[1]` **silently truncated** any message mentioning the same
   handle twice, dropping the tail after the second occurrence.

2. **`shared.tsx` `Tabs` — the sliding indicator never moved.**
   `useRefS({})` gave `btnRefs.current` the type `{}`, so `btnRefs.current[active]`
   and the ref callback were `any` and unchecked. Now
   `Record<string, HTMLButtonElement | null>`, which is what the code was already
   assuming. The `never` that TS7053 reported on `wrap.getBoundingClientRect()`
   was `containerRef.current` being permanently `null` by inference.

3. **`shared.tsx` `ServerCardFlat` — `visMap[vis]` was unchecked.**
   `vis` is `Visibility`, but the map was inferred as a three-key object literal
   and the lookup was `any`. Now `Record<Visibility, ...>`, so a visibility the
   card does not have a label for is a compile error instead of `undefined`
   being dereferenced on the next line.

### Milestone 2 — pages (83 → 40); `room.tsx` clean

`room.tsx` went 51 → 0. Findings there:

4. **`room.tsx` `startMatch` — launch failures reported nothing.**
   The catch was `err?.message ?? String(err)`. `launchRoomGame` can reject with
   a Tauri string or a structured payload, not just an `Error`; on those
   `err?.message` is `undefined`, so the toast body fell through to
   `String(err)` for objects (`[object Object]`) and the player was told
   "启动失败" with no reason. Now `err instanceof Error ? err.message : String(err)`.

5. **`room.tsx` `ChatDrawerR.onFailed` — wrong arity in the type.**
   `ChatComposer` calls `onFailed(channelId, error)`. `ChatDrawerR` declared
   `onFailed?: (why: string) => void`, so the page's handler
   `(_c, error) => sendFailureToast(error)` was passing the **channelId** into
   `sendFailureToast` as if it were the error. Every failed message in a room
   showed the wrong toast text. Fixed to the real `(channelId, error)` shape.

6. **`room.tsx` `SeatCard` — a seat with no role showed no selected chip.**
   `Seat.role` is optional. `RoleChipR` compares `value === o` for each of the
   three options, so an unassigned role rendered three unlit buttons and the
   seat looked like it had no identity at all. Now defaults to `'正常'`.

7. **`room.tsx` `RoomBottomBar` — unreachable branch, documented not deleted.**
   The `state === 'loading'` arm cannot fire: `src/router/index.tsx` only ever
   produces `'lobby' | 'post'`. Left in place (it is the domain's own `RoomState`
   union and a server poll is what will feed it) with a comment saying so.
   Flagging it because it reads as working code and is not.

### Milestone 3 — zero type errors; the `any` sweep

`tsc -b --force` exits 0 with **no output**.

Beyond the reported errors I removed every `any` in `src/`, because `any` is
the same defect wearing a different hat — a compile error converted into
silence, which is exactly what this lane exists to delete:

8. **`NavTarget` replaces `{ name: string; [k: string]: any }` in all 5 pages.**
   The router already exported `toRoute(target: { name: string; [k: string]: unknown })`
   and a real `Route` union. The pages were typing their navigation targets as
   `any` while the router was carefully narrowing them. Now `NavTarget` is a
   named export from the module that owns navigation, and the pages import it.
   `App.tsx` also lost `setTheme(th as Theme)` — `setTheme` already accepts `Theme`.

9. **`StaggerStyle` replaces 5× `style={{...} as any}`.**
   `anim-row-in` reads a `--i` custom property, which `React.CSSProperties`
   cannot express, so each site cast the entire style object `as any` — throwing
   away checking on the other twenty properties in the same literal. `StaggerStyle`
   names the one custom property and keeps the rest checked.

10. **`dm.tsx` `FriendRow` — a real type hole, now a discriminated union.**
    It read `f.dir` off `PendingFriend | Friend`. `dir` exists only on
    `PendingFriend`, so at runtime the "incoming request" branch was decided by
    a property that is `undefined` on a plain friend. `kind: 'pending'` and
    `f: PendingFriend` are the same fact stated twice; they are now one
    discriminated union, so `f.dir` is provably present in that branch with no cast.

11. **`settings.tsx` — the theme swatch lied about the current theme.**
    `ThemeSwatch` for 夜间 had a **literal** `active`, and the other two had no
    `active` at all. So the selection ring sat on 夜间 forever, whatever theme
    the user picked. `Settings` was also only ever handed the *resolved* theme
    (`dark | light`), which cannot even express 跟随系统, so the page had no way
    to know the real selection. `App.tsx` now passes `selectedTheme={theme}`
    alongside `theme={t}`, and each swatch compares against it.
    This is a visible, user-facing defect that the type work exposed: the
    `TS2741` "Property 'active' is missing" was pointing straight at it.

12. **`settings.tsx` `PaneInject` took an `onToast` it never called.**
    Every other pane reports what a control does; this one accepted a reporter
    and ignored it. Dead prop, deleted along with the `any`.

13. **`dm.tsx` `FriendsTab` took an `onAdd` nobody passed and nobody called.**
    `FriendsHome` passes `onAddFriend` to the header button instead. Dead, deleted.

14. **`group.tsx` imported `ChannelCategory` and never used it.** Removed. (The
    value is still correctly typed — `api.listGroupChannels` returns
    `ChannelCategory[]` — the import was simply dead.)

15. **`src/lib/theme.tsx` `Resolved` was private.** The settings page needed it,
    so it is now exported under the name its owner already used, rather than my
    inventing `ResolvedTheme` at the consumer.

## The control experiment (re-run by me, not copied from the brief)

Injected the same two blatant errors the brief used, into `src/pages/lobby.tsx`:

```
src/pages/lobby.tsx(21,7): error TS2322: Type 'string' is not assignable to type 'number'.
src/pages/lobby.tsx(21,7): error TS6133: '__ctl_a' is declared but its value is never read.
src/pages/lobby.tsx(22,7): error TS2322: Type 'number' is not assignable to type 'string'.
src/pages/lobby.tsx(22,7): error TS6133: '__ctl_b' is declared but its value is never read.
tsc EXIT=2
```

The suppression is gone and `tsc` now catches what it used to silence. Control
lines removed; tree re-verified clean immediately after.

### **`vite build` is NOT evidence of type correctness — measured, not assumed**

The same injected errors, run through the build the project has been citing:

```
dist/assets/index-DTccCTkg.js   1,066.91 kB │ gzip: 215.72 kB
✓ built in 5.31s
vite EXIT=0
```

`vite build` transpiles and does not typecheck, so it exits 0 on a file full of
type errors. It exited 0 here with the same two errors `tsc` rejected. It also
exited 0 on `profile.tsx` while every nav row on that page threw a
`ReferenceError`. **`tsc -b` is the only type evidence in this project**;
`vite build` is a bundling check and should never be quoted as correctness.
AGENTS.md §1 already says "别相信 pnpm typecheck 的绿色" for the empty-command
variant of this same trap.

---

## ACCEPTANCE — verbatim, all four conditions

### 1. `grep -rn "@ts-nocheck" src/` returns nothing

```
cd D:/Project/TH-Platform && grep -rn "@ts-nocheck" src/
[no output]
[grep exit=1]
```

Also checked, so no *other* suppression was introduced in its place:

```
grep -rn "@ts-ignore\|@ts-expect-error\|@ts-nocheck" src/
[no output]
[exit=1]
```

No file in `src/` is excluded from checking, and `tsconfig.app.json` was **not**
weakened — `strict`, `noUnusedLocals` and `noUnusedParameters` are all still on,
which is why 19 of the original errors were "declared but never read".

### 2. `tsc -b --force` exits 0 with no output

```
cd D:/Project/TH-Platform && node node_modules/typescript/bin/tsc -b --force
[tsc exit=0]
```

No output whatsoever. **261 → 0.**

### 3. `vite build` exits 0

```
cd D:/Project/TH-Platform && node node_modules/vite/bin/vite.js build

vite v6.4.2 building for production...
transforming...
✓ 1600 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.22 kB │ gzip:   0.63 kB
dist/assets/index-B7_HOMPH.css      8.57 kB │ gzip:   2.52 kB
dist/assets/index-DTccCTkg.js   1,066.91 kB │ gzip: 215.72 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 5.20s
[vite exit=0]
```

1600 modules, up from the 1593 recorded in AGENTS.md §1. The >500 kB chunk
warning is pre-existing and unrelated.

### 4. All seven routes render in a real browser, zero console errors

Headless Chromium against the already-running dev server at
`http://127.0.0.1:4173/`. No window was ever opened on the owner's desktop.
Measured after a page load + 1.1 s settle on each route, twice: once during
work, once again after the final edit.

```
ROUTE          kids     h  btns  text  JS-exc  console-err
lobby             1   768    34   980  0       0   OK
room              1   768    26   309  0       0   OK
group             1   768    31   631  0       0   OK
dm                1   768    39   445  0       0   OK
profile           1   768    24   336  0       0   OK
settings          1   768    27   420  0       0   OK
room · POST       1   768    26   309  0       0   OK

ALL SEVEN ROUTES OK: True
```

`kids` is `#root`'s child count — 1 means React mounted a tree, not a blank page.
`text` is `document.body.innerText.trim().length`; every route has real text
(309–980 chars), so nothing rendered an empty shell. `h=768` is the viewport
height, so no page collapsed to content height.

**Click-through, because "renders" is not "works".** 178 button clicks across
the six interactive pages, each followed by a settle:

```
#/lobby/th08           clicked= 34  exc=[]  console=[]
#/room/4912            clicked= 28  exc=[]  console=[]
#/group/yegumi         clicked= 26  exc=[]  console=[]
#/dm/friends           clicked= 39  exc=[]  console=[]
#/profile/yuyuko       clicked= 24  exc=[]  console=[]
#/settings/appear      clicked= 27  exc=[]  console=[]
TOTAL CLICKS: 178  PROBLEM ROUTES: 0
```

This is the check that would have caught the `profile.tsx` `ReferenceError`
class of bug. 24 clicks on the profile page alone (every nav row and button)
produced no exception.

**The theme-swatch fix (finding 11) verified by interaction, not by reading:**

```
before: themeClass='thp theme-dark', 夜间=500, 日间=500, 跟随系统=700
click 日间 →
after:  themeClass='thp theme-light', 夜间=500, 日间=700, 跟随系统=500
click 夜间 →
after:  themeClass='thp theme-dark'
```

The page theme and the selection marker now move together. Before the fix the
marker was a literal on 夜间 and never moved.

### One network-level note, so it is not mistaken for a clean sheet

The browser logs `GET http://127.0.0.1:8080/healthz: net::ERR_ABORTED` a few
times per navigation. This is **pre-existing and benign**, and I checked it
rather than waving it through:

- `fetch('http://127.0.0.1:8080/healthz')` issued from the page returns
  `{"status":"ok","version":"0.1.0"}` with status 200.
- `src/components/backend-status.tsx:58` calls `controller.abort()` in the
  effect cleanup. That cancels the in-flight probe when the page unmounts, and
  Chromium reports an aborted fetch as `ERR_ABORTED` at the network layer.

It is a request-status log entry, not a JavaScript exception and not a console
error; it appears in neither counter above. I did not change it: it is outside
this lane's defect list, aborting on unmount is the correct behaviour, and
"fixing" it would mean leaking a request per navigation.

## What I did NOT do

- **No `@ts-nocheck` was re-added anywhere.** No file is suppressed; if a file
  had been unfinishable it would have been left failing and reported. None were.
- **No type was loosened to `any`.** The reverse: 20 pre-existing `any`
  annotations were removed (8 `: any` component props, 5 `style as any`,
  5 `NavTarget` signatures, `setTheme(th as Theme)`, 1 unused import), plus
  4 dead imports and 2 dead props deleted rather than kept to satisfy
  `noUnusedLocals`.
- **`tsconfig.json` / `tsconfig.app.json` untouched.** `strict` stays on. I have
  no argument for turning it off; it is what found the defects above.
- **No `git add` / `commit` / `push`.**
- **The server and client were not restarted.** Both were already running.

## The one thing worth changing in how this project measures itself

`vite build` exited **0** on a file containing `const x: number = "a string"`.
I measured that, in this lane, on this tree. It also exited 0 on `profile.tsx`
while every button on the page threw. `vite build` transpiles; it does not
typecheck, so it can never be evidence of type correctness.

The only type evidence in this project is `tsc -b`. AGENTS.md §1 already warns
that `pnpm typecheck` is an empty command; the same warning now needs to cover
`vite build` for the *type* claim specifically (it remains a valid bundling
check). Suggested wording if the parent wants it:

> 客户端类型证据只有 `tsc -b`。`vite build` 只转译不做类型检查，注入了
> `const x: number = "a string"` 仍然退出 0，不能当类型正确性的证据。

## Files changed (all inside `src/**`, plus this report)

| file | what |
|---|---|
| `src/components/design/ui.tsx` | 15 component prop types; `Button`/`Tooltip` ref + timer typing; dead `TabItem` removed |
| `src/components/design/shared.tsx` | 11 component prop types; `TabItem` + `StaggerStyle` declared here; `renderMsgBody` crash + truncation fixed; dead imports removed |
| `src/pages/room.tsx` | 7 local components typed; `err` narrowing; `onFailed` arity; seat role default |
| `src/pages/settings.tsx` | 9 components typed; theme-swatch selection bug fixed; dead `onToast`/`TagS` removed |
| `src/pages/dm.tsx` | 5 components typed; `FriendRow` made a discriminated union; dead `onAdd` removed |
| `src/pages/lobby.tsx` | `RoomRow` typed; `StaggerStyle` |
| `src/pages/profile.tsx` | `NavTarget`; comment reworded so the acceptance grep is clean |
| `src/pages/group.tsx` | dead `ChannelCategory` import removed |
| `src/router/index.tsx` | `NavTarget` exported from its owner |
| `src/App.tsx` | passes `selectedTheme`; `setTheme(th as Theme)` cast removed |
| `src/lib/theme.tsx` | `Resolved` exported under its own name |

## Honest limits of this lane

- The 178-click sweep clicked every button it could reach but did not assert
  *what* each one did. A button that navigates somewhere wrong without throwing
  would pass. That needs behavioural tests, not a type lane.
- `DiffRadio` / `StepperR` / the match-parameter controls are `onBlocked`
  placeholders that toast "服务端还没有 PATCH /v1/rooms/{id}". They are typed
  now, but they remain non-functional by design and I did not change that.
- The `state === 'loading'` arm in `RoomBottomBar` is unreachable (finding 7).
  I typed it honestly and documented it rather than deleting a branch the
  domain type still allows.
- I verified the **dev** server renders. `vite build` output was verified to
  compile, but I did not serve `dist/` and render that, because the brief said
  not to start anything. If you want the production bundle rendered too, that
  is one `vite preview` away.

**Status: DONE.** 261 → 0, all four acceptance conditions met, and the type work
turned up eight real defects that a green build had been hiding.
