/**
 * A tiny re-export of the preload-exposed API so components can write
 * `import { ipcClient } from '@renderer/lib/ipc'` and call `ipcClient.capture.listSources()`
 * instead of reaching for the global `window.api` everywhere.
 *
 * The type comes from `preload/api.ts` (via the `Window` augmentation in
 * `preload/index.d.ts`), so this is fully typed with zero duplication.
 */
export const ipcClient = window.api;
