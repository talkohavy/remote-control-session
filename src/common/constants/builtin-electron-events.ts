export const ElectronEvents = {
  WindowAllClosed: 'window-all-closed',
  BrowserWindowCreated: 'browser-window-created',
  Activate: 'activate',
  Quit: 'quit',
} as const;

export type ElectronEventValues = (typeof ElectronEvents)[keyof typeof ElectronEvents];
