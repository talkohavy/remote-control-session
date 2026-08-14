import { DEFAULT_STUN_URL } from '@root/common/constants';
import type { PeerOptions } from 'peerjs';

/**
 * Builds the PeerJS configuration from env, falling back to the public broker and public
 * STUN so the app works with no setup at all.
 *
 * Two things are worth knowing before shipping this beyond a demo:
 *
 * - The default broker is PeerJS's shared cloud instance. It is rate limited and carries no
 *   uptime guarantee. Self-host with `npx peerjs --port 9000` and point VITE_PEER_* at it.
 * - STUN alone only gets peers through cone NAT. Symmetric NAT - normal on corporate and
 *   mobile networks - needs a TURN relay, so set VITE_TURN_* for reliable connections.
 */
export function buildPeerOptions(): PeerOptions {
  const iceServers: RTCIceServer[] = [{ urls: DEFAULT_STUN_URL }];

  const turnUrls = import.meta.env.VITE_TURN_URLS?.split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  const turnUsername = import.meta.env.VITE_TURN_USERNAME?.trim();
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL?.trim();

  /**
   * All three or nothing. Chromium refuses to construct an RTCPeerConnection at all when a
   * `turn:` URL arrives without credentials - it throws InvalidAccessError - so a partly
   * filled .env would break every connection on every network, rather than just leaving the
   * relay unavailable. Falling back to STUN-only is always the better failure.
   */
  if (turnUrls?.length && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  const host = import.meta.env.VITE_PEER_HOST;

  return {
    ...(host
      ? {
          host,
          port: Number(import.meta.env.VITE_PEER_PORT ?? 9000),
          path: import.meta.env.VITE_PEER_PATH ?? '/',
          secure: import.meta.env.VITE_PEER_SECURE === 'true',
        }
      : {}),
    config: { iceServers },
  };
}
