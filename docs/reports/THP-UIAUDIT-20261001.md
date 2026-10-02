# THP-Platform — UI audit (client lane)

Lane: `src/pages`, `src/components`, `src/styles`, `src/App.tsx`, `src/router`.
Harness: `%TEMP%\thp\uiaudit.ps1` (real Go API on 8080, real `vite preview` on 4173, headless
Chrome driven over CDP). Gate: `%TEMP%\thp\e2e_check.ps1`.

Screenshots:

| set | meaning |
|---|---|
| `%TEMP%\thp\shots-before\` | before fixes, API reachable, real data |
| `%TEMP%\thp\shots-offline-before\` | before fixes, browser cannot reach the API |
| `%TEMP%\thp\shots-after\` | after fixes, 1440x900 |
| `%TEMP%\thp\shots-narrow-after\` | after fixes, 1024x768 |
| `%TEMP%\thp\shots-offline-after\` | after fixes, API unreachable |

---

## Result

```
pwsh -NoProfile -File $env:TEMP\thp\e2e_check.ps1
  lobby        131763 bytes  rendered
  room         147637 bytes  rendered
  group        145734 bytes  rendered
  dm            76180 bytes  rendered
  profile       65314 bytes  rendered   <- was 19437 (blank)
  settings      58262 bytes  rendered
E2E OK: all 6 pages rendered with a live backend
exit 0

node node_modules/typescript/bin/tsc -b          -> exit 0, no output
node node_modules/vite/bin/vite.js build         -> built in 1.54s
```

No dependency added, no route or type touched.

---

## D1 — profile page rendered a blank window (fixed)

**Cause.** `ProfileFull` did `if (!me) return null`. `getMe()` is one of the four routes that
*rejects* rather than degrading to `[]`, so any failure — server down, or server up and blocked
— left `me` undefined and the page rendered nothing at all: no rail, no sidebar, no way out.

**Evidence of the cause, measured not assumed:**
```
probe GET /v1/me with Origin -> 200  ACAO: <none>
Access to fetch at 'http://127.0.0.1:8080/v1/me' from origin 'http://127.0.0.1:4173'
  has been blocked by CORS policy: ... No 'Access-Control-Allow-Origin' header is present
[api] GET .../v1/me failed: TypeError: Failed to fetch
```
The API answered `200` with a valid body; the browser discarded it.

**Fix.** No early return. `ProfileFull` always renders its rail, sidebar and navigation rows,
and branches only the content area: loading, unreachable-with-retry, or profile. Same for
`ProfilePopover`, which previously returned `null` inside a full-screen click-to-dismiss
backdrop.

- before: `shots-offline-before/profile.png` (19446 bytes, 74 chars of text — only the dev
  switcher drew) · `shots-e2e/profile.png`
- after: `shots-offline-after/profile.png` (65374 bytes) · `shots-after/profile.png`

This is the fix worth keeping regardless of CORS: with the transport healthy the page was fine,
and with the transport broken the page was *unusable*. The defect is that a transport failure
had no surface.

## D2 — dev switcher and theme buttons shipped in the product (fixed)

`DevSwitcher` rendered unconditionally, visible bottom-right on all six pages, floating over the
lobby chat composer and duplicating the theme control Settings already ships.

- fix: `{import.meta.env.DEV && <DevSwitcher ... />}` — dropped from the production bundle.

Verified in the built asset, not by eye:
```
dist/assets/index-*.js
"Room · POST"      : ABSENT (dev switcher in bundle)
"Profile · Popover": ABSENT (dev switcher in bundle)
```

- before: every screenshot in `shots-before/`, bottom-right
- after: absent in all of `shots-after/`

## D3 — pages never filled the window; Tailwind is configured but never applied (fixed)

`App.tsx` styled the shell with `className="relative h-full w-full"`. Those are Tailwind
utilities and **no stylesheet in this project contains `@tailwind`** — `postcss.config.js` and
`tailwind.config.ts` exist, but nothing imports Tailwind, so the class names were inert:

```
dist/assets/index-*.css
h-full: ABSENT   w-full: ABSENT   .relative: ABSENT
--accent: PRESENT   anim-page-in: PRESENT   row-hoverable: PRESENT   .thp: PRESENT
```

`#root` was 100% tall, but its child had no styles and collapsed to content height.

Measured painted height vs window (before → after):

| page | before | after |
|---|---|---|
| lobby | 864 / 900 | 900 / 900 |
| room | 917 / 900 | 900 / 900 |
| group | 750 / 900 | 900 / 900 |
| dm | 571 / 900 | 900 / 900 |
| profile | 504 / 900 | 900 / 900 |
| settings | 711 / 900 | 900 / 900 |

- before: `shots-before/dm.png`, `shots-before/profile.png`
- after: all of `shots-after/`

## D4 — no empty state anywhere; a failed list rendered as silence (fixed)

Every list was `items.map(...)` with no zero-case sibling. `client.ts` resolves a failed
collection to `[]` and never throws, so "no rooms" and "cannot ask" were indistinguishable.

Fixed, reusing the existing `UI.EmptyState` rather than inventing a second component:
lobby room list, lobby friends, lobby chat, profile ranks / recent / badges / groups, DM friend
tabs (all four), DM sidebar recents.

The lobby chat also had a line — "现在还没人在玩永夜抄" — rendered unconditionally, so it
appeared *below live messages*. It is now the empty state and only shows when there is nothing.

- before: `shots-offline-before/dm.png` (`在线 — 0`, then nothing)
- after: `shots-offline-after/profile.png` (all four sections state their empty case)

## D5 — control alignment, spacing, truncation (fixed)

- **`ServerCardFlat` hardcoded `width: 320/380`** while being embedded in a 320px chat column
  with 14px padding and a 308px group aside. The join button was clipped past the window edge.
  Measured overflow at 1440px: elements reaching `right=1492` and `right=1479` against a 1440px
  viewport. Now fluid with `maxWidth: 100%`.
- **Seat card `height: 196`** let a long name push the role-chip row out of the card. Now
  `minHeight`.
- **`RoleChipR`** broke its two-glyph CJK labels mid-word (`正 / 常`) as soon as the card
  narrowed. Now `white-space: nowrap` + `flex-shrink: 0`; the READY/WAITING badge no longer
  squeezes either.
- Seat grid `repeat(2, 1fr)` → `auto-fit, minmax(210px, 1fr)`.
- Truncation added where text was previously allowed to overflow: seat name/handle, profile
  recent-game mode, profile group name, DM sidebar names, lobby friend names.

- before: `shots-e2e/room.png` (seat #4 chip wrapped), `shots-offline-before/lobby.png` (join
  button cut off)
- after: `shots-narrow-after/lobby.png` (card fits, button complete), `shots-narrow-after/room.png`

## D6 — narrow viewport (fixed)

The shell is 72 (rail) + 240/256 (sidebar) + 308/320 (drawer) of fixed chrome. At 1024px that
left the main column near nothing, and on the room page the parameter panel's
`min-width: 320px` crushed the seat column so far that the panel **painted over the seat cards**
and `席位` wrapped one glyph per line.

Added real rules in `design.css` (`.thp-col-nav`, `.thp-col-aside`, `.thp-col-main`,
`.thp-seat-grid`, `.thp-split`, `.thp-room-*`): the drawer drops first below 1180px, the nav
below 900/720px, splits stack below 1080px, and the room stacks below 1320px.

- before (1440 reference for the overlap): `shots-before/room.png`
- after: `shots-narrow-after/room.png`, `shots-narrow-after/lobby.png` — both 1024x768, no
  overflow reported by the driver's per-element bounds check

---

## Not mine — reported, not touched

1. **CORS (now resolved).** The Go server sent no `Access-Control-Allow-Origin`, so the browser
   discarded every API response. `server/internal/api/cors.go` landed in the server lane during
   this audit and the final run shows `ACAO: http://127.0.0.1:4173`; the client now reaches the
   API with no relay. My harness's `-RelayApi` switch is a throwaway diagnostic and no product
   file depends on it.

2. **`room.tsx` and `group.tsx` make zero API calls.** The harness records `api=0` for both
   across every run; `SEATS`, `SPECTATORS`, `ROOM_CHAT`, `GROUP`, `CATS`, `GROUP_MSGS` are
   module-level constants. Both pages therefore show fabricated data and can never render a
   server-driven state. This is data wiring, not UI, so I did not rewrite it — but it means the
   e2e gate's "rendered" verdict on these two pages says nothing about their correctness.

3. **Dead Tailwind config.** `tailwind.config.ts` + `postcss.config.js` ship a full token
   system (`hsl(var(--bg-rail))`, `--brand`, `--separator`, …) that shares no variable name
   with `design.css` (`--bg-0`, `--accent`, `--fg-0`). It is a second design convention that
   nothing reads. I fixed the symptom (D3) with real CSS rather than switching the whole app
   onto a token system the design does not use. Deleting it, or wiring it, is a call for Main.

4. **`client.ts` does not export its base URL.** `src/components/backend-status.tsx` duplicates
   the two-line resolution so a page can tell "empty" from "unreachable". If `client.ts`
   exports `API_BASE_URL`, that import replaces the copy and the duplication disappears.

---

## Harness notes

Two false results were caught and killed rather than reported:

- The first "offline" run showed a fully populated lobby. Chrome had cached the CORS preflight
  and responses from the previous relayed run in a reused profile. The harness now uses a fresh
  profile directory per run and removes it afterwards.
- The relay forwarded the client's `OPTIONS` preflight to Go, which does not implement it, and
  Chrome rejected the preflight on status alone. The relay answers preflight itself.

The driver records rendered-text length and per-element bounds alongside the PNG, because a
1440x900 PNG of a dark page is already ~19 KB when nothing drew — file size alone cannot tell
"painted its chrome" from "painted the page", and that distinction is exactly what this audit
turned on.