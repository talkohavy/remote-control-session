export function formatSessionCode(sessionCode: string): string {
  return sessionCode.replace(/(\d{3})(?=\d)/g, '$1 ');
}
