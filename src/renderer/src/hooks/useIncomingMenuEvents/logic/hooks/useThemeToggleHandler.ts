import { useCallback } from 'react';
import { showInfoToast } from '@renderer/common/utils/toast';
import { ThemeOptions, useDarkTheme } from '@renderer/providers/DarkThemeProvider';
import type { ToggleThemePayload } from '@root/common/types';

export function useThemeToggleHandler() {
  const { switchTo } = useDarkTheme();

  const handleToggleTheme = useCallback(
    (payload: ToggleThemePayload) => {
      const { isDarkMode } = payload;

      const mode = isDarkMode ? ThemeOptions.Light : ThemeOptions.Dark;
      switchTo(mode);

      showInfoToast({ title: `${mode} mode` });
    },
    [switchTo],
  );

  return { handleToggleTheme };
}
