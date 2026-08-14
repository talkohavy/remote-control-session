import { ApiEvents } from '@root/common/constants';
import type { IpcService } from '@preload/ipc-service';
import type { ContextMenuRequest, MenuCommandMessage } from '@root/common/types';

export class MenuApi {
  #ipc: IpcService;

  constructor(ipc: IpcService) {
    this.#ipc = ipc;
  }

  /** Subscribe to commands fired by native menu clicks. Returns an unsubscribe fn. */
  onCommand = (listener: (command: MenuCommandMessage) => void): (() => void) =>
    this.#ipc.subscribe(ApiEvents.MenuCommand, listener);

  /** Ask main to pop the native right-click menu at the given cursor position. */
  showContextMenu = (request: ContextMenuRequest): void => this.#ipc.send(ApiEvents.MenuShowContext, request);
}
