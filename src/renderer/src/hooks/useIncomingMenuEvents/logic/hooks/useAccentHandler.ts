import { useCallback } from 'react';
import { showInfoToast } from '@renderer/common/utils/toast';
import { AccentColors } from '@root/common/constants';
import type { AccentPayload } from '@root/common/types';

export function useAccentHandler() {
  const handleAccent = useCallback((payload: AccentPayload) => {
    const hex = AccentColors[payload.accent];

    document.documentElement.style.setProperty('--app-accent', hex);

    showInfoToast({ title: `Accent: ${payload.accent}` });
  }, []);

  return { handleAccent };
}
