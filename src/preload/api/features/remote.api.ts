import { ApiEvents } from '@root/common/constants';
import type { IpcService } from '@preload/ipc-service';
import type { PermissionKind, RemoteInputEvent, RemotePermissions, ScreenSize } from '@root/common/types';

export class RemoteApi {
  #ipc: IpcService;

  constructor(ipc: IpcService) {
    this.#ipc = ipc;
  }

  getScreenSize = (): Promise<ScreenSize> => this.#ipc.invoke<ScreenSize>(ApiEvents.RemoteGetScreenSize);

  getPermissions = (): Promise<RemotePermissions> =>
    this.#ipc.invoke<RemotePermissions>(ApiEvents.RemoteGetPermissions);

  /** Triggers the OS grant prompts, then reports the resulting state. */
  requestPermissions = (): Promise<RemotePermissions> =>
    this.#ipc.invoke<RemotePermissions>(ApiEvents.RemoteRequestPermissions);

  openPermissionSettings = (kind: PermissionKind): void => this.#ipc.send(ApiEvents.RemoteOpenPermissionSettings, kind);

  /** The consent gate. Until this is true, injected events are discarded in main. */
  setControlAllowed = (isAllowed: boolean): void => this.#ipc.send(ApiEvents.RemoteSetControlAllowed, isAllowed);

  /** Hot path: fire-and-forget, called at pointer frequency. */
  sendInput = (event: RemoteInputEvent): void => this.#ipc.send(ApiEvents.RemoteInput, event);

  /** Lifts anything still held down, e.g. after a viewer disconnects mid-keystroke. */
  releaseAll = (): void => this.#ipc.send(ApiEvents.RemoteReleaseAll);
}
