import { useCallback, useEffect, useRef, useState } from 'react';
import { showErrorToast, showInfoToast } from '@renderer/common/utils/toast';
import { ipcClient } from '@renderer/lib/ipc';
import { HostSession } from '@renderer/lib/peer';
import type { CaptureSource, ConnectedViewer, RemotePermissions } from '@root/common/types';

export function useHostPageLogic() {
  const sessionRef = useRef<HostSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [pin, setPin] = useState('');
  const [controlAllowed, setControlAllowed] = useState(false);
  const [viewers, setViewers] = useState<ConnectedViewer[]>([]);
  const [permissions, setPermissions] = useState<RemotePermissions | null>(null);

  useEffect(() => {
    ipcClient.remote.getPermissions().then(setPermissions);

    ipcClient.capture.listSources().then((available) => {
      setSources(available);
      setSelectedSourceId((current) => current ?? available[0]?.id ?? null);
    });
  }, []);

  const stopSharing = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    sessionRef.current?.stop();
    sessionRef.current = null;

    /**
     * Revoking in main as well as locally: a viewer that disconnected mid-keystroke would
     * otherwise leave a modifier held down on this machine.
     */
    ipcClient.remote.setControlAllowed(false);
    ipcClient.remote.releaseAll();

    setIsSharing(false);
    setControlAllowed(false);
    setViewers([]);
    setSessionCode('');
    setPin('');
  }, []);

  // Closing the window mid-session must not leave input stuck down either.
  useEffect(() => stopSharing, [stopSharing]);

  const startSharing = useCallback(async () => {
    try {
      if (selectedSourceId) ipcClient.capture.selectSource(selectedSourceId);

      /**
       * The main process answers this request with the source chosen above, so no
       * source id is named here.
       */
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

      streamRef.current = stream;

      const session = new HostSession({
        onReady: (code, sessionPin) => {
          setSessionCode(code);
          setPin(sessionPin);
        },
        onViewersChanged: setViewers,
        onInput: (event) => ipcClient.remote.sendInput(event),
        onError: (message) => showErrorToast({ title: message }),
      });

      sessionRef.current = session;
      session.start();
      session.setStream(stream);

      // The user stopping the share from the OS overlay has to tear the session down too.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        showInfoToast({ title: 'Screen sharing ended.' });
        stopSharing();
      });

      setIsSharing(true);
    } catch (error) {
      showErrorToast({ title: error instanceof Error ? error.message : 'Could not start screen capture.' });
    }
  }, [selectedSourceId, stopSharing]);

  const toggleControl = useCallback((isAllowed: boolean) => {
    setControlAllowed(isAllowed);
    ipcClient.remote.setControlAllowed(isAllowed);
    sessionRef.current?.setControlAllowed(isAllowed);
  }, []);

  const requestPermissions = useCallback(async () => {
    setPermissions(await ipcClient.remote.requestPermissions());
  }, []);

  return {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    isSharing,
    sessionCode,
    pin,
    controlAllowed,
    toggleControl,
    viewers,
    permissions,
    requestPermissions,
    startSharing,
    stopSharing,
  };
}
