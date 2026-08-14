import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import { LocalStorageKeys } from '@renderer/common/constants';
import { useLocalStorage } from '@renderer/hooks/useLocalStorage';
import { DarkThemeContext, type DarkThemeContextValue } from './DarkThemeContext';
import { ThemeOptions, type ThemeOptionValues } from './logic/constants';

export default function DarkThemeProvider(props: PropsWithChildren) {
  const { children } = props;

  const [localStorageTheme, setLocalStorageTheme] = useLocalStorage(LocalStorageKeys.Theme);

  // all useStates:
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? ThemeOptions.Dark
      : ThemeOptions.Light;

    const currentTheme = localStorageTheme || deviceTheme;

    document.body.setAttribute('class', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);

    return currentTheme === ThemeOptions.Dark;
  });

  const toggleDarkMode = useCallback(() => {
    const newTheme = isDarkMode ? ThemeOptions.Light : ThemeOptions.Dark;
    const newIsDarkMode = !isDarkMode;

    setLocalStorageTheme(newTheme);

    document.body.setAttribute('class', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    setIsDarkMode(newIsDarkMode);

    return newIsDarkMode;
  }, [isDarkMode, setIsDarkMode, setLocalStorageTheme]);

  const switchTo = useCallback(
    (mode: ThemeOptionValues) => {
      const newIsDarkMode = mode === ThemeOptions.Dark;

      setLocalStorageTheme(mode);

      document.body.setAttribute('class', mode);
      document.documentElement.setAttribute('data-theme', mode);

      setIsDarkMode(newIsDarkMode);

      return newIsDarkMode;
    },
    [setIsDarkMode, setLocalStorageTheme],
  );

  const value = useMemo(() => {
    const _val: DarkThemeContextValue = {
      isDarkMode,
      toggleDarkMode,
      switchTo,
    };

    return _val;
  }, [isDarkMode, toggleDarkMode, switchTo]);

  return <DarkThemeContext.Provider value={value}>{children}</DarkThemeContext.Provider>;
}
