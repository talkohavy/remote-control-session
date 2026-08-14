export const AccentColors = {
  blue: '#3b82f6',
  emerald: '#10b981',
  pink: '#ec4899',
  amber: '#f59e0b',
} as const;

type TypeOfAccentColors = typeof AccentColors;
export type AccentColorKeys = keyof TypeOfAccentColors;
export type AccentColorValues = TypeOfAccentColors[AccentColorKeys];
