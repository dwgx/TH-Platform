# TH-Platform

**Touhou Project multiplayer matchmaking desktop client / 东方Project联机对战桌面客户端**

---

## Overview / 概述

TH-Platform is a third-party desktop client providing lobby, matchmaking, and room management for Touhou Project STG games (TH06, TH07, TH08, TH09, with more planned). Built with Vite + React + TypeScript on the front end, wrapped in a Tauri 2 native shell, with a Windows-only Rust game loader that launches target game executables and injects a companion DLL for multiplayer hooks.

This repo is the desktop client only. The DLL injector / decomp work lives in the companion repo `TH08-Platform`.

---

TH-Platform 是一个第三方桌面客户端，为东方Project STG系列游戏（TH06、TH07、TH08、TH09，后续更多）提供大厅、匹配和房间管理功能。前端用 Vite + React + TypeScript 构建，外面套了一层 Tauri 2 原生壳，配合一个 Windows 专用的 Rust 游戏加载器——启动目标游戏进程并注入配套 DLL 实现联机 hook。

本仓库只是桌面客户端。DLL 注入器/逆向工程在伴生仓库 `TH08-Platform` 中。

## Features / 功能

- **Lobby, Room, Group, DM/Friends, Profile, Settings screens** — full page set rendered from `src/pages/`
- **Light / dark / system theming** — `ThemeProvider` with dark as default, pre-paint script in `index.html` to prevent flash
- **Hash-based router** — dependency-free, supports browser back/forward, shareable URLs, plus an on-screen dev page switcher
- **Mock API layer** — single typed contract (`types.ts`) shared between mock and client facade; swap to real backend without changing call sites
- **Tauri 2 native shell** — custom decorationless 1440x900 window, Windows target
- **Windows game loader** — `launch_game` / `terminate_game` Tauri commands: spawn process suspended, inject DLL via `CreateRemoteThread` + `LoadLibraryA`, resume; multiplayer config passed through environment variables

---

- **大厅、房间、群组、私信/好友、个人资料、设置页面** — 完整页面集，位于 `src/pages/`
- **亮色/暗色/跟随系统主题** — `ThemeProvider`，默认暗色，`index.html` 里有预渲染脚本防止闪屏
- **Hash 路由** — 零依赖，支持浏览器前进后退、可分享 URL，附带开发用页面切换器
- **Mock API 层** — 统一类型契约（`types.ts`）在 mock 和客户端门面间共享，后续接真实后端不用改调用点
- **Tauri 2 原生壳** — 自定义无边框 1440x900 窗口，Windows 目标
- **Windows 游戏加载器** — `launch_game` / `terminate_game` Tauri 命令：挂起启动进程，通过 `CreateRemoteThread` + `LoadLibraryA` 注入 DLL，恢复执行；联机配置通过环境变量传递

## Tech Stack / 技术栈

**Front end:**
- Vite 6, React 18, TypeScript 5.7
- Tailwind CSS 3 (HSL design tokens)
- Radix UI primitives (Avatar, Dialog, Dropdown Menu, ScrollArea, Separator, Slot, Switch, Tabs, Tooltip)
- lucide-react icons
- class-variance-authority, clsx, tailwind-merge

**Native shell:**
- Tauri 2 (`@tauri-apps/cli` 2.x)
- Rust (edition 2021, rust-version 1.77.2)
- serde, windows crate (Win32 process/memory/threading APIs)

**Package manager:** pnpm (lockfile committed)

## Project Structure / 项目结构

```
.
├── index.html              # Vite entry + pre-paint theme script
├── package.json
├── vite.config.ts          # React plugin, "@" -> ./src alias, dev on 127.0.0.1:5173
├── tailwind.config.ts
├── src/
│   ├── main.tsx            # React root + ThemeProvider
│   ├── App.tsx             # route-to-page switch, toasts, dev switcher
│   ├── router/index.tsx    # hash router
│   ├── pages/              # lobby, room, group, dm, profile, settings
│   ├── components/design/  # shared UI primitives
│   ├── hooks/              # e.g. use-async
│   ├── lib/
│   │   ├── api/            # client.ts, mock.ts, types.ts
│   │   ├── tauri/loader.ts # TS wrapper for Rust Tauri commands
│   │   └── theme.tsx       # ThemeProvider / useTheme
│   └── styles/design.css
├── public/favicon.svg
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json     # window config, bundle (msi/nsis), dev/build commands
    ├── capabilities/default.json
    ├── icons/
    └── src/
        ├── main.rs         # registers launch_game / terminate_game
        └── loader.rs       # Windows process spawn + DLL injection
```

<!-- TODO: .tmp-design-bundle/ directory contains design-iteration .jsx mockups; appears to be scratch/design material, not part of the build. -->

## Getting Started / 快速开始

### Prerequisites / 前提条件

- **Node.js** + **pnpm**
  <!-- TODO: confirm required Node version -->
- For native shell: **Rust toolchain** (>= 1.77.2), Windows **Microsoft C++ Build Tools** (Tauri 2 requirement)

### Install / 安装

```sh
pnpm install
```

### Dev (web only) / 开发（纯前端）

```sh
pnpm dev          # Vite dev server @ http://127.0.0.1:5173
```

### Build (web) / 构建（前端）

```sh
pnpm build        # tsc -b && vite build -> dist/
pnpm preview      # preview production build
pnpm typecheck    # tsc --noEmit
```

### Native desktop (Tauri) / 原生桌面 (Tauri)

```sh
pnpm tauri:dev    # launches Vite + loads in native window
pnpm tauri:build  # builds web app + produces Windows installers (msi/nsis)
```

<!-- TODO: tauri.conf.json 里的 beforeDevCommand/beforeBuildCommand 写的是 npm run，如果全用 pnpm 可能需要对齐 -->

## Usage / 使用方法

Routes are hash-based:
- `#/lobby/th08` — game lobby
- `#/room/4912` — room
- `#/dm/friends` — friends/DM
- `#/profile` — profile
- `#/settings/appear` — appearance settings

A floating **dev switcher** (bottom-right) lets you jump between pages and toggle theme during development.

Theme is controlled via title bar and Settings -> Appearance, persisted in `localStorage` key `th-platform-theme`.

### Native game launch (Windows only) / 原生游戏启动（仅 Windows）

`launchGame` wrapper in `src/lib/tauri/loader.ts` calls the Rust `launch_game` command with:

- `targetPath` — absolute path to game executable / 游戏可执行文件绝对路径
- `dllPath` — absolute path to DLL to inject / 待注入 DLL 绝对路径
- `hostMode`, `listenPort`, `peerAddr`, `disableMultiplayer` — multiplayer config / 联机配置

Only works inside Tauri shell (`pnpm tauri:dev` / packaged build). Under plain `pnpm dev`, throws because `window.__TAURI__` is absent.

## Configuration / 配置

The Rust loader sets these environment variables for the child game process:

| Variable | Description |
|----------|-------------|
| `TH08_PLATFORM_PEER` | Peer address (`ip:port`) for peer mode / 对端地址 |
| `TH08_PLATFORM_HOST` | Set when this peer hosts the lobby / 标记本端为房主 |
| `TH08_PLATFORM_LISTEN` | Listen port (default: `7480` host, `7481` peer) / 监听端口 |
| `TH08_PLATFORM_DISABLE_MULTIPLAYER` | Toggles DLL multiplayer behavior / 切换联机行为开关 |

Front-end mock API has a `FAKE_DELAY_MS` constant in `src/lib/api/client.ts` to simulate latency.

## Status / 状态

`v0.1.0` — WIP. UI scaffolding with mock data, no live backend yet. Tauri 2 shell and Rust loader are scaffolded, Windows-only.

Direction: theme/palette presets, more pages (Channels, Friends, full Profile), completing Tauri native packaging, wiring mock API to real backend and the DLL injector.

---

`v0.1.0` — 开发中。UI 脚手架 + mock 数据，暂无实际后端。Tauri 2 壳和 Rust 加载器已搭好，仅限 Windows。

方向：主题/调色板预设、更多页面（频道、好友、完整个人资料）、完善 Tauri 原生打包、把 mock API 接到真实后端和 DLL 注入器上。

<!-- TODO: confirm current roadmap -->

## License / 许可证

No license specified. All rights reserved by the author unless a license is added.

<!-- TODO: confirm intended license -->
