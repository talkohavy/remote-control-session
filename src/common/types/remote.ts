import type { PeerChannels, RemoteProtocol } from '../constants/remote-session';

/** A capturable screen or window, as offered by Electron's desktopCapturer. */
export type CaptureSource = {
  id: string;
  name: string;
  /** Data URL of the preview thumbnail, or null when the platform can't supply one. */
  thumbnailDataUrl: string | null;
  kind: 'screen' | 'window';
  /**
   * Electron's `desktopCapturer` `display_id`, present only for `kind: 'screen'` sources.
   * Lets the annotation overlay window find the matching `screen.getAllDisplays()` entry.
   */
  displayId?: string;
};

export type ScreenSize = {
  width: number;
  height: number;
};

export type MouseButton = 'left' | 'middle' | 'right';

/**
 * Pointer coordinates travel normalised to 0..1 rather than as pixels. The viewer's
 * window, the video element and the host's display all have different sizes and DPI
 * scale factors; a fraction of the screen is the only value that survives the trip.
 */
export type NormalizedPoint = {
  x: number;
  y: number;
};

/**
 * Modifier keys are carried as ordinary `keyDown`/`keyUp` events rather than as a
 * modifier list on each key. Injecting them as real presses is what makes held
 * modifiers, chords and auto-repeat behave like a physical keyboard.
 */
export type RemoteInputEvent =
  | ({ type: 'move' } & NormalizedPoint)
  | ({ type: 'buttonDown'; button: MouseButton } & NormalizedPoint)
  | ({ type: 'buttonUp'; button: MouseButton } & NormalizedPoint)
  | { type: 'wheel'; deltaX: number; deltaY: number }
  | { type: 'keyDown'; code: string }
  | { type: 'keyUp'; code: string }
  | { type: 'text'; value: string };

/** Visual style of a stroke, fixed for its whole lifetime once `DrawStart` picks it. */
export type DrawStyle = {
  color: string;
  width: number;
};

export type PermissionState = 'granted' | 'denied' | 'unknown' | 'not-required';

export type RemotePermissions = {
  /** Needed to capture the screen at all. */
  screenRecording: PermissionState;
  /** Needed to inject mouse and keyboard into other applications. */
  accessibility: PermissionState;
  /** Populated when the platform can capture but cannot inject (notably Wayland). */
  injectionUnavailableReason: string | null;
};

export type PermissionKind = 'screenRecording' | 'accessibility';

export type PeerChannelLabel = (typeof PeerChannels)[keyof typeof PeerChannels];

type ProtocolType = (typeof RemoteProtocol)[keyof typeof RemoteProtocol];

/** Messages exchanged over the reliable control channel. */
export type ControlMessage =
  | { type: typeof RemoteProtocol.Hello; pin: string; viewerName: string }
  | {
      type: typeof RemoteProtocol.Granted;
      hostName: string;
      controlAllowed: boolean;
      /** Lets the viewer know whether the draw tool can work (see `CaptureSource.kind`). */
      captureKind: 'screen' | 'window';
    }
  | { type: typeof RemoteProtocol.Rejected; reason: string }
  | { type: typeof RemoteProtocol.ControlState; controlAllowed: boolean }
  | { type: typeof RemoteProtocol.Input; event: RemoteInputEvent }
  | { type: typeof RemoteProtocol.Bye }
  | ({ type: typeof RemoteProtocol.DrawStart; strokeId: string; style: DrawStyle } & NormalizedPoint)
  | ({ type: typeof RemoteProtocol.DrawPoint; strokeId: string } & NormalizedPoint)
  | { type: typeof RemoteProtocol.DrawEnd; strokeId: string }
  | { type: typeof RemoteProtocol.DrawClear };

export type MotionMessage = {
  type: typeof RemoteProtocol.Input;
  event: RemoteInputEvent;
};

export type AnyPeerMessage = ControlMessage | MotionMessage;

/** Payloads forwarded host renderer -> main -> overlay window for a live annotation stroke. */
export type AnnotationStrokeStartPayload = { strokeId: string; style: DrawStyle } & NormalizedPoint;
export type AnnotationStrokePointPayload = { strokeId: string } & NormalizedPoint;
export type AnnotationStrokeEndPayload = { strokeId: string };

/**
 * How far the overlay `BrowserWindow`'s actual top-left ended up from the target display's
 * top-left, in the same DIP/point units as `Electron.Display.bounds`.
 *
 * On macOS a window whose always-on-top level is below the menu bar's own level gets its `y`
 * silently clamped so it never starts above the menu bar, even though `setBounds` was asked
 * for `y: 0` - the window's *height* is left untouched, so it now undershoots the display's
 * true bottom edge by the same amount. Left uncorrected, every stroke's normalised point
 * lands `offset` pixels away from where it actually is on the physical screen.
 */
export type DisplayOffset = { x: number; y: number };

export type { ProtocolType };

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

/** A viewer currently attached to this host. */
export type ConnectedViewer = {
  peerId: string;
  viewerName: string;
  authenticated: boolean;
};
