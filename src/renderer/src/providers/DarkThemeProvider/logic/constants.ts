export const ThemeOptions = {
  Dark: 'dark',
  Light: 'light',
} as const;

export type ThemeOptionValues = (typeof ThemeOptions)[keyof typeof ThemeOptions];
