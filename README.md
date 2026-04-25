# TH-Platform — Desktop Client

Third-party multiplayer / matchmaking platform for the Touhou Project shoot-em-up
games (TH06 EoSD, TH07 PCB, TH08 IN, TH09 PoFV; TH10–20 later).

This repo is the **desktop client only** — separate from the DLL injector and
the decomp work, which live in [`TH08-Platform`](https://github.com/dwgx/TH08-Platform).

## Status

`alpha` — UI scaffolding. No backend, no networking, no game integration yet.
Pure HTML/CSS mockup; will move to Vite + React 18 + TS + Tailwind v3 + shadcn
once the visual language is locked.

## Run

```
# any static server in this directory; e.g.:
python -m http.server 5173
```

Open <http://localhost:5173>.

Or just double-click `index.html`.

## Layout (current scaffold)

- `index.html` — Lobby mockup (3-column: rail / navigator / content)
- `styles.css` — single stylesheet, design tokens at the top

## Roadmap

| Stage | Deliverable | Status |
|---|---|---|
| 0 | HTML+CSS lobby mockup, dark theme, no Touhou-pink | done |
| 1 | Beautify pass — Claude Code + Chrome iterating on screenshots | next |
| 2 | Add Room / Channel / Profile&Settings pages as static HTML | |
| 3 | Migrate to Vite + React + TS + Tailwind + shadcn, keep tokens | |
| 4 | Wrap in Tauri 2 for native desktop shipping | |
| 5 | Wire to backend (separate repo) and DLL injector (TH08-Platform) | |

## Conventions

- No anime mascots. No cherry-blossom pink. No shrine red as the primary brand.
  Keep the Touhou identity in copy / functionality, not in chrome.
- Dark theme only for V1.
- CJK + Latin must look balanced; the `--font-sans` stack handles fallback.
