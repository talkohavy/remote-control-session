# Add IPC Feature

Use this skill when adding a new IPC-connected feature to this Electron app.
It covers all touch points in the correct order.

## IPC pattern reference

Three directions, each has a pair of primitives:

| Direction | Main side | Preload/renderer side | Use when |
|---|---|---|---|
| Renderer → Main (with response) | `bridge.handle(channel, fn)` | `ipc.invoke(channel, ...args)` | renderer needs a value back |
| Renderer → Main (fire-and-forget) | `bridge.on(channel, fn)` | `ipc.send(channel, ...args)` | renderer triggers action, no return needed |
| Main → Renderer (push) | `bridge.broadcast(channel, payload)` | `ipc.subscribe(channel, listener)` | main pushes updates to all windows |

`bridge.emit(window, channel, payload)` is the single-window variant of broadcast — use it when you have a specific `BrowserWindow` reference.

## Touch points (in order)

### 1. Channel names — `src/common/constants/api-events.ts`

Add every new channel as a const entry. Both sides import from here — never hardcode a string.

```ts
export const ApiEvents = {
  // ...existing...
  MyFeatureDoSomething: 'myFeature:doSomething',   // request/response
  MyFeatureChanged:     'myFeature:changed',        // push
} as const;
```

### 2. Types (if needed) — `src/main/modules/<feature>/types.ts` and/or `src/common/types/`

Put shared payload types in `src/common/types/` so both main and renderer can import them.
Put internal types (e.g. listener signatures) in the module's own `types.ts`.

### 3. Service — `src/main/modules/<feature>/services/<feature>.service.ts`

Holds state and logic. **No IPC knowledge here.** Emit changes via a listener set, not directly through the bridge.

```ts
export class MyFeatureService {
  private value = 0;
  private readonly listeners = new Set<(v: number) => void>();

  getValue(): number { return this.value; }

  setValue(v: number): void {
    this.value = v;
    for (const fn of this.listeners) fn(v);
  }

  onChange(fn: (v: number) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
```

### 4. Controller — `src/main/modules/<feature>/controllers/<feature>.controller.ts`

The **only** place IPC is wired. One public method: `register()`. All channel bindings are private methods called from it.

```ts
import { ApiEvents } from '@root/common/constants';
import type { IpcBridgeService } from '@main/core/ipc-bridge';
import type { MyFeatureService } from '../services/myfeature.service';

export class MyFeatureController {
  constructor(
    private readonly bridge: IpcBridgeService,
    private readonly service: MyFeatureService,
  ) {}

  register(): void {
    this.getValue();       // request/response
    this.watchChanges();   // push subscription wired at startup
    this.setValue();       // fire-and-forget
  }

  private getValue() {
    this.bridge.handle(ApiEvents.MyFeatureDoSomething, this.service.getValue.bind(this.service));
  }

  private watchChanges() {
    // Push changes to all renderer windows whenever service state changes.
    this.service.onChange((value) => this.bridge.broadcast(ApiEvents.MyFeatureChanged, value));
  }

  private setValue() {
    this.bridge.on(ApiEvents.MyFeatureDoSomething, (_event, v) => this.service.setValue(v));
  }
}
```

### 5. Module factory — `src/main/modules/<feature>/index.ts` (and `<feature>.module.ts`)

```ts
// <feature>.module.ts
import { MyFeatureController } from './controllers/myfeature.controller';
import { MyFeatureService } from './services/myfeature.service';
import type { IpcBridgeService } from '../../core/ipc-bridge';

export function initMyFeatureModule(bridge: IpcBridgeService) {
  const service = new MyFeatureService();
  const controller = new MyFeatureController(bridge, service);
  controller.register();
}

// index.ts — re-export
export { initMyFeatureModule } from './myfeature.module';
```

If the service needs a callback injected at construction time (like `ClockService` receives `onTick`), pass it from the module factory:

```ts
export function initMyFeatureModule(bridge: IpcBridgeService) {
  const broadcast = (payload: SomeType) => bridge.broadcast(ApiEvents.MyFeatureChanged, payload);
  const service = new MyFeatureService(broadcast);
  ...
}
```

### 6. Register the module — `src/main/start-server.ts`

```ts
import { initMyFeatureModule } from './modules/myfeature';

// inside handleAppIsReady(), after IpcBridgeService is created:
initMyFeatureModule(ipcBridgeService);
```

### 7. Preload API — `src/preload/api/features/<feature>.api.ts`

Two hard constraints enforced here (see `api.ts` comments):
- All public methods **must be arrow-function class fields** — `contextBridge` strips prototype methods.
- Inject `IpcService` into a **`#ipc` hard-private field** — regular private fields are own-enumerable and would leak onto `window.api`.

```ts
import { ApiEvents } from '@root/common/constants';
import type { IpcService } from '@preload/ipc-service';

export class MyFeatureApi {
  #ipc: IpcService;

  constructor(ipc: IpcService) {
    this.#ipc = ipc;
  }

  // request/response
  getValue = (): Promise<number> => this.#ipc.invoke<number>(ApiEvents.MyFeatureDoSomething);

  // fire-and-forget
  setValue = (v: number): void => this.#ipc.send(ApiEvents.MyFeatureDoSomething, v);

  // subscribe to push events — returns unsubscribe fn
  onChanged = (listener: (value: number) => void): (() => void) =>
    this.#ipc.subscribe(ApiEvents.MyFeatureChanged, listener);
}
```

### 8. Compose into Api — `src/preload/api/api.ts`

```ts
import { MyFeatureApi } from './features/myfeature.api';

export class Api {
  // ...existing fields...
  readonly myFeature: MyFeatureApi;

  constructor(ipc: IpcService) {
    // ...existing...
    this.myFeature = new MyFeatureApi(ipc);
  }
}
```

The renderer's `Window` augmentation in `src/preload/index.d.ts` is driven by `typeof api`, so no changes needed there — the new field appears automatically.

### 9. Renderer usage

Import via `ipcClient` (never touch `window.api` directly):

```ts
import { ipcClient } from '@renderer/lib/ipc';
import { useIpcIncomingEvent } from '@renderer/hooks/useIpcIncomingEvent';

// request/response
const value = await ipcClient.myFeature.getValue();

// fire-and-forget
ipcClient.myFeature.setValue(42);

// push subscription (handles unsubscribe on unmount automatically)
useIpcIncomingEvent(ipcClient.myFeature.onChanged, (value) => {
  setState(value);
});
```

Use `useIpcIncomingEvent` for **all** main→renderer subscriptions — it wires the unsubscribe into the effect cleanup, preventing the classic Electron memory leak of forgotten `ipcRenderer` listeners.

## Checklist

- [ ] Channel name(s) added to `ApiEvents`
- [ ] Shared types in `src/common/types/` if the payload crosses the boundary
- [ ] Service: pure logic, no IPC imports
- [ ] Controller: only `register()` is public; each channel is a private method
- [ ] Module factory wires service + controller, exports `initXModule`
- [ ] `start-server.ts` calls `initXModule(ipcBridgeService)`
- [ ] Preload API: arrow-function fields, `#ipc` hard-private
- [ ] `Api` class composes the new feature class
- [ ] Renderer uses `ipcClient.<feature>.*` and `useIpcIncomingEvent` for push events
