import { ElectronEvents } from '@root/common/constants';
import { app } from 'electron';
import { AnnotationOverlayController } from './controllers/annotation-overlay.controller';
import { AnnotationOverlayService } from './services/annotation-overlay.service';
import type { IpcBridgeService } from '@main/core/ipc-bridge';

export function initAnnotationOverlayModule(bridge: IpcBridgeService): AnnotationOverlayService {
  const annotationOverlayService = new AnnotationOverlayService(bridge);

  // Quitting mid-share must not leave a full-screen overlay window running headless.
  app.on(ElectronEvents.Quit, () => annotationOverlayService.destroy());

  const annotationOverlayController = new AnnotationOverlayController(bridge, annotationOverlayService);

  annotationOverlayController.register();

  return annotationOverlayService;
}
