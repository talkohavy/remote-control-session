/**
 * Labels for the two data channels a viewer opens. Splitting them is what keeps the
 * pointer feeling attached to the hand: a dropped move is worthless a frame later,
 * while a dropped keystroke or mouse-up is a stuck key.
 */
export const PeerChannels = {
  /** Reliable + ordered: handshake, keys, buttons, wheel. */
  Control: 'control',
  /** Unreliable + unordered: pointer movement only. */
  Motion: 'motion',
} as const;

export const RemoteProtocol = {
  Hello: 'hello',
  Granted: 'granted',
  Rejected: 'rejected',
  ControlState: 'controlState',
  Input: 'input',
  Bye: 'bye',
  /**
   * Live annotation strokes. Kept on the reliable channel (see `PeerChannels.Control`):
   * a dropped or reordered point leaves a visible kink or gap in a line, which is worse
   * here than the extra latency that reliability costs.
   */
  DrawStart: 'drawStart',
  DrawPoint: 'drawPoint',
  DrawEnd: 'drawEnd',
  DrawClear: 'drawClear',
} as const;

export const SESSION_PIN_LENGTH = 6;

/**
 * Ceiling on injected events per second. A remote peer can flood the channel far
 * faster than a human can act; past this rate the extra events are dropped rather
 * than queued, so the host stays responsive.
 */
export const MAX_INPUT_EVENTS_PER_SECOND = 300;

/** Public STUN. Overridable, together with TURN, via the VITE_* env vars. */
export const DEFAULT_STUN_URL = 'stun:stun.l.google.com:19302';
