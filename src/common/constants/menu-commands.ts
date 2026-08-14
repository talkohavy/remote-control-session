export const MenuCommands = {
  Accent: 'accent',
  Navigate: 'navigate',
  Toast: 'toast',
  ToggleTheme: 'toggle-theme',
} as const;

export type MenuCommandValues = (typeof MenuCommands)[keyof typeof MenuCommands];
