import { createContext, useContext } from 'react';
import type { ThemeOptionValues } from './logic/constants';

export type DarkThemeContextValue = {
  isDarkMode: boolean;
  /**
   * @returns The new state it toggles to.
   */
  toggleDarkMode: () => boolean;
  switchTo: (mode: ThemeOptionValues) => boolean;
};

const INITIAL_STATE = {} as DarkThemeContextValue;

export const DarkThemeContext = createContext<DarkThemeContextValue>(INITIAL_STATE);
export const useDarkTheme = () => useContext(DarkThemeContext);
