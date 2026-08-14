import { ElectronEvents } from '@root/common/constants';
import { app } from 'electron';
import { RemoteInputController } from './controllers/remote-input.controller';
import { PermissionsService } from './services/permissions.service';
import { RemoteInputService } from './services/remote-input.service';
import type { IpcBridgeService } from '@main/core/ipc-bridge';

export function initRemoteInputModule(bridge: IpcBridgeService) {
  const remoteInputService = new RemoteInputService();
  const permissionsService = new PermissionsService();

  // Quitting mid-keystroke must not leave a modifier held down on the host.
  app.on(ElectronEvents.Quit, () => remoteInputService.releaseAll());

  const remoteInputController = new RemoteInputController(bridge, remoteInputService, permissionsService);

  remoteInputController.register();
}
