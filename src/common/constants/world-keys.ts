export const WorldKeys = {
  Api: 'api',
  Electron: 'electron',
} as const;

export type WorldKeyValues = (typeof WorldKeys)[keyof typeof WorldKeys];
