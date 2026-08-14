import { SESSION_PIN_LENGTH } from '@root/common/constants';

const SESSION_CODE_LENGTH = 9;

/**
 * Namespaces our ids on the shared public broker. Without it, a short numeric id could
 * collide with an unrelated app using the same instance.
 */
const PEER_ID_PREFIX = 'rcs-';

/**
 * Digits from the crypto RNG rather than Math.random. The session code is guessable by
 * design (it is read aloud), but the PIN is a credential guarding control of a machine, so
 * it must not come from a predictable source.
 */
function randomDigits(length: number): string {
  const bytes = new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => String(byte % 10)).join('');
}

/** The short code a host reads out. Shown grouped, transmitted bare. */
export function generateSessionCode(): string {
  return randomDigits(SESSION_CODE_LENGTH);
}

export function generateSessionPin(): string {
  return randomDigits(SESSION_PIN_LENGTH);
}

export function toPeerId(sessionCode: string): string {
  return `${PEER_ID_PREFIX}${sessionCode}`;
}

/** Strips grouping spaces and dashes so users can type the code as they see it. */
export function normalizeSessionCode(input: string): string {
  return input.replace(/\D/g, '');
}

export function formatSessionCode(sessionCode: string): string {
  return sessionCode.replace(/(\d{3})(?=\d)/g, '$1 ');
}
