import { ApiEvents } from '@root/common/constants';
import type { IpcBridgeService } from '@main/core/ipc-bridge';
import type { PermissionKind, RemoteInputEvent } from '@root/common/types';
import type { PermissionsService } from '../services/permissions.service';
import type { RemoteInputService } from '../services/remote-input.service';

export class RemoteInputController {
  constructor(
    private readonly bridge: IpcBridgeService,
    private readonly remoteInputService: RemoteInputService,
    private readonly permissionsService: PermissionsService,
  ) {}

  register(): void {
    this.getScreenSize();
    this.getPermissions();
    this.requestPermissions();
    this.openPermissionSettings();
    this.setControlAllowed();
    this.injectInput();
    this.releaseAll();
  }

  private getScreenSize() {
    this.bridge.handle(ApiEvents.RemoteGetScreenSize, () => this.remoteInputService.getScreenSize());
  }

  private getPermissions() {
    this.bridge.handle(ApiEvents.RemoteGetPermissions, () => this.permissionsService.getPermissions());
  }

  private requestPermissions() {
    this.bridge.handle(ApiEvents.RemoteRequestPermissions, () => this.permissionsService.requestPermissions());
  }

  private openPermissionSettings() {
    this.bridge.on(ApiEvents.RemoteOpenPermissionSettings, (_event, kind: PermissionKind) =>
      this.permissionsService.openSettings(kind),
    );
  }

  private setControlAllowed() {
    this.bridge.on(ApiEvents.RemoteSetControlAllowed, (_event, isAllowed: boolean) =>
      this.remoteInputService.setControlAllowed(isAllowed),
    );
  }

  /**
   * Fire-and-forget rather than request/response: this is the hot path, running at pointer
   * frequency, and nothing in the renderer waits on the result.
   */
  private injectInput() {
    this.bridge.on(ApiEvents.RemoteInput, (_event, inputEvent: RemoteInputEvent) =>
      this.remoteInputService.inject(inputEvent),
    );
  }

  private releaseAll() {
    this.bridge.on(ApiEvents.RemoteReleaseAll, () => this.remoteInputService.releaseAll());
  }
}
