export const WindowEvents = {
  ReadyToShow: 'ready-to-show',
} as const;

export type WindowEventValues = (typeof WindowEvents)[keyof typeof WindowEvents];
