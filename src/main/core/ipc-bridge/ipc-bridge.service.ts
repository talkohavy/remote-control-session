import { ipcMain, BrowserWindow, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';

export class IpcBridgeService {
  handle(channel: string, handler: (event: IpcMainInvokeEvent, ...args: any) => any | Promise<any>): void {
    ipcMain.handle(channel, (event, ...args) => handler(event, ...(args as any)));
  }

  on(channel: string, listener: (event: IpcMainEvent, ...args: any) => void): void {
    ipcMain.on(channel, (event, ...args) => listener(event, ...(args as any)));
  }

  emit(window: BrowserWindow, channel: string, payload: any): void {
    window.webContents.send(channel, payload);
  }

  broadcast(channel: string, payload: any): void {
    const windows = BrowserWindow.getAllWindows();

    for (const window of windows) {
      window.webContents.send(channel, payload);
    }
  }
}
