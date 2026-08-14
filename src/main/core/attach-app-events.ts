import { BrowserWindow, globalShortcut } from 'electron';
import { ElectronEvents } from '../../common/constants';
import { createWindow } from './create-window';

export function attachAppEvents(app: Electron.App): void {
  app.on(ElectronEvents.BrowserWindowCreated, (_, window) => {
    window.webContents.on('before-input-event', (event, input) => {
      if (input.code === 'Escape') {
        window.close();
        event.preventDefault();
      }
    });
  });

  // On macOS, re-create a window when the dock icon is clicked with none open.
  app.on(ElectronEvents.Activate, () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on(ElectronEvents.Quit, () => {
    globalShortcut.unregisterAll();
  });
}
