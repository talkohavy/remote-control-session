import { ScreenCaptureController } from './controllers/screen-capture.controller';
import { ScreenCaptureService } from './services/screen-capture.service';
import type { IpcBridgeService } from '@main/core/ipc-bridge';

export function initScreenCaptureModule(bridge: IpcBridgeService) {
  const screenCaptureService = new ScreenCaptureService();

  screenCaptureService.installDisplayMediaHandler();

  const screenCaptureController = new ScreenCaptureController(bridge, screenCaptureService);

  screenCaptureController.register();
}
