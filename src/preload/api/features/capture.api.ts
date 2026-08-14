import { ApiEvents } from '@root/common/constants';
import type { IpcService } from '@preload/ipc-service';
import type { CaptureSource } from '@root/common/types';

export class CaptureApi {
  #ipc: IpcService;

  constructor(ipc: IpcService) {
    this.#ipc = ipc;
  }

  /** Screens and windows available to share. Empty on Wayland, where the portal picks. */
  listSources = (): Promise<CaptureSource[]> => this.#ipc.invoke<CaptureSource[]>(ApiEvents.CaptureListSources);

  /**
   * Records the choice in the main process, which is what answers the subsequent
   * `getDisplayMedia()` call - the renderer never names a source to the browser itself.
   */
  selectSource = (sourceId: string): void => this.#ipc.send(ApiEvents.CaptureSelectSource, sourceId);
}
