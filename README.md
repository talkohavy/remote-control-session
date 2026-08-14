# Remote Control Session

Cross-platform screen sharing and remote desktop control, built with Electron. One binary
acts as either end of a session: share this machine's screen, or connect to someone else's
and drive their mouse and keyboard.

Works over the internet — no VPN, no port forwarding, no server to run.

```
pnpm install
pnpm dev
```

## How a session works

Pick **Share my screen** on one machine and **Connect to a screen** on the other. The host
shows a 9-digit session code and a 6-digit PIN; the viewer types both in. The screen appears
immediately, but the session is **view-only** until the host flips the "Remote control"
toggle. Nothing can touch the host's machine before that.

```
Host                             Signaling                      Viewer
capture screen                   (PeerJS broker)                enter code + PIN
      |                                 |                              |
      |------------- exchange SDP / ICE candidates -------------------- |
      |                                                                |
      |=========== WebRTC, peer to peer from here on ================== |
      |----- video track (hardware-encoded H.264/VP8) ---------------> render
   inject <---- input: 2 data channels ---------------------------- capture
```

Signaling only brokers the handshake and then drops out of the path. Video and input travel
directly between the two machines.

## Architecture

Three concerns, three places:

| Concern | Where | What it uses |
|---|---|---|
| Screen capture | `src/main/modules/screen-capture` | `desktopCapturer` + `setDisplayMediaRequestHandler` |
| Input injection | `src/main/modules/remote-input` | prebuilt native module (`libnut`) |
| Transport & UI | `src/renderer` | `peerjs` over WebRTC, React 19 |

### Why WebRTC

Chromium already ships the entire WebRTC stack, so `getDisplayMedia()` yields a
hardware-encoded video track for free — no frame loop, no encoder, no bitrate management of
our own. This is the same shape every production remote-desktop tool converges on.

### Why two data channels

Input is split across channels with deliberately different reliability:

- **`control`** — reliable, ordered. Keystrokes, clicks, wheel. Losing a key-up here would
  leave a key stuck down on the host.
- **`motion`** — unreliable, unordered. Pointer movement only. A move that arrives late is
  worse than one that never arrives, so retransmission is actively unwanted.

Sending everything over one reliable channel is the single easiest way to make a remote
session feel laggy: a retransmitted stale mouse move blocks the fresh one behind it.

### Why coordinates are normalised

Pointer positions travel as `0..1` fractions of the screen, not pixels. The viewer's window,
the video element and the host's display all differ in size and DPI scale factor, and a
fraction is the only value that survives all three. The conversion to pixels happens on the
host, against the same native module that receives them.

The viewer also accounts for letterboxing: the video keeps the host's aspect ratio inside a
differently-shaped element, so the blank bars have to be subtracted or the cursor drifts
further off the further it moves from centre.

## Platform support

| Platform | Screen sharing | Remote control | Setup needed |
|---|---|---|---|
| macOS | Yes | Yes | Screen Recording + Accessibility grants |
| Windows | Yes | Yes | None |
| Linux (X11) | Yes | Yes | None |
| Linux (Wayland) | Yes | **No** | See below |

**macOS.** Both grants live in System Settings → Privacy & Security. The app detects what's
missing and offers a button that opens the right pane. Screen Recording usually requires
restarting the app after granting. Note that `hardenedRuntime` is deliberately off in
`electron-builder.yml`: it blocks the input-injection API outright.

**Windows.** Works out of the box. One limitation: without running elevated, injected input
cannot reach windows belonging to elevated processes — they'll appear frozen to the viewer.

**Linux/Wayland.** Capture works through the PipeWire portal, but input injection does not:
the native backend drives X11/XTest, which Wayland doesn't expose. The app detects this and
says so instead of failing silently. Log into an X11 session for full control.

Wayland also changes capture behaviour — enumerating sources opens a portal session the
capture can't reuse, so the app skips its own picker there and lets the portal ask once.

## Configuration

Everything works with no configuration. Two things are worth changing before you rely on it.

**Signaling.** The default is PeerJS's shared public broker: convenient, rate-limited, no
uptime guarantee. Self-host with `npx peerjs --port 9000` and point the app at it:

```
VITE_PEER_HOST=signal.example.com
VITE_PEER_PORT=443
VITE_PEER_SECURE=true
```

**TURN relay.** Only STUN is configured by default, which gets peers through ordinary home
NAT. It does **not** work through symmetric NAT, which is normal on corporate and
mobile-carrier networks — those connections will simply fail. Add a relay:

```
VITE_TURN_URLS=turn:turn.example.com:443,turn:turn.example.com:443?transport=tcp
VITE_TURN_USERNAME=user
VITE_TURN_CREDENTIAL=secret
```

Include the TCP-on-443 variant. On networks that block UDP it's the difference between
connecting and not, because it looks like ordinary HTTPS traffic.

Cloudflare (1 TB/month free) and Metered's Open Relay both work; self-hosted `coturn` is the
no-dependency option.

## Security model

Anyone with the code and PIN can take over the host's machine, so:

- The PIN is required before any input is accepted, and is generated from the crypto RNG.
- Wrong PINs are budgeted — 5 attempts, then the viewer is dropped. Six digits is only a
  million combinations, which is nothing to an automated client given unlimited tries.
- Sessions are view-only until the host explicitly grants control, and revoking it releases
  anything currently held down.
- Input is rate-limited, and the gate is enforced in the main process as well as in the
  renderer, so unauthorised events never reach the injection code.

What this does **not** have, and would need before real-world use: identity for hosts
(nothing stops a viewer from being told the wrong code), an audit trail, and session
expiry. The PIN also travels over the encrypted data channel but is validated by comparison
that isn't constant-time — irrelevant across a network, worth knowing.

## Commands

- `pnpm dev` — run with HMR.
- `pnpm build` — typecheck, then build. `build:mac` / `build:win` / `build:linux` produce
  distributables.
- `pnpm tsc` — typecheck both projects (`tsc:node` for main/preload, `tsc:web` for renderer).
- `pnpm lint` — ESLint. `pnpm format:fix` — Biome over `src/`.

There is no test runner configured.

### Packaging notes

The native input module ships prebuilt N-API binaries, so there is nothing to compile and
`npmRebuild` stays off. All three platform binaries install on every OS, so you can package
for other platforms from one machine.

The binaries are excluded from the asar archive — the loader resolves them by real
filesystem path and cannot read inside an archive.

## Known limitations

- **Primary display only.** Normalised coordinates map to the primary screen, so remote
  control of a secondary monitor won't land where you expect.
- **No audio.** Video track only.
- **No clipboard sharing.**
- **No reconnect.** A dropped session has to be re-established with a fresh code.
