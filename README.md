# TH-Platform — Desktop Client

Third-party multiplayer / matchmaking platform for the Touhou Project shoot-em-up
games (TH06 EoSD, TH07 PCB, TH08 IN, TH09 PoFV; TH10–20 later).

This repo is the **desktop client only** — separate from the DLL injector and
the decomp work, which live in [TH08-Platform](https://github.com/dwgx/TH08-Platform).

## Status

`v0.1.0 alpha` — UI scaffolding. No backend, no networking, no game integration yet.
Mock data only.

## Stack

- **Vite 6** + **React 18** + **TypeScript 5.7**
- **Tailwind CSS v3** with shadcn-style design tokens (HSL-based, swappable)
- **Radix UI** primitives (Avatar, Tabs, Switch, Dialog, Tooltip, ScrollArea, etc.)
- **lucide-react** icons
- **class-variance-authority** + **tailwind-merge** for variant composition

Tauri 2 wrapper comes once the visual language is locked.

## Run

```sh
pnpm install      # or npm install / yarn install
pnpm dev          # http://127.0.0.1:5173
pnpm build        # tsc + vite build → dist/
pnpm typecheck    # type-check only
```

## Theme

Three modes via `<ThemeProvider>` (`@/lib/theme`):

- `light` — clean white-paper neutral
- `dark` — Claude Code-style deep neutral, **default**
- `system` — follows OS preference

Toggle is in the title bar (sun/moon icon) and in **Settings → Appearance**.

The `dark` class is set on `<html>` before paint via an inline script in
`index.html` to prevent FOUC.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ TitleBar (logo · tabs · theme · user pill · window controls) │
├────┬───────┬─────────────────────────────────────┬───────────┤
│    │       │                                     │           │
│Rail│ Nav   │            Content                  │ Chat rail │
│60px│ 248px │            (Lobby / Room / etc)     │ 320px     │
│    │       │                                     │ collapsibe│
├────┴───────┴─────────────────────────────────────┴───────────┤
│ StatusBar  (connection · DLL · build)                        │
└──────────────────────────────────────────────────────────────┘
```

## Pages

| Page     | File                  | Status |
|----------|-----------------------|--------|
| Lobby    | `src/pages/lobby.tsx`    | server card grid + featured + chat |
| Room     | `src/pages/room.tsx`     | seats + parameter tabs + ready/start |
| Settings | `src/pages/settings.tsx` | Appearance theme picker, more sections |
| Channels | placeholder             | v0.2 |
| Friends  | placeholder             | v0.2 |

## Roadmap

| Stage | Deliverable | Status |
|-------|-------------|--------|
| 0     | Pure HTML+CSS Discord-like mockup | done (in git history) |
| **1** | **Vite + React + TS + Tailwind + shadcn primitives, light/dark theme, Lobby/Room/Settings** | **here** |
| 2     | Custom wallpapers + theme palette presets (QQNT-style) | next |
| 3     | Routing (react-router or TanStack), more pages (Channels, Friends, Profile full) | |
| 4     | Wrap in Tauri 2 for native desktop shipping | |
| 5     | Wire to backend Go services + DLL injector (TH08-Platform) | |

## Conventions

- No anime mascots. No cherry blossom pink. No shrine red as the primary brand.
  Touhou identity stays in copy + functionality, not in chrome.
- Dark is canonical; light is a peer.
- All design tokens are HSL CSS vars in `src/index.css` so swapping palettes is
  one-file delta.
- CJK + Latin must look balanced; the `--font-sans` stack handles fallback.
- Components in `src/components/ui/` follow shadcn API (forwardRef, cva variants).
- Components in `src/components/app/` are app-specific composition; keep them
  thin and delegate to UI primitives.
