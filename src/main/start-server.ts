import { electronApp } from '@electron-toolkit/utils';
import { ElectronEvents } from '@root/common/constants';
import { app } from 'electron';
import { attachAppEvents } from './core/attach-app-events';
import { createWindow } from './core/create-window';
import { IpcBridgeService } from './core/ipc-bridge';
import { registerGlobalShortcuts } from './core/register-global-shortcuts';
import { initAnnotationOverlayModule } from './modules/annotation-overlay';
import { initMenuModule } from './modules/menu';
import { initRemoteInputModule } from './modules/remote-input';
import { initScreenCaptureModule } from './modules/screen-capture';
import { initSystemModule } from './modules/system';

startApp();

async function startApp(): Promise<void> {
  // On macOS apps typically stay alive until the user quits with Cmd+Q.
  app.on(ElectronEvents.WindowAllClosed, () => {
    if (process.platform !== 'darwin') app.quit();
  });

  await app.whenReady();

  handleAppIsReady();
}

function handleAppIsReady(): void {
  electronApp.setAppUserModelId('com.electron');

  const ipcBridgeService = new IpcBridgeService();

  initMenuModule(ipcBridgeService);
  initSystemModule(ipcBridgeService);

  /**
   * Both must be initialised before the window exists. The capture module installs the
   * handler that answers the renderer's `getDisplayMedia()` call, and a renderer that
   * loads first could ask before anyone is listening.
   */
  initScreenCaptureModule(ipcBridgeService);
  initRemoteInputModule(ipcBridgeService);
  const annotationOverlayService = initAnnotationOverlayModule(ipcBridgeService);

  attachAppEvents(app);

  registerGlobalShortcuts({ onPanic: () => annotationOverlayService.destroy() });

  createWindow();
}
