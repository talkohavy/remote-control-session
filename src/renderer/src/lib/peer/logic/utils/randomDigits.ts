export function randomDigits(length: number): string {
  const bytes = new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => String(byte % 10)).join('');
}
