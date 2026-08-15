export const SESSION_CODE_LENGTH = 9;

/**
 * Namespaces our ids on the shared public broker. Without it, a short numeric id could
 * collide with an unrelated app using the same instance.
 */
export const PEER_ID_PREFIX = 'rcs-';

/**
 * How long to wait before declaring the attempt dead. Nothing in WebRTC reports "signalling
 * succeeded but no peer-to-peer path exists" - the connection just never opens - so without
 * a deadline the UI sits on "Connecting..." forever.
 */
export const CONNECT_TIMEOUT_MS = 20_000;

/**
 * A 6-digit PIN is 1,000,000 combinations - trivially brute-force-able over an automated
 * connection if attempts are unlimited. Each viewer gets a small budget and is dropped
 * when it runs out.
 */
export const MAX_PIN_ATTEMPTS = 5;
