import { PeerChannels, RemoteProtocol } from '@root/common/constants';
import Peer, { type DataConnection } from 'peerjs';
import { CONNECT_TIMEOUT_MS } from './logic/constants';
import { buildPeerOptions } from './logic/utils/peer-options';
import { toPeerId } from './logic/utils/toPeerId';
import type { ControlMessage, DrawStyle, NormalizedPoint, RemoteInputEvent } from '@root/common/types';
import type { ViewerSessionCallbacks } from './types';

/**
 * The controlling end of a session.
 *
 * Opens both data channels, authenticates with the PIN, renders whatever track the host
 * calls with, and ships input back. The channel split is the point of this class: pointer
 * movement goes out unreliably, everything else reliably.
 */
export class ViewerSession {
  private peer: Peer | null = null;
  private control: DataConnection | null = null;
  private motion: DataConnection | null = null;

  /**
   * Which stage was reached, so a failure can name the thing that actually broke. The three
   * stages fail for entirely different reasons and have entirely different fixes.
   */
  private reachedBroker = false;
  private openedChannel = false;
  private answered = false;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly callbacks: ViewerSessionCallbacks) {}

  connect(sessionCode: string, pin: string, viewerName: string): void {
    const peer = new Peer(buildPeerOptions());

    this.peer = peer;
    this.timeout = setTimeout(() => this.reportStalledConnection(), CONNECT_TIMEOUT_MS);

    peer.on('open', () => {
      this.reachedBroker = true;

      const hostPeerId = toPeerId(sessionCode);

      /**
       * Reliable and ordered: the handshake, keystrokes, clicks and wheel. Losing a keyup
       * here would leave a key stuck down on the host.
       */
      this.control = peer.connect(hostPeerId, { label: PeerChannels.Control, reliable: true });

      /**
       * Unreliable and unordered: pointer movement only. A move that arrives late is worse
       * than one that never arrives, so retransmission is actively unwanted.
       */
      this.motion = peer.connect(hostPeerId, { label: PeerChannels.Motion, reliable: false });

      this.control.on('open', () => {
        this.openedChannel = true;
        this.control?.send({ type: RemoteProtocol.Hello, pin, viewerName } satisfies ControlMessage);
      });

      /**
       * `failed` means ICE exhausted every candidate pair without finding a route. Waiting
       * out the full timeout adds nothing once that has happened.
       */
      this.control.on('iceStateChanged', (state) => {
        if (state === 'failed') this.reportStalledConnection();
      });

      this.control.on('data', (data) => this.handleControlMessage(data as ControlMessage));
      this.control.on('close', () => this.callbacks.onClosed());
    });

    /**
     * The host initiates the media call once the PIN checks out, so the viewer answers
     * without offering a track of its own.
     */
    peer.on('call', (call) => {
      call.answer();
      call.on('stream', (stream) => this.callbacks.onStream(stream));
    });

    peer.on('error', (error) => {
      const message =
        error.type === 'peer-unavailable'
          ? 'No host is listening on that code. Check the digits and that the host is still sharing.'
          : error.message;

      this.callbacks.onError(message);
    });

    peer.on('disconnected', () => this.callbacks.onClosed());
  }

  sendInput(event: RemoteInputEvent): void {
    const message = { type: RemoteProtocol.Input, event } as const;

    if (event.type === 'move') {
      this.motion?.send(message);
      return;
    }

    this.control?.send(message);
  }

  /**
   * Annotation strokes all travel on the reliable, ordered channel - unlike cursor
   * movement, a dropped or reordered point leaves a visible kink or gap in the line,
   * which is worse here than the extra latency reliability costs.
   */
  sendDrawStart(strokeId: string, point: NormalizedPoint, style: DrawStyle): void {
    this.control?.send({ type: RemoteProtocol.DrawStart, strokeId, style, ...point } satisfies ControlMessage);
  }

  sendDrawPoint(strokeId: string, point: NormalizedPoint): void {
    this.control?.send({ type: RemoteProtocol.DrawPoint, strokeId, ...point } satisfies ControlMessage);
  }

  sendDrawEnd(strokeId: string): void {
    this.control?.send({ type: RemoteProtocol.DrawEnd, strokeId } satisfies ControlMessage);
  }

  sendDrawClear(): void {
    this.control?.send({ type: RemoteProtocol.DrawClear } satisfies ControlMessage);
  }

  disconnect(): void {
    this.clearTimeout();

    this.control?.send({ type: RemoteProtocol.Bye } satisfies ControlMessage);
    this.control?.close();
    this.motion?.close();
    this.peer?.destroy();

    this.control = null;
    this.motion = null;
    this.peer = null;
  }

  private clearTimeout(): void {
    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = null;
  }

  /**
   * Names the stage that was never reached. Each one has a different cause, and the
   * distinction is invisible from the UI otherwise - all three look like "Connecting...".
   */
  private reportStalledConnection(): void {
    if (this.answered) return;

    this.clearTimeout();

    if (!this.reachedBroker) {
      this.callbacks.onError(
        'Could not reach the signalling server. Check this machine\u2019s internet access, or a proxy blocking WebSocket connections.',
      );
      return;
    }

    if (!this.openedChannel) {
      this.callbacks.onError(
        'Found the host, but could not open a direct connection to it. Both machines are behind a NAT that blocks peer-to-peer traffic - common on corporate and mobile networks, even on the same Wi-Fi. This needs a TURN relay: set VITE_TURN_URLS.',
      );
      return;
    }

    this.callbacks.onError('Connected to the host, but it never answered the handshake.');
  }

  private handleControlMessage(message: ControlMessage): void {
    switch (message?.type) {
      case RemoteProtocol.Granted:
        this.answered = true;
        this.clearTimeout();
        this.callbacks.onGranted(message.controlAllowed, message.captureKind);
        break;

      case RemoteProtocol.Rejected:
        this.answered = true;
        this.clearTimeout();
        this.callbacks.onRejected(message.reason);
        break;

      case RemoteProtocol.ControlState:
        this.callbacks.onControlStateChanged(message.controlAllowed);
        break;

      case RemoteProtocol.Bye:
        this.callbacks.onClosed();
        break;

      case RemoteProtocol.DrawClear:
        this.callbacks.onHostClear();
        break;

      default:
        break;
    }
  }
}
