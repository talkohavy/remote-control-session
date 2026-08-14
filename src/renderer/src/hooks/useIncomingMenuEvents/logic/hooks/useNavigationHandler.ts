import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { showInfoToast } from '@renderer/common/utils/toast';
import type { NavigatePayload } from '@root/common/types';

export function useNavigationHandler() {
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (payload: NavigatePayload) => {
      navigate(payload.to);

      showInfoToast({ title: `Navigated to ${payload.to}` });
    },
    [navigate],
  );

  return { handleNavigate };
}
