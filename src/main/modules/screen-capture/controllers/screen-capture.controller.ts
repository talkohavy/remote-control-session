import { ApiEvents } from '@root/common/constants';
import type { IpcBridgeService } from '@main/core/ipc-bridge';
import type { ScreenCaptureService } from '../services/screen-capture.service';

export class ScreenCaptureController {
  constructor(
    private readonly bridge: IpcBridgeService,
    private readonly screenCaptureService: ScreenCaptureService,
  ) {}

  register(): void {
    this.listSources();
    this.selectSource();
  }

  private listSources() {
    this.bridge.handle(ApiEvents.CaptureListSources, () => this.screenCaptureService.listSources());
  }

  private selectSource() {
    this.bridge.on(ApiEvents.CaptureSelectSource, (_event, sourceId: string) =>
      this.screenCaptureService.selectSource(sourceId),
    );
  }
}
