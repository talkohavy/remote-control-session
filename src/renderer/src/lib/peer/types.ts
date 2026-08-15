import type {
  AnnotationStrokeEndPayload,
  AnnotationStrokePointPayload,
  AnnotationStrokeStartPayload,
  ConnectedViewer,
  RemoteInputEvent,
} from '@root/common/types';
import type { DataConnection, MediaConnection } from 'peerjs';

export type ViewerSessionCallbacks = {
  onStream: (stream: MediaStream) => void;
  onGranted: (controlAllowed: boolean, captureKind: 'screen' | 'window') => void;
  onControlStateChanged: (controlAllowed: boolean) => void;
  onRejected: (reason: string) => void;
  onClosed: () => void;
  onError: (message: string) => void;
  /** The host cleared annotations (either its own button or another viewer's Clear) - wipe our local preview too. */
  onHostClear: () => void;
};

export type HostSessionCallbacks = {
  onReady: (sessionCode: string, pin: string) => void;
  onViewersChanged: (viewers: ConnectedViewer[]) => void;
  onInput: (event: RemoteInputEvent) => void;
  onDrawStart: (payload: AnnotationStrokeStartPayload) => void;
  onDrawPoint: (payload: AnnotationStrokePointPayload) => void;
  onDrawEnd: (payload: AnnotationStrokeEndPayload) => void;
  onDrawClear: () => void;
  onError: (message: string) => void;
};

export type ViewerState = {
  peerId: string;
  viewerName: string;
  authenticated: boolean;
  pinAttempts: number;
  control: DataConnection | null;
  motion: DataConnection | null;
  media: MediaConnection | null;
};
