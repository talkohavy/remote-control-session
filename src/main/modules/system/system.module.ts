import { SystemController } from './controllers/system.controller';
import { SystemService } from './services/system.service';
import type { IpcBridgeService } from '@main/core/ipc-bridge';

export function initSystemModule(bridge: IpcBridgeService) {
  const systemService = new SystemService();

  const systemController = new SystemController(bridge, systemService);

  systemController.register();
}
