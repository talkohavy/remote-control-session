/** Strips grouping spaces and dashes so users can type the code as they see it. */
export function normalizeSessionCode(input: string): string {
  return input.replace(/\D/g, '');
}
