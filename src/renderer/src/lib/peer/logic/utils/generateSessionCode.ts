import { SESSION_CODE_LENGTH } from '../constants';
import { randomDigits } from './randomDigits';

export function generateSessionCode(): string {
  return randomDigits(SESSION_CODE_LENGTH);
}
