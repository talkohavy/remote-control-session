import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { ApiEvents } from '@root/common/constants';
import { BrowserWindow, screen } from 'electron';
import type { IpcBridgeService } from '@main/core/ipc-bridge';
import type {
  AnnotationStrokeEndPayload,
  AnnotationStrokePointPayload,
  AnnotationStrokeStartPayload,
  DisplayOffset,
} from '@root/common/types';

/** Hash route the overlay window loads - a bare transparent canvas, no app chrome. */
const OVERLAY_HASH_ROUTE = '/base/overlay';

/**
 * Renders live annotation strokes directly onto the host's physical desktop.
 *
 * The host page has no local video preview of its own screen, so the only way for a
 * viewer's drawing to be visible to the person sitting at the host machine is a real,
 * on-screen window. A useful side effect of that choice: because it is an ordinary
 * window, `desktopCapturer` picks it up like anything else on screen, so the viewer's
 * own video feed ends up showing the strokes too, with no changes to the media pipeline.
 *
 * Deliberately click-through and non-focusable: it must never intercept the host's own
 * mouse or steal focus from whatever they are doing.
 */
export class AnnotationOverlayService {
  private overlayWindow: BrowserWindow | null = null;
  private activeDisplayBounds: Electron.Rectangle | null = null;

  constructor(private readonly bridge: IpcBridgeService) {}

  /** Called once when sharing starts. No-op result if `displayId` matches nothing findable. */
  setActiveDisplay(displayId?: string): void {
    const display = this.resolveDisplay(displayId);
    const window = this.ensureWindow();

    this.activeDisplayBounds = display.bounds;
    window.setBounds(display.bounds);

    if (window.isVisible()) return;

    if (window.webContents.isLoading()) {
      window.once('ready-to-show', () => window.showInactive());
    } else {
      window.showInactive();
    }
  }

  /** Called when sharing stops - strokes must not linger over the desktop afterwards. */
  clearActiveDisplay(): void {
    this.destroy();
  }

  /**
   * Unconditionally tears the overlay down. Safe to call at any time, including as a
   * last-resort recovery path (app quit, a global panic shortcut) if it is ever showing
   * something it shouldn't - a full-screen, always-on-top window is not something a user
   * should ever be stuck looking at with no way to dismiss it.
   */
  destroy(): void {
    this.overlayWindow?.destroy();
    this.overlayWindow = null;
  }

  strokeStart(payload: AnnotationStrokeStartPayload): void {
    this.forward(ApiEvents.AnnotationStrokeStart, payload);
  }

  strokePoint(payload: AnnotationStrokePointPayload): void {
    this.forward(ApiEvents.AnnotationStrokePoint, payload);
  }

  strokeEnd(payload: AnnotationStrokeEndPayload): void {
    this.forward(ApiEvents.AnnotationStrokeEnd, payload);
  }

  clear(): void {
    this.forward(ApiEvents.AnnotationClear, undefined);
  }

  private forward(channel: string, payload: unknown): void {
    if (!this.overlayWindow) return;

    this.bridge.emit(this.overlayWindow, channel, payload);
  }

  /**
   * Reads back where the OS actually placed the window - which on macOS can differ from the
   * `setBounds` request, since this window's level sits below the menu bar's, and the clamp
   * only takes effect once the window is actually shown, not at `setBounds` time.
   *
   * Deliberately pulled by the overlay page on its own mount rather than pushed from here: a
   * push has no way to know the renderer's IPC listener is attached yet (native
   * `ready-to-show` can fire before React finishes mounting), so it can race and silently
   * deliver a stale `{0, 0}`. Waiting for `'show'` here, rather than trusting whatever
   * `getBounds` says right now, closes that race from the other end too: if this is called
   * before the window is actually on screen, the clamp has not happened yet either.
   */
  getDisplayOffset(): Promise<DisplayOffset> {
    const window = this.overlayWindow;
    const displayBounds = this.activeDisplayBounds;

    if (!window || !displayBounds) return Promise.resolve({ x: 0, y: 0 });

    const compute = (): DisplayOffset => {
      const actual = window.getBounds();

      return { x: actual.x - displayBounds.x, y: actual.y - displayBounds.y };
    };

    if (window.isVisible()) return Promise.resolve(compute());

    return new Promise((resolve) => window.once('show', () => resolve(compute())));
  }

  private resolveDisplay(displayId?: string): Electron.Display {
    const displays = screen.getAllDisplays();
    const match = displayId ? displays.find((display) => String(display.id) === displayId) : undefined;

    return match ?? screen.getPrimaryDisplay();
  }

  private ensureWindow(): BrowserWindow {
    if (this.overlayWindow) return this.overlayWindow;

    const window = new BrowserWindow({
      frame: false,
      transparent: true,
      /**
       * Explicit, fully-transparent `backgroundColor` (as opposed to just `transparent:
       * true`) is what Windows needs to actually composite this as see-through rather
       * than an opaque placeholder while content loads or repaints.
       */
      backgroundColor: '#00000000',
      hasShadow: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      focusable: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
      },
    });

    /**
     * `'floating'` sits above ordinary and fullscreen app windows, which is enough to
     * show ink while sharing a fullscreen app. Deliberately *not* `'screen-saver'`: that
     * level can sit above system UI (app switcher, notifications, even some system
     * dialogs), which turns any rendering bug here into something the user cannot get
     * past at all - see `destroy()` for the same reasoning applied to recovery.
     */
    window.setAlwaysOnTop(true, 'floating');
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Never a click or drag target - input must keep reaching whatever is underneath.
    window.setIgnoreMouseEvents(true, { forward: true });

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${OVERLAY_HASH_ROUTE}`);
    } else {
      window.loadFile(join(__dirname, '../renderer/index.html'), { hash: OVERLAY_HASH_ROUTE });
    }

    window.on('closed', () => {
      if (this.overlayWindow === window) this.overlayWindow = null;
    });

    this.overlayWindow = window;

    return window;
  }
}
