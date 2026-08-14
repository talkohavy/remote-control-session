import { electronAPI } from '@electron-toolkit/preload';
import { WorldKeys } from '@root/common/constants';
import { contextBridge } from 'electron';
import { api } from './api';

startPreload();

function startPreload() {
  /**
   * Preload entry point. Runs in an isolated context that bridges the sandboxed
   * renderer and the Node-powered main process.
   *
   * With context isolation ON (the secure default) we hand the renderer only the
   * curated, typed `api` object plus the toolkit's `electron` helper - never the
   * raw `ipcRenderer`. That keeps the attack surface tiny while the renderer
   * still gets full autocomplete via `window.api`.
   */
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld(WorldKeys.Electron, electronAPI);
      contextBridge.exposeInMainWorld(WorldKeys.Api, api);
    } catch (error) {
      console.error(error);
    }
  } else {
    // Fallback for when context isolation is disabled (not recommended).
    // @ts-ignore - defined in index.d.ts
    window.electron = electronAPI;
    // @ts-ignore - defined in index.d.ts
    window.api = api;
  }
}
