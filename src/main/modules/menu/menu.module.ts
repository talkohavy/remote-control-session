import { ApiEvents } from '@root/common/constants';
import { ContextMenuController } from './controllers/context-menu.controller';
import { ContextMenuService } from './services/context-menu.service';
import { MainMenuService } from './services/main-menu.service';
import type { IpcBridgeService } from '@main/core/ipc-bridge';
import type { MenuCommandMessage } from '@root/common/types';

export function initMenuModule(bridge: IpcBridgeService) {
  // Wrap broadcast so the services stay free of IPC channel knowledge.
  const sendMenuCommand = (command: MenuCommandMessage): void => bridge.broadcast(ApiEvents.MenuCommand, command);

  const mainMenuService = new MainMenuService(sendMenuCommand);
  const contextMenuService = new ContextMenuService(sendMenuCommand);

  const contextMenuController = new ContextMenuController(bridge, contextMenuService);

  contextMenuController.register();

  // Replace Electron's default menu with ours.
  mainMenuService.build();
}
