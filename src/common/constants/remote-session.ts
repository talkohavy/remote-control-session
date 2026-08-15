export const PeerChannels = {
  Control: 'control',
  Motion: 'motion',
} as const;

export const RemoteProtocol = {
  Hello: 'hello',
  Granted: 'granted',
  Rejected: 'rejected',
  ControlState: 'controlState',
  Input: 'input',
  Bye: 'bye',
  DrawStart: 'drawStart',
  DrawPoint: 'drawPoint',
  DrawEnd: 'drawEnd',
  DrawClear: 'drawClear',
} as const;

export const SESSION_PIN_LENGTH = 6;
export const MAX_INPUT_EVENTS_PER_SECOND = 300;
export const DEFAULT_STUN_URL = 'stun:stun.l.google.com:19302';
