# mesh-shadow-paint

[![Live](https://img.shields.io/badge/live-baditaflorin.github.io%2Fmesh--shadow--paint-4DD0E1?style=flat-square)](https://baditaflorin.github.io/mesh-shadow-paint/)
[![Version](https://img.shields.io/github/package-json/v/baditaflorin/mesh-shadow-paint?style=flat-square&color=4DD0E1)](https://github.com/baditaflorin/mesh-shadow-paint/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![No backend](https://img.shields.io/badge/backend-none-050505?style=flat-square)](docs/adr/0001-deployment-mode.md)

> Phones become colored fill lights. One phone is the camera; others show solid hues from different angles.

**Live:** https://baditaflorin.github.io/mesh-shadow-paint/

Open the link on every phone. Pick one as the **camera** (it just stays
black). Set the rest to **lamp** — each one glows a different hue from a
shared 8-color palette. Hold them around your subject at different angles
and shoot with your real camera. Shadows fall in each phone's complementary
color. Tap **Reshuffle palette** on any phone to redistribute hues.

## How it works

1. Each phone joins a shared **Yjs document** over **y-webrtc**.
2. A persistent `peerId` (UUID in `localStorage`) seeds a deterministic
   palette index: `paletteIdx = (hash(peerId) + rotationCounter) mod 8`.
3. The palette is `[0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°]` on the HSL
   hue wheel.
4. The shared `rotationCounter` is a CRDT integer. Reshuffle increments it;
   every phone instantly recomputes its hue from the same formula.

No clock sync, no leader election, no camera/mic permission. See
[ADR 0002](docs/adr/0002-deterministic-color-assignment.md) and
[ADR 0003](docs/adr/0003-no-clock-sync.md).

## Privacy threat model

See [docs/privacy.md](docs/privacy.md). The only payload is role,
timestamp, rotationCounter, and a `localStorage`-persisted peerId.

## Architecture

- **Mode A** — pure GitHub Pages.
- **WebRTC** — Yjs + y-webrtc with self-hosted signaling and TURN.

## Run it locally

```bash
git clone https://github.com/baditaflorin/mesh-shadow-paint.git
cd mesh-shadow-paint
npm install
npm run dev
```

## Self-hosted infrastructure

| Repo                                                                   | Endpoint                               | Role                      |
| ---------------------------------------------------------------------- | -------------------------------------- | ------------------------- |
| [signaling-server](https://github.com/baditaflorin/signaling-server)   | `wss://turn.0docker.com/ws`            | y-webrtc protocol fan-out |
| [turn-token-server](https://github.com/baditaflorin/turn-token-server) | `https://turn.0docker.com/credentials` | HMAC TURN creds           |
| [coturn-hetzner](https://github.com/baditaflorin/coturn-hetzner)       | `turn:turn.0docker.com:3479`           | TURN relay                |

## Settings

- **Room ID** — phones must share one to see each other.
- **Role** — Camera (black screen) / Lamp (solid color).
- **Reshuffle palette** — bumps the shared rotationCounter.

## ADRs

- [0001 — Deployment mode](docs/adr/0001-deployment-mode.md)
- [0002 — Deterministic color assignment](docs/adr/0002-deterministic-color-assignment.md)
- [0003 — No clock sync needed](docs/adr/0003-no-clock-sync.md)
- [0010 — GitHub Pages publishing](docs/adr/0010-pages-publishing.md)

## License

[MIT](LICENSE) © 2026 Florin Badita
