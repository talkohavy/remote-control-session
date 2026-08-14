import { ApiEvents } from '@root/common/constants';
import type { IpcBridgeService } from '@main/core/ipc-bridge';
import type {
  AnnotationStrokeEndPayload,
  AnnotationStrokePointPayload,
  AnnotationStrokeStartPayload,
} from '@root/common/types';
import type { AnnotationOverlayService } from '../services/annotation-overlay.service';

export class AnnotationOverlayController {
  constructor(
    private readonly bridge: IpcBridgeService,
    private readonly annotationOverlayService: AnnotationOverlayService,
  ) {}

  register(): void {
    this.setActiveDisplay();
    this.clearActiveDisplay();
    this.strokeStart();
    this.strokePoint();
    this.strokeEnd();
    this.clear();
  }

  private setActiveDisplay() {
    this.bridge.on(ApiEvents.AnnotationSetActiveDisplay, (_event, displayId?: string) =>
      this.annotationOverlayService.setActiveDisplay(displayId),
    );
  }

  private clearActiveDisplay() {
    this.bridge.on(ApiEvents.AnnotationClearActiveDisplay, () => this.annotationOverlayService.clearActiveDisplay());
  }

  /** Fire-and-forget: same hot-path reasoning as `RemoteInputController.injectInput`. */
  private strokeStart() {
    this.bridge.on(ApiEvents.AnnotationStrokeStart, (_event, payload: AnnotationStrokeStartPayload) =>
      this.annotationOverlayService.strokeStart(payload),
    );
  }

  private strokePoint() {
    this.bridge.on(ApiEvents.AnnotationStrokePoint, (_event, payload: AnnotationStrokePointPayload) =>
      this.annotationOverlayService.strokePoint(payload),
    );
  }

  private strokeEnd() {
    this.bridge.on(ApiEvents.AnnotationStrokeEnd, (_event, payload: AnnotationStrokeEndPayload) =>
      this.annotationOverlayService.strokeEnd(payload),
    );
  }

  private clear() {
    this.bridge.on(ApiEvents.AnnotationClear, () => this.annotationOverlayService.clear());
  }
}
