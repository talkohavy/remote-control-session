import { useEffect, useState } from 'react';
import { ipcClient } from '@renderer/lib/ipc';
import type { CaptureSource, RemotePermissions } from '@root/common/types';

export function useHostPageInit() {
  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<RemotePermissions | null>(null);

  useEffect(() => {
    ipcClient.remote.getPermissions().then(setPermissions);

    ipcClient.capture.listSources().then((available) => {
      setSources(available);
      setSelectedSourceId((current) => current ?? available[0]?.id ?? null);
    });
  }, []);

  return {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    permissions,
    setPermissions,
  };
}
