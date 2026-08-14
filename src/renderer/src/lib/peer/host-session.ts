import { PeerChannels, RemoteProtocol } from '@root/common/constants';
import Peer, { type DataConnection, type MediaConnection } from 'peerjs';
import { buildPeerOptions } from './logic/peer-options';
import { generateSessionCode, generateSessionPin, toPeerId } from './logic/session-code';
import type { ControlMessage, ConnectedViewer, RemoteInputEvent } from '@root/common/types';

/**
 * A 6-digit PIN is 1,000,000 combinations - trivially brute-forceable over an automated
 * connection if attempts are unlimited. Each viewer gets a small budget and is dropped
 * when it runs out.
 */
const MAX_PIN_ATTEMPTS = 5;

type HostSessionCallbacks = {
  onReady: (sessionCode: string, pin: string) => void;
  onViewersChanged: (viewers: ConnectedViewer[]) => void;
  onInput: (event: RemoteInputEvent) => void;
  onError: (message: string) => void;
};

type ViewerState = {
  peerId: string;
  viewerName: string;
  authenticated: boolean;
  pinAttempts: number;
  control: DataConnection | null;
  motion: DataConnection | null;
  media: MediaConnection | null;
};

/**
 * The sharing end of a session.
 *
 * Holds the peer identity, authenticates arriving viewers, pushes the screen track to
 * them, and forwards their input upward - but only once the local user has granted
 * control. Everything WebRTC-shaped lives here so the page component stays declarative.
 */
export class HostSession {
  private peer: Peer | null = null;
  private stream: MediaStream | null = null;
  private sessionCode = '';
  private pin = '';
  private controlAllowed = false;
  private readonly viewers = new Map<string, ViewerState>();

  constructor(private readonly callbacks: HostSessionCallbacks) {}

  start(): void {
    this.pin = generateSessionPin();
    this.openPeer();
  }

  /**
   * Hands the screen track to the session. Viewers that authenticated before capture
   * started are called immediately, so the order of "share screen" and "viewer connects"
   * does not matter.
   */
  setStream(stream: MediaStream | null): void {
    this.stream = stream;

    if (!stream) return;

    for (const viewer of this.viewers.values()) {
      if (viewer.authenticated && !viewer.media) this.callViewer(viewer);
    }
  }

  setControlAllowed(isAllowed: boolean): void {
    this.controlAllowed = isAllowed;

    const message: ControlMessage = { type: RemoteProtocol.ControlState, controlAllowed: isAllowed };

    for (const viewer of this.viewers.values()) {
      if (viewer.authenticated) viewer.control?.send(message);
    }
  }

  stop(): void {
    for (const viewer of this.viewers.values()) {
      viewer.control?.send({ type: RemoteProtocol.Bye } satisfies ControlMessage);
      viewer.control?.close();
      viewer.motion?.close();
      viewer.media?.close();
    }

    this.viewers.clear();
    this.peer?.destroy();
    this.peer = null;
    this.emitViewers();
  }

  private openPeer(): void {
    this.sessionCode = generateSessionCode();

    const peer = new Peer(toPeerId(this.sessionCode), buildPeerOptions());

    this.peer = peer;

    peer.on('open', () => this.callbacks.onReady(this.sessionCode, this.pin));
    peer.on('connection', (connection) => this.attachConnection(connection));
    peer.on('error', (error) => {
      /**
       * Someone else already holds this code on the broker. Rerolling is the whole
       * recovery: the code is random and short-lived anyway.
       */
      if (error.type === 'unavailable-id') {
        peer.destroy();
        this.openPeer();
        return;
      }

      this.callbacks.onError(error.message);
    });
  }

  private attachConnection(connection: DataConnection): void {
    const viewer = this.viewerFor(connection.peer);

    if (connection.label === PeerChannels.Motion) {
      viewer.motion = connection;
    } else {
      viewer.control = connection;
    }

    connection.on('data', (data) => this.handleData(viewer, connection, data as ControlMessage));
    connection.on('close', () => this.dropViewer(viewer.peerId));
    connection.on('error', () => this.dropViewer(viewer.peerId));
  }

  private handleData(viewer: ViewerState, connection: DataConnection, message: ControlMessage): void {
    if (message?.type === RemoteProtocol.Hello) {
      this.handleHello(viewer, connection, message.pin, message.viewerName);
      return;
    }

    /**
     * Input is only honoured from a viewer that passed the PIN and while the local user has
     * control switched on. The main process enforces the same gate; this is the cheap first
     * line so unauthorised events never even cross the IPC boundary.
     */
    if (message?.type === RemoteProtocol.Input) {
      if (!viewer.authenticated || !this.controlAllowed) return;

      this.callbacks.onInput(message.event);
      return;
    }

    if (message?.type === RemoteProtocol.Bye) {
      this.dropViewer(viewer.peerId);
    }
  }

  private handleHello(viewer: ViewerState, connection: DataConnection, pin: string, viewerName: string): void {
    if (viewer.authenticated) return;

    viewer.viewerName = viewerName || 'Unknown viewer';

    if (pin !== this.pin) {
      viewer.pinAttempts += 1;

      const attemptsLeft = MAX_PIN_ATTEMPTS - viewer.pinAttempts;

      connection.send({
        type: RemoteProtocol.Rejected,
        reason: attemptsLeft > 0 ? `Incorrect PIN. ${attemptsLeft} attempt(s) left.` : 'Too many incorrect attempts.',
      } satisfies ControlMessage);

      if (attemptsLeft <= 0) this.dropViewer(viewer.peerId);

      this.emitViewers();
      return;
    }

    viewer.authenticated = true;

    connection.send({
      type: RemoteProtocol.Granted,
      hostName: 'Host',
      controlAllowed: this.controlAllowed,
    } satisfies ControlMessage);

    if (this.stream) this.callViewer(viewer);

    this.emitViewers();
  }

  private callViewer(viewer: ViewerState): void {
    if (!this.peer || !this.stream) return;

    viewer.media = this.peer.call(viewer.peerId, this.stream);
  }

  private viewerFor(peerId: string): ViewerState {
    const existing = this.viewers.get(peerId);

    if (existing) return existing;

    const created: ViewerState = {
      peerId,
      viewerName: 'Connecting\u2026',
      authenticated: false,
      pinAttempts: 0,
      control: null,
      motion: null,
      media: null,
    };

    this.viewers.set(peerId, created);
    this.emitViewers();

    return created;
  }

  private dropViewer(peerId: string): void {
    const viewer = this.viewers.get(peerId);

    if (!viewer) return;

    viewer.control?.close();
    viewer.motion?.close();
    viewer.media?.close();

    this.viewers.delete(peerId);
    this.emitViewers();
  }

  private emitViewers(): void {
    const viewers = Array.from(this.viewers.values(), ({ peerId, viewerName, authenticated }) => ({
      peerId,
      viewerName,
      authenticated,
    }));

    this.callbacks.onViewersChanged(viewers);
  }
}
