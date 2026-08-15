import { SESSION_PIN_LENGTH } from '@root/common/constants';
import { randomDigits } from './randomDigits';

export function generateSessionPin(): string {
  return randomDigits(SESSION_PIN_LENGTH);
}
