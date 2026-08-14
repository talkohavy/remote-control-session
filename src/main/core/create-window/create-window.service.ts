import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { WindowEvents } from '@root/common/constants';
// @ts-ignore - handled by electron-vite's ?asset loader
import icon from '@root/resources/icon.png?asset';
import { BrowserWindow, shell } from 'electron';

/**
 * Creates the main application window and wires its lifecycle. Extracted from
 * the bootstrap so `index.ts` stays focused on app-level orchestration.
 */
export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    titleBarStyle: 'hidden', // <--- this will make drag & drop window stop working, fixable only by css.
    // maximizable: true,
    // minWidth: 900,
    // minHeight: 670,
    // alwaysOnTop: true,
    /**
     * Keep our hand-rolled menu visible on Windows/Linux (no-op on macOS, where
     * the menu always lives in the system top bar).
     */
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
    // kiosk: true,
    // alwaysOnTop: true,
    // closable: false,
    // center: true,
  });

  window.on(WindowEvents.ReadyToShow, () => {
    window.show();
  });

  // Open external links in the user's browser, not inside the app window.
  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Open the DevTools on app start:
  if (process.env.SHOW_DEV_TOOLS) {
    window.webContents.openDevTools({
      mode: 'right', // <--- defaults to 'right'
    });
  }

  // HMR for the renderer in dev; the built file in production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}
