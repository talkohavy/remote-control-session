import { ApiEvents } from '@root/common/constants';
import type { IpcService } from '@preload/ipc-service';
import type {
  AnnotationStrokeEndPayload,
  AnnotationStrokePointPayload,
  AnnotationStrokeStartPayload,
  DisplayOffset,
} from '@root/common/types';

export class AnnotationApi {
  #ipc: IpcService;

  constructor(ipc: IpcService) {
    this.#ipc = ipc;
  }

  /** Sent once when sharing starts, so main knows which physical display to overlay. */
  setActiveDisplay = (displayId?: string): void => this.#ipc.send(ApiEvents.AnnotationSetActiveDisplay, displayId);

  /** Sent once when sharing stops, to hide the overlay window. */
  clearActiveDisplay = (): void => this.#ipc.send(ApiEvents.AnnotationClearActiveDisplay);

  /** Hot path: fire-and-forget, forwarded from a viewer's data channel. */
  strokeStart = (payload: AnnotationStrokeStartPayload): void =>
    this.#ipc.send(ApiEvents.AnnotationStrokeStart, payload);

  strokePoint = (payload: AnnotationStrokePointPayload): void =>
    this.#ipc.send(ApiEvents.AnnotationStrokePoint, payload);

  strokeEnd = (payload: AnnotationStrokeEndPayload): void => this.#ipc.send(ApiEvents.AnnotationStrokeEnd, payload);

  /** Host-initiated or viewer-initiated: wipes every stroke on the overlay. */
  clear = (): void => this.#ipc.send(ApiEvents.AnnotationClear);

  /** Subscriptions used only by the overlay window's own page. */
  onStrokeStart = (listener: (payload: AnnotationStrokeStartPayload) => void): (() => void) =>
    this.#ipc.subscribe(ApiEvents.AnnotationStrokeStart, listener);

  onStrokePoint = (listener: (payload: AnnotationStrokePointPayload) => void): (() => void) =>
    this.#ipc.subscribe(ApiEvents.AnnotationStrokePoint, listener);

  onStrokeEnd = (listener: (payload: AnnotationStrokeEndPayload) => void): (() => void) =>
    this.#ipc.subscribe(ApiEvents.AnnotationStrokeEnd, listener);

  onClear = (listener: (payload: undefined) => void): (() => void) =>
    this.#ipc.subscribe(ApiEvents.AnnotationClear, listener);

  /** Pulled once on the overlay page's own mount - see `AnnotationOverlayService.getDisplayOffset`. */
  getDisplayOffset = (): Promise<DisplayOffset> => this.#ipc.invoke(ApiEvents.AnnotationGetDisplayOffset);
}
