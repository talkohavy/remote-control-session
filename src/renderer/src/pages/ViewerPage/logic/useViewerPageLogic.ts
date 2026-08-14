import { useCallback, useEffect, useRef, useState } from 'react';
import { showErrorToast, showInfoToast, showSuccessToast } from '@renderer/common/utils/toast';
import { normalizeSessionCode, ViewerSession } from '@renderer/lib/peer';
import type { ConnectionStatus, DrawStyle, NormalizedPoint, RemoteInputEvent } from '@root/common/types';

const DEFAULT_DRAW_COLOR = '#ff3b30';
const DEFAULT_DRAW_WIDTH = 4;

export function useViewerPageLogic() {
  const sessionRef = useRef<ViewerSession | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [sessionCode, setSessionCode] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [hasStream, setHasStream] = useState(false);

  /** Mirrors the host's consent switch. The host is the source of truth. */
  const [controlAllowed, setControlAllowed] = useState(false);

  /** Local opt-in, so a viewer can watch without their stray mouse moves being sent. */
  const [isControlling, setIsControllingState] = useState(false);

  /** Whether the host is sharing an entire screen - the draw tool needs a real overlay window, which only works for a full-screen share (see `AnnotationOverlayService`). */
  const [captureKind, setCaptureKind] = useState<'screen' | 'window'>('screen');

  /** Local opt-in for the draw tool. Mutually exclusive with `isControlling` - both hijack mouse-drag over the video. */
  const [isDrawing, setIsDrawingState] = useState(false);
  const [drawColor, setDrawColor] = useState(DEFAULT_DRAW_COLOR);
  const [drawWidth, setDrawWidth] = useState(DEFAULT_DRAW_WIDTH);

  /** Bumped to tell `RemoteScreen` to wipe its local canvas (see `useDrawCapture`). */
  const [clearSignal, setClearSignal] = useState(0);

  const setIsControlling = useCallback((next: boolean) => {
    setIsControllingState(next);
    if (next) setIsDrawingState(false);
  }, []);

  const setIsDrawing = useCallback((next: boolean) => {
    setIsDrawingState(next);
    if (next) setIsControllingState(false);
  }, []);

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect();
    sessionRef.current = null;

    setStatus('closed');
    setHasStream(false);
    setControlAllowed(false);
    setIsControllingState(false);
    setIsDrawingState(false);
  }, []);

  useEffect(() => disconnect, [disconnect]);

  const connect = useCallback(() => {
    const code = normalizeSessionCode(sessionCode);
    const cleanPin = normalizeSessionCode(pin);

    if (!code || !cleanPin) {
      showErrorToast({ title: 'Enter both the session code and the PIN.' });
      return;
    }

    setStatus('connecting');

    const session = new ViewerSession({
      onStream: (stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;

        setHasStream(true);
        setStatus('connected');
      },
      onGranted: (allowed, kind) => {
        setStatus('connected');
        setControlAllowed(allowed);
        setCaptureKind(kind);
        showSuccessToast({ title: 'Connected to host.' });
      },
      onControlStateChanged: (allowed) => {
        setControlAllowed(allowed);

        // Losing permission must also stop us sending, not just stop the host accepting.
        if (!allowed) {
          setIsControllingState(false);
          setIsDrawingState(false);
        }

        showInfoToast({ title: allowed ? 'Host granted remote control.' : 'Host revoked remote control.' });
      },
      onRejected: (reason) => {
        setStatus('error');
        showErrorToast({ title: reason });
      },
      onClosed: () => {
        setStatus('closed');
        setHasStream(false);
        setControlAllowed(false);
        setIsControllingState(false);
        setIsDrawingState(false);
      },
      onError: (message) => {
        setStatus('error');
        showErrorToast({ title: message });
      },
      onHostClear: () => setClearSignal((id) => id + 1),
    });

    sessionRef.current = session;
    session.connect(code, cleanPin, `Viewer on ${navigator.platform}`);
  }, [sessionCode, pin]);

  const sendInput = useCallback((event: RemoteInputEvent) => {
    sessionRef.current?.sendInput(event);
  }, []);

  const sendDrawStart = useCallback((strokeId: string, point: NormalizedPoint, style: DrawStyle) => {
    sessionRef.current?.sendDrawStart(strokeId, point, style);
  }, []);

  const sendDrawPoint = useCallback((strokeId: string, point: NormalizedPoint) => {
    sessionRef.current?.sendDrawPoint(strokeId, point);
  }, []);

  const sendDrawEnd = useCallback((strokeId: string) => {
    sessionRef.current?.sendDrawEnd(strokeId);
  }, []);

  /** Wipes the host's overlay and this viewer's own local preview together. */
  const clearDrawing = useCallback(() => {
    sessionRef.current?.sendDrawClear();
    setClearSignal((id) => id + 1);
  }, []);

  return {
    videoRef,
    sessionCode,
    setSessionCode,
    pin,
    setPin,
    status,
    hasStream,
    controlAllowed,
    isControlling,
    setIsControlling,
    captureKind,
    isDrawing,
    setIsDrawing,
    drawColor,
    setDrawColor,
    drawWidth,
    setDrawWidth,
    clearSignal,
    clearDrawing,
    connect,
    disconnect,
    sendInput,
    sendDrawStart,
    sendDrawPoint,
    sendDrawEnd,
  };
}
