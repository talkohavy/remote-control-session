import { ApiEvents } from '@root/common/constants';
import type { IpcBridgeService } from '@main/core/ipc-bridge';
import type { SystemService } from '../services/system.service';

export class SystemController {
  constructor(
    private readonly bridge: IpcBridgeService,
    private readonly systemService: SystemService,
  ) {}

  register(): void {
    this.getSystemInfo();
  }

  private getSystemInfo() {
    this.bridge.handle(ApiEvents.SystemGetInfo, this.systemService.getSystemInfo.bind(this.systemService));
  }
}
