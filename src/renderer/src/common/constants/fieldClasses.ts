/**
 * Shared Tailwind class strings for the plain form controls, so a text input and a
 * select stay visually identical without wrapping either in a component.
 */
export const FIELD_CLASS_NAME =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-gray-500';

export const PRIMARY_BUTTON_CLASS_NAME =
  'w-fit cursor-pointer rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50';

export const SUBTLE_BUTTON_CLASS_NAME =
  'w-fit cursor-pointer rounded-full border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700';

export const DANGER_BUTTON_CLASS_NAME =
  'w-fit cursor-pointer rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50';

export const LABEL_CLASS_NAME = 'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500';
