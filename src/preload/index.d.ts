import type { ElectronAPI } from '@electron-toolkit/preload';
import type { RendererApi } from './api';

/**
 * Augments the renderer's global `window` with the objects the preload exposes.
 * `RendererApi` is `typeof api`, so this stays perfectly in sync with the real
 * implementation - add a feature in `api.ts` and the renderer sees it here.
 */
declare global {
  interface Window {
    electron: ElectronAPI;
    api: RendererApi;
  }
}
