import { ApiEvents } from '@root/common/constants';
import type { IpcService } from '@preload/ipc-service';
import type { SystemInfo } from '@root/common/types';

export class SystemApi {
  #ipc: IpcService;

  constructor(ipc: IpcService) {
    this.#ipc = ipc;
  }

  getInfo = (): Promise<SystemInfo | null> => this.#ipc.invoke<SystemInfo | null>(ApiEvents.SystemGetInfo);
}
