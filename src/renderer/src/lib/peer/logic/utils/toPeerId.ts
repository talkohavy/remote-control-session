import { PEER_ID_PREFIX } from '../constants';

export function toPeerId(sessionCode: string): string {
  return `${PEER_ID_PREFIX}${sessionCode}`;
}
