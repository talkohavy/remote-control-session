import { useCallback, useEffect, useRef, useState } from 'react';
import { showErrorToast, showInfoToast, showSuccessToast } from '@renderer/common/utils/toast';
import { normalizeSessionCode, ViewerSession } from '@renderer/lib/peer';
import type { ConnectionStatus, RemoteInputEvent } from '@root/common/types';

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
  const [isControlling, setIsControlling] = useState(false);

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect();
    sessionRef.current = null;

    setStatus('closed');
    setHasStream(false);
    setControlAllowed(false);
    setIsControlling(false);
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
      onGranted: (allowed) => {
        setStatus('connected');
        setControlAllowed(allowed);
        showSuccessToast({ title: 'Connected to host.' });
      },
      onControlStateChanged: (allowed) => {
        setControlAllowed(allowed);

        // Losing permission must also stop us sending, not just stop the host accepting.
        if (!allowed) setIsControlling(false);

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
        setIsControlling(false);
      },
      onError: (message) => {
        setStatus('error');
        showErrorToast({ title: message });
      },
    });

    sessionRef.current = session;
    session.connect(code, cleanPin, `Viewer on ${navigator.platform}`);
  }, [sessionCode, pin]);

  const sendInput = useCallback((event: RemoteInputEvent) => {
    sessionRef.current?.sendInput(event);
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
    connect,
    disconnect,
    sendInput,
  };
}
