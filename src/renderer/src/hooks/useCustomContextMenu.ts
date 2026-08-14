import { useEffect } from 'react';
import { ipcClient } from '@renderer/lib/ipc';
import { useDarkTheme } from '../providers/DarkThemeProvider';

export function useCustomContextMenu() {
  const { isDarkMode } = useDarkTheme();

  // Replace the browser's default context menu with our native one.
  useEffect(() => {
    const onContextMenu = (event: MouseEvent): void => {
      event.preventDefault();

      ipcClient.menu.showContextMenu({
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        selectionText: window.getSelection()?.toString() ?? '',
        isDarkMode,
      });
    };

    window.addEventListener('contextmenu', onContextMenu);

    return () => window.removeEventListener('contextmenu', onContextMenu);
  }, [isDarkMode]);
}
