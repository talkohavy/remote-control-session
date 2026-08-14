/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** PeerJS broker host. Unset uses PeerJS's public cloud broker. */
  readonly VITE_PEER_HOST?: string;
  readonly VITE_PEER_PORT?: string;
  readonly VITE_PEER_PATH?: string;
  readonly VITE_PEER_SECURE?: string;

  /**
   * TURN relay. Without one, peers behind symmetric NAT (common on corporate and
   * mobile-carrier networks) cannot connect at all - STUN alone is not enough there.
   */
  readonly VITE_TURN_URLS?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
