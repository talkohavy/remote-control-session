import { PeerChannels, RemoteProtocol } from '@root/common/constants';
import Peer, { type DataConnection } from 'peerjs';
import { buildPeerOptions } from './logic/peer-options';
import { toPeerId } from './logic/session-code';
import type { ControlMessage, RemoteInputEvent } from '@root/common/types';

type ViewerSessionCallbacks = {
  onStream: (stream: MediaStream) => void;
  onGranted: (controlAllowed: boolean) => void;
  onControlStateChanged: (controlAllowed: boolean) => void;
  onRejected: (reason: string) => void;
  onClosed: () => void;
  onError: (message: string) => void;
};

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

  constructor(private readonly callbacks: ViewerSessionCallbacks) {}

  connect(sessionCode: string, pin: string, viewerName: string): void {
    const peer = new Peer(buildPeerOptions());

    this.peer = peer;

    peer.on('open', () => {
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
        this.control?.send({ type: RemoteProtocol.Hello, pin, viewerName } satisfies ControlMessage);
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

  disconnect(): void {
    this.control?.send({ type: RemoteProtocol.Bye } satisfies ControlMessage);
    this.control?.close();
    this.motion?.close();
    this.peer?.destroy();

    this.control = null;
    this.motion = null;
    this.peer = null;
  }

  private handleControlMessage(message: ControlMessage): void {
    switch (message?.type) {
      case RemoteProtocol.Granted:
        this.callbacks.onGranted(message.controlAllowed);
        break;

      case RemoteProtocol.Rejected:
        this.callbacks.onRejected(message.reason);
        break;

      case RemoteProtocol.ControlState:
        this.callbacks.onControlStateChanged(message.controlAllowed);
        break;

      case RemoteProtocol.Bye:
        this.callbacks.onClosed();
        break;

      default:
        break;
    }
  }
}
