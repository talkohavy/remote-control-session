import type { AccentColorKeys, MenuCommandValues } from '../constants';

export type MenuCommandMessage<T = any> = {
  type: MenuCommandValues;
  payload?: T;
};

export type MenuCommandSender = <T = any>(command: MenuCommandMessage<T>) => void;

export type NavigatePayload = {
  to: string;
};

export type AccentPayload = {
  accent: AccentColorKeys;
};

export type ToastPayload = {
  message: string;
  emoji?: string;
};

export type ToggleThemePayload = {
  isDarkMode: boolean;
};

export type NavigateCommand = Required<MenuCommandMessage<NavigatePayload>>;
export type AccentCommand = Required<MenuCommandMessage<AccentPayload>>;
export type ToastCommand = Required<MenuCommandMessage<ToastPayload>>;
export type ToggleThemeCommand = Required<MenuCommandMessage<ToggleThemePayload>>;

export type ContextMenuRequest = {
  x: number;
  y: number;
  /** Selected text under the cursor, if any - lets us tailor the menu. */
  selectionText?: string;
  isDarkMode: boolean;
};
