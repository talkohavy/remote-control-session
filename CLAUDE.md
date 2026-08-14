# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

Cross-platform screen sharing + remote desktop control over WebRTC. One binary is both ends
of a session: a **host** shares its screen, a **viewer** watches and (once granted) drives the
host's mouse and keyboard. See `README.md` for the user-facing story and platform matrix.

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml` / `.npmrc`).

- `pnpm dev` — run the app in development (electron-vite with HMR).
- `pnpm build` — typecheck (`tsc`) then build. Use `build:mac` / `build:win` / `build:linux` to produce distributables via electron-builder, `build:unpack` for an unpacked dir.
- `pnpm start` — preview a production build (`electron-vite preview`).
- `pnpm tsc` — typecheck both projects (`tsc:node` for main/preload, `tsc:web` for renderer). There is no single combined `tsconfig` for the whole app.
- `pnpm lint` — ESLint over the repo.
- `pnpm format:fix` — Biome formatter over `./src`. `pnpm format:prettier:fix` — Prettier over the whole repo.

There is **no test runner** configured in this project.

Note the split tooling: **Biome** formats `src/`, **Prettier** formats the rest of the repo, and **ESLint** lints. They coexist intentionally.

## Architecture

Standard Electron three-process split, plus a shared layer:

- `src/main` — Node/Electron main process (windows, native APIs, business logic & state).
- `src/preload` — the secure bridge; runs in an isolated context.
- `src/renderer` — React 19 UI (react-router, Tailwind v4).
- `src/common` — code shared across all three (types, constants, utils).

Each process has its own Vite config and path aliases (defined in `electron.vite.config.ts` and mirrored in the tsconfigs): `@root` → `src` (everywhere), plus `@main`, `@preload`, `@renderer` scoped to their process.

### Where the feature lives

The split follows what each process is actually allowed to do:

| Concern | Location | Why there |
|---|---|---|
| Screen capture | `src/main/modules/screen-capture` | `desktopCapturer` is main-only since Electron 17 |
| Input injection | `src/main/modules/remote-input` | native module is Node-only |
| WebRTC + signaling | `src/renderer/src/lib/peer` | the WebRTC stack lives in Chromium |

Consequence worth remembering: input arrives in the **renderer** over a data channel but must
be injected from **main**, so every event crosses IPC via `send` (fire-and-forget). That is
the hot path, running at pointer frequency — don't turn it into `invoke`.

### The IPC contract is the backbone

All IPC channel names are string constants centralized in `src/common/constants/api-events.ts` (`ApiEvents`). **Both** the main-process controllers and the preload API import from here — never hardcode a channel string. This is the single source of truth binding the two sides together.

Three IPC directions, wrapped on each side:

| Direction | Main side (`IpcBridgeService`) | Preload side (`IpcService`) |
|---|---|---|
| request/response | `handle(channel, fn)` | `invoke(channel, ...args)` |
| fire-and-forget (renderer→main) | `on(channel, fn)` | `send(channel, ...args)` |
| push (main→renderer) | `emit(window, ...)` / `broadcast(...)` | `subscribe(channel, listener)` → returns unsubscribe |

### Main process: module pattern

`src/main/index.ts` → `start-server.ts` boots the app, creates one `IpcBridgeService`, and calls each feature's `initXModule(bridge)` before creating the window.

Each feature under `src/main/modules/<feature>/` follows:
- `<feature>.module.ts` — an `initXModule(bridge)` factory that instantiates the service + controller and calls `controller.register()`.
- `services/<feature>.service.ts` — holds state and logic; **no IPC knowledge** (e.g. `RemoteInputService` owns the native binding, the consent gate and the pressed-key set).
- `controllers/<feature>.controller.ts` — the only place IPC is wired. Controllers expose a **single public `register()`** method; each channel is bound in a private method.

To add a main-process capability: add the channel to `ApiEvents`, add/extend a service, wire it in the controller, and register the module in `start-server.ts`.

Module init order matters here: `initScreenCaptureModule` installs the handler that answers
the renderer's `getDisplayMedia()` call, so it must run before the window exists.

### Preload: the curated `window.api`

`src/preload/index.ts` uses `contextBridge` to expose exactly two globals to the renderer: `window.electron` (toolkit helper) and `window.api` (the typed `Api` class). The raw `ipcRenderer` is never exposed.

**Two non-obvious constraints that shape all preload API code** (documented in `src/preload/api/api.ts`):
1. `contextBridge` clones only own enumerable properties and strips prototype methods — so every public API method must be an **arrow-function class field** (see `remote.api.ts`), not a normal method.
2. A normal private field would still be cloned onto `window.api`. The injected `IpcService` is therefore stored in a **hard-private `#ipc`** field so it stays truly internal.

Each feature gets a class in `src/preload/api/features/` composed into `Api`.

### Renderer

- `src/preload/index.d.ts` augments `Window` with `RendererApi = typeof api`, so the renderer is fully typed against the real preload implementation with zero duplication — add a method in the preload API and the renderer sees it immediately.
- `src/renderer/src/lib/ipc/ipc.client.ts` re-exports `window.api` as `ipcClient` so components call `ipcClient.capture.listSources()` instead of touching the global.
- Use the `useIpcIncomingEvent` hook for main→renderer subscriptions; it handles unsubscribe on unmount. Forgetting to unsubscribe from `ipcRenderer` is the classic Electron memory leak.
- Routing is config-driven via `src/renderer/src/routes.ts` (lazy-loaded page components), all mounted under the `BASE_URL` prefix.
- Session logic lives in plain classes (`HostSession`, `ViewerSession`) with callbacks, wrapped by a `logic/useXPageLogic.ts` hook per page. Components stay presentational.

## Invariants — don't break these

**Coordinates are normalised `0..1`, never pixels.** The viewer, the video element and the
host display all differ in size and DPI scale. Conversion to pixels happens only in
`RemoteInputService.moveTo`, against `libnut.getScreenSize()` — the same module that
receives them. Using Electron's `screen` module instead reintroduces the scale mismatch.

**Button events carry their own coordinates and move first.** Pointer movement travels on a
lossy channel, so the latest move may never arrive; without the built-in move, clicks land
wherever the cursor was left.

**Two data channels, different reliability.** `control` is reliable+ordered (keys, buttons,
wheel); `motion` is unreliable+unordered (movement only). Collapsing them into one is the
easiest way to make the session feel laggy.

**Anything pressed must be releasable.** `RemoteInputService` tracks pressed keys and
buttons and exposes `releaseAll()`, called on revoke, disconnect and quit. The viewer mirrors
this in `useInputCapture`. Skip it and a dropped session leaves a stuck modifier.

**The consent gate is enforced in main, not just the UI.** `RemoteInputService.inject`
returns early unless control was granted. The renderer checks too, but that check is an
optimisation, not the boundary.

## The native input module

Input injection uses `@nut-tree-fork/libnut-{darwin,linux,win32}` — prebuilt N-API binaries,
so they're ABI-stable across Node and Electron and need no `electron-rebuild`
(`npmRebuild: false`).

Three things about it are easy to get wrong:

1. **Don't use the `@nut-tree-fork/libnut` wrapper package.** Its `dist/lib/*` requires
   `@nut-tree-fork/shared`, which its own manifest lists only as a devDependency — it throws
   at runtime. `src/main/modules/remote-input/logic/libnut.ts` binds the platform package
   directly instead, and loading is lazy and non-fatal.
2. **The packages must stay `external`** in `electron.vite.config.ts`. Rollup cannot bundle a
   `.node` binary, and `bindings` locates it by walking up from its own call site.
3. **They must be `asarUnpack`ed** in `electron-builder.yml`, since that lookup is a real
   filesystem path.

All three platform binaries install on every OS (their `os` field lists all three), so
cross-platform packaging from a single machine works.

## Platform branches to keep in mind

- **Wayland** needs two special cases, both in the capture module: skip `getSources()` (the
  portal session it opens can't be reused, causing a double picker) and report input
  injection as unavailable (the native backend is X11/XTest).
- **macOS** gates both Screen Recording and Accessibility. There's no API to prompt for
  Screen Recording — it's raised by an actual capture attempt, which is why
  `PermissionsService.requestPermissions` calls `desktopCapturer.getSources`.
  `hardenedRuntime` must stay `false` or injection silently no-ops.
- **Windows** needs nothing, but injected input can't reach elevated windows unless the app
  is itself elevated.
