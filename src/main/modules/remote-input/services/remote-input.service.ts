import { MAX_INPUT_EVENTS_PER_SECOND } from '@root/common/constants';
import { screen } from 'electron';
import { toLibnutKey } from '../logic/key-map';
import { loadLibnut, type Libnut } from '../logic/libnut';
import { RateLimiter } from '../logic/rate-limiter';
import type { MouseButton, RemoteInputEvent, ScreenSize } from '@root/common/types';

/**
 * Turns remote input events into real OS-level mouse and keyboard activity.
 *
 * Two invariants matter more than anything else here:
 *
 * 1. Nothing is injected unless the host has explicitly granted control. The session
 *    starts view-only and stays that way until the local user opts in.
 * 2. Whatever is pressed can always be un-pressed. A viewer that vanishes mid-keystroke
 *    would otherwise leave the host with a stuck modifier, which is close to unusable.
 */
export class RemoteInputService {
  private readonly libnut: Libnut | null = loadLibnut();
  private readonly rateLimiter = new RateLimiter(MAX_INPUT_EVENTS_PER_SECOND);

  private controlAllowed = false;
  private cachedScreenSize: ScreenSize | null = null;

  private readonly pressedKeys = new Set<string>();
  private readonly pressedButtons = new Set<MouseButton>();

  constructor() {
    /**
     * Plugging in a monitor or changing resolution invalidates the mapping from
     * normalised coordinates to pixels, so the cache is dropped on any display change.
     */
    const invalidate = (): void => {
      this.cachedScreenSize = null;
    };

    screen.on('display-metrics-changed', invalidate);
    screen.on('display-added', invalidate);
    screen.on('display-removed', invalidate);

    this.libnut?.setMouseDelay(0);
    this.libnut?.setKeyboardDelay(0);
  }

  isAvailable(): boolean {
    return this.libnut !== null;
  }

  setControlAllowed(isAllowed: boolean): void {
    this.controlAllowed = isAllowed;

    // Revoking control must not leave a key or button held down from before.
    if (!isAllowed) this.releaseAll();
  }

  getScreenSize(): ScreenSize {
    if (this.cachedScreenSize) return this.cachedScreenSize;

    /**
     * Read the size from the same native module that will receive the coordinates, so the
     * two can never disagree about scaling. Electron's `screen` module reports logical
     * points, which is not always what the injection backend expects.
     */
    const size = this.libnut?.getScreenSize() ?? screen.getPrimaryDisplay().size;

    this.cachedScreenSize = { width: size.width, height: size.height };

    return this.cachedScreenSize;
  }

  inject(event: RemoteInputEvent): void {
    if (!this.controlAllowed || !this.libnut) return;
    if (!this.rateLimiter.tryConsume()) return;

    try {
      this.apply(this.libnut, event);
    } catch (error) {
      console.error('[remote-input] failed to inject', event.type, error);
    }
  }

  /** Lifts every key and button this service is holding. Safe to call at any time. */
  releaseAll(): void {
    if (!this.libnut) return;

    for (const button of this.pressedButtons) {
      try {
        this.libnut.mouseToggle('up', button);
      } catch {
        // Best effort: a failure here must not stop the remaining releases.
      }
    }

    for (const key of this.pressedKeys) {
      try {
        this.libnut.keyToggle(key, 'up');
      } catch {
        // Same reasoning as above.
      }
    }

    this.pressedButtons.clear();
    this.pressedKeys.clear();
  }

  private apply(libnut: Libnut, event: RemoteInputEvent): void {
    switch (event.type) {
      case 'move': {
        this.moveTo(libnut, event.x, event.y);
        return;
      }

      case 'buttonDown': {
        /**
         * Button events carry their own coordinates and move first. Pointer movement
         * travels on a lossy channel, so the latest move may never have arrived - without
         * this the click would land wherever the cursor happened to be left.
         */
        this.moveTo(libnut, event.x, event.y);
        libnut.mouseToggle('down', event.button);
        this.pressedButtons.add(event.button);
        return;
      }

      case 'buttonUp': {
        this.moveTo(libnut, event.x, event.y);
        libnut.mouseToggle('up', event.button);
        this.pressedButtons.delete(event.button);
        return;
      }

      case 'wheel': {
        libnut.scrollMouse(event.deltaX, event.deltaY);
        return;
      }

      case 'keyDown': {
        const key = toLibnutKey(event.code);

        if (!key) return;

        libnut.keyToggle(key, 'down');
        this.pressedKeys.add(key);
        return;
      }

      case 'keyUp': {
        const key = toLibnutKey(event.code);

        if (!key) return;

        libnut.keyToggle(key, 'up');
        this.pressedKeys.delete(key);
        return;
      }

      case 'text': {
        libnut.typeString(event.value);
      }
    }
  }

  /**
   * Normalised 0..1 coordinates are the only form that survives the trip between two
   * machines with different resolutions and DPI scaling, so the conversion to pixels
   * happens here, at the last possible moment.
   */
  private moveTo(libnut: Libnut, normalizedX: number, normalizedY: number): void {
    const { width, height } = this.getScreenSize();

    const x = Math.round(clamp01(normalizedX) * (width - 1));
    const y = Math.round(clamp01(normalizedY) * (height - 1));

    libnut.moveMouse(x, y);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(1, Math.max(0, value));
}
