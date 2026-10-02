# THP-CLEANUP-20261002 — dead Tailwind config, duplicated base URL

Worker: `DeadConfigCleanup`. cwd `D:/Project/TH-Platform`, 2026-10-01.

Two changes, both deletion:

1. `tailwind.config.ts` + `postcss.config.js` were configured and never applied.
   Deleted, plus their `devDependencies`.
2. `backend-status.tsx` re-derived the API base URL that `client.ts` owns.
   Now imports it.

---

## 1. Files deleted

| Path | Lines | Why |
|---|---|---|
| `D:/Project/TH-Platform/tailwind.config.ts` | 62 | Tailwind token set read by nobody |
| `D:/Project/TH-Platform/postcss.config.js` | 6 | loads `tailwindcss` + `autoprefixer` |

Evidence that Tailwind was never applied — the brief's measurement, reproduced
across the whole repo (`grep -rn "@tailwind\|@apply" .`):

```
# docs/reports/
## THP-UIAUDIT-20261001.md#ADB1
 87:`App.tsx` styled the shell with `className="relative h-full w-full"`. Those are Tailwind
*88:utilities and **no stylesheet in this project contains `@tailwind`** — `postcss.config.js` and
```

That is the only hit in the repo, and it is a **prose hit inside a report** — not a
directive. No stylesheet, no `.ts`, no `.tsx` contains `@tailwind` or `@apply`.

The token systems really were disjoint, as the brief states. From
`tailwind.config.ts` (deleted): `--bg-rail`, `--bg-sidebar`, `--bg-content`,
`--bg-floating`, `--brand`, `--fg-normal`, `--fg-header`, `--fg-link`,
`--separator`, `--font-sans`, `--radius`. From
`src/styles/design.css` (kept): `--bg-0`, `--bg-1`, `--fg-0`, `--fg-1`,
`--accent`, `--accent-soft`, `--border`, `--radius`. One shared name
(`--radius`, and it is not even the same value shape).

### `package.json` diff

```diff
   "devDependencies": {
     "@tauri-apps/cli": "^2.10.1",
     "@types/node": "^22.10.2",
     "@types/react": "^18.3.18",
     "@types/react-dom": "^18.3.5",
     "@vitejs/plugin-react": "^4.3.4",
-    "autoprefixer": "^10.4.20",
     "postcss": "^8.5.16",
-    "tailwindcss": "^3.4.17",
     "typescript": "^5.7.2",
     "vite": "^6.0.5"
   }
```

Resulting block, read back from disk after the edit:

```json
  "devDependencies": {
    "@tauri-apps/cli": "^2.10.1",
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "postcss": "^8.5.16",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
```

`postcss` stays: it is a direct peer of Vite's CSS pipeline and removing it was
not in this task. No dependency was added. `pnpm install` was not run.

### The build did not break — it lost nothing

Deleting `postcss.config.js` means Vite no longer runs a PostCSS plugin chain
(no autoprefixing). That changes zero bytes of behavior here: `design.css` and
`index.css` use no vendor-prefixed property, and the emitted CSS is still
produced and still carries the tokens. Measured on the built artifact:

```
$ pwsh -NoProfile -Command ' ... count occurrences in dist/assets/index-Do0Ctj8I.css ... '
--bg-0 => 3
--fg-0 => 6
--accent => 8
--bg-rail => 0
--brand => 0
pulse-soft => 0
```

`--bg-rail`, `--brand` and `pulse-soft` are the dead token/keyframe names from
`tailwind.config.ts`. They are 0 in the built CSS — they were 0 before the
deletion too, because nothing ever compiled Tailwind. **They were dead config,
not live styling.** Nothing was restored.

---

## 2. Inert Tailwind class names left in place

The brief estimated "~7000 lines of inert class names". That is no longer
true, and the next person should know it: the UI-audit lane already converted
the app off Tailwind class names onto inline `style={{}}` plus real semantic
classes in `design.css`. Measured, not guessed:

**1 distinct inert class name, 1 occurrence.**

The single one:

```
src/components/design/shared.tsx:26
  <div className="relative" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
```

`relative` is a Tailwind utility, and no stylesheet in `src/` defines it. It is
also a **no-op by construction** — the same element sets `position: 'relative'`
inline on the next attribute. Removing it would be a zero-pixel edit, so it was
left alone: this task is deletion of the configuration, and a sibling lane owns
the shell/primitives.

Everything else that looks like an inert name is not:

- `theme-${t}` (7 sites: `App.tsx` + all six pages) resolves to `theme-dark` /
  `theme-light`, both defined at `design.css:24` and `design.css:54`. Live.
- `className={cls}` in `shared.tsx:133` resolves to `row-hoverable` /
  `anim-row-in`, both defined at `design.css:183` / `design.css:173`. Live.
- `btn-pressable`, `cjk`, `mono`, `num`, `spinner`, `skeleton`, `t-body`,
  `t-caption`, `h-display-sm`, `h-display-md`, `uppercase-tag`, `t-tag`,
  `tab-indicator`, `anim-*` — all defined in `design.css`. Live.

Method (throwaway script, run then deleted — it is not in the repo): collect
every whitespace-separated token in every `className` value across
`src/**/*.{ts,tsx}`, strip JS comments first, resolve template literals to their
static words plus the string literals inside each `${…}`, then subtract the
42 class selectors defined in `src/index.css` + `src/styles/design.css`.
A first pass without the comment strip and the template resolve reported 7 names
and was wrong — it was matching the `className="relative h-full w-full"` quoted
inside the `App.tsx` comment that documents the old bug, plus `'anim-cta-glow'`
with the quotes still attached. Corrected numbers are the two above.

**Debt: 1 name. Not worth a lane.**

---

## 3. `backend-status.tsx` now imports the base URL

Before — the component re-implemented the resolution:

```tsx
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');
```

After — `src/lib/api/client.ts`, added export only, no existing line touched:

```ts
/**
 * Public view of the resolved configuration. `backend-status.tsx` probes this
 * same origin, so it imports it from here rather than re-deriving the default.
 */
export { BASE_URL as API_BASE_URL };
```

and `src/components/backend-status.tsx:19`:

```tsx
import { API_BASE_URL } from '@/lib/api/client';
```

The re-implementation is deleted. The component's header comment said the
duplication "should collapse to an import the moment client.ts exports
`API_BASE_URL`" — that sentence was rewritten to state the current truth.

`USE_MOCK` was **not** exported: `backend-status.tsx` does not need it (the
banner always probes the real origin, which was its behavior before too), and
an unused export is debt of the same kind this task is removing.

`client.ts` has one other caller-side concern: nothing else in `src/` imported
these constants, so the export is purely additive. The internal `BASE_URL` name
and its single use at `client.ts:73` were left exactly as they were, so a
concurrent reader of that file sees no change at all.

---

## Acceptance — verbatim

All three commands run from `D:/Project/TH-Platform`.

```
$ node node_modules/typescript/bin/tsc -b; echo "TSC_EXIT=$?"
TSC_EXIT=0
```

```
$ node node_modules/vite/bin/vite.js build; echo "VITE_EXIT=$?"
vite v6.4.2 building for production...
transforming...
✓ 1594 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.22 kB │ gzip:   0.63 kB
dist/assets/index-Do0Ctj8I.css      8.43 kB │ gzip:   2.49 kB
dist/assets/index-EqmtMHok.js   1,058.22 kB │ gzip: 212.03 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 2.56s
VITE_EXIT=0
```

```
$ pwsh -NoProfile -Command "Test-Path -LiteralPath 'D:/Project/TH-Platform/tailwind.config.ts'; Test-Path -LiteralPath 'D:/Project/TH-Platform/postcss.config.js'; ..."
False
False
D:\Project\TH-Platform\dist\assets\index-Do0Ctj8I.css
```

```
$ pwsh -NoProfile -File "$TEMP/thp/e2e_check.ps1" 2>&1; echo "E2E_EXIT=$?"
building api ...
starting api on 8080 ...
api healthy
starting vite preview on 4173 ...
web up

rendering each page headlessly ...
  lobby        131306 bytes  rendered
  room         147637 bytes  rendered
  group        145733 bytes  rendered
  dm            77387 bytes  rendered
  profile       65314 bytes  rendered
  settings      58262 bytes  rendered

E2E OK: all 6 pages rendered with a live backend
shots: C:\Users\dwgx1\AppData\Local\Temp\thp\shots-e2e
E2E_EXIT=0
```

All six pages render at 58–148 KB with a live Go backend. Deleting the config
changed no pixel.

No window was opened: the e2e script starts the API and `vite preview` with
`WindowStyle = 'Hidden'` and Chrome with `--headless=new`, and kills every child
in its `finally`. Nothing is left listening.

---

## Findings for the parent — nothing here was in scope to fix

1. **`pnpm-lock.yaml` is now out of sync with `package.json`.** It still pins
   `tailwindcss@3.4.19` and `autoprefixer@10.5.0` as devDependencies. I could
   not regenerate it: the brief forbids `pnpm install` and `pnpm` fails on this
   box anyway. Until someone runs an install on a working box, the lockfile and
   the manifest disagree. Any CI that does `pnpm install --frozen-lockfile` will
   fail on this.
2. **`README.md:60` still lists `tailwind.config.ts`** in the project tree. The
   file is gone, so the README now describes a layout that does not exist.
   `README.md` was not in this lane's scope.
3. **Three more Tailwind-adjacent dependencies are unused.**
   `clsx@^2.1.1`, `tailwind-merge@^2.5.5` and `class-variance-authority@^0.7.1`
   are in `dependencies`; `grep -rn "clsx|tailwind-merge|cva|class-variance-authority" src/`
   returns **no matches**. There is no `cn()` helper anywhere in `src/` — classes
   are literal strings and template literals. `tailwind-merge` in particular has
   no reason to exist now that Tailwind is gone. I left all three: the brief
   scoped this task to `tailwindcss` + `autoprefixer`, and removing runtime
   dependencies is not this task's call. Flagging them as the obvious follow-up.