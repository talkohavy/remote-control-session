import type { RemoteProtocol } from '../constants/remote-session';

export type CaptureSource = {
  id: string;
  name: string;
  thumbnailDataUrl: string | null;
  kind: 'screen' | 'window';
  displayId?: string;
};

export type ScreenSize = {
  width: number;
  height: number;
};

export type MouseButton = 'left' | 'middle' | 'right';

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type RemoteInputEvent =
  | ({ type: 'move' } & NormalizedPoint)
  | ({ type: 'buttonDown'; button: MouseButton } & NormalizedPoint)
  | ({ type: 'buttonUp'; button: MouseButton } & NormalizedPoint)
  | { type: 'wheel'; deltaX: number; deltaY: number }
  | { type: 'keyDown'; code: string }
  | { type: 'keyUp'; code: string }
  | { type: 'text'; value: string };

export type DrawStyle = {
  color: string;
  width: number;
};

export type PermissionState = 'granted' | 'denied' | 'unknown' | 'not-required';

export type RemotePermissions = {
  screenRecording: PermissionState;
  accessibility: PermissionState;
  injectionUnavailableReason: string | null;
};

export type PermissionKind = 'screenRecording' | 'accessibility';

export type ControlMessage =
  | { type: typeof RemoteProtocol.Hello; pin: string; viewerName: string }
  | {
      type: typeof RemoteProtocol.Granted;
      hostName: string;
      controlAllowed: boolean;
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

export type AnnotationStrokeStartPayload = { strokeId: string; style: DrawStyle } & NormalizedPoint;
export type AnnotationStrokePointPayload = { strokeId: string } & NormalizedPoint;
export type AnnotationStrokeEndPayload = { strokeId: string };

export type DisplayOffset = { x: number; y: number };

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

export type ConnectedViewer = {
  peerId: string;
  viewerName: string;
  authenticated: boolean;
};
