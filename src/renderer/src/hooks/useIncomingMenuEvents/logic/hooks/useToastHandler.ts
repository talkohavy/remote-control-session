import { useCallback } from 'react';
import { showInfoToast } from '@renderer/common/utils/toast';
import type { ToastPayload } from '@root/common/types';

export function useToastHandler() {
  const handleToast = useCallback((payload: ToastPayload) => {
    showInfoToast({ title: payload.message });
  }, []);

  return { handleToast };
}
