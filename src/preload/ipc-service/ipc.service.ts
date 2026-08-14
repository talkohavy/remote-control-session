import { ipcRenderer } from 'electron';

export class IpcService {
  /**
   * Request/response. Mirrors `ipcMain.handle` on the main side.
   *
   * @example const info = await ipc.invoke(ApiEvents.SystemGetInfo)
   */
  invoke<T = any>(channel: string, ...args: any): Promise<T> {
    return ipcRenderer.invoke(channel, ...args);
  }

  /**
   * Fire-and-forget. Mirrors `ipcMain.on` on the main side. No value comes back.
   *
   * @example ipc.send(ApiEvents.RemoteInput, { type: 'move', x: 0.5, y: 0.5 })
   */
  send(channel: string, ...args: any): void {
    ipcRenderer.send(channel, ...args);
  }

  /**
   * Subscribe to a main -> renderer push channel.
   *
   * Returns an `unsubscribe` function. ALWAYS call it when you're done (e.g. in a
   * React effect cleanup) - forgetting to is the classic Electron memory leak,
   * because `ipcRenderer` listeners live for the lifetime of the window.
   *
   * @example const off = ipc.subscribe(ApiEvents.MenuCommand, (cmd) => run(cmd)); // later: off()
   */
  subscribe(channel: string, listener: (payload: any) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, payload: any): void => listener(payload);

    ipcRenderer.on(channel, handler);

    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  }
}
