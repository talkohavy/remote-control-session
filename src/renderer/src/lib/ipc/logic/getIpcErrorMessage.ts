/**
 * Electron rethrows a main-process error in the renderer wrapped in its own prose:
 * `Error invoking remote method 'tasks:create': Error: A task needs a title.`
 *
 * This peels that off so a validation message thrown in a service can be shown to the
 * user as-is.
 */
export function getIpcErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) return fallbackMessage;

  const [, unwrappedMessage] = error.message.split(/Error invoking remote method '[^']+':\s*Error:\s*/);

  return (unwrappedMessage ?? error.message).trim() || fallbackMessage;
}
