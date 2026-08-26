# Shadow Paint

[![Live](https://img.shields.io/badge/live-Shadow%20Paint-d8ba75?style=flat-square)](https://baditaflorin.github.io/mesh-shadow-paint/)
[![Version](https://img.shields.io/github/package-json/v/baditaflorin/mesh-shadow-paint?style=flat-square&color=d8ba75)](https://github.com/baditaflorin/mesh-shadow-paint/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![No backend](https://img.shields.io/badge/backend-none-15111b?style=flat-square)](docs/adr/0001-deployment-mode.md)

> A shared lighting studio: turn nearby phones into deliberate fill panels, keep one station dark, and shape a photograph’s shadows together.

**Live:** [baditaflorin.github.io/mesh-shadow-paint](https://baditaflorin.github.io/mesh-shadow-paint/)

Shadow Paint is a browser-local coordination tool for a practical physical setup. One device becomes a **camera station** and stays low-light beside the native camera. Every other device becomes a **light panel** with a deterministic hue from the same shared palette. No photos, camera stream, or media leave the device.

## Make a lighting setup

1. Open the same room on every phone.
2. Choose **Camera station** for the device beside the real camera.
3. Choose **Light panel** for the devices around the subject, then arm them.
4. Aim each panel from a different edge of the frame.
5. Use **Rotate lighting palette** on any armed device for a new shared pass.

The first view makes the device role and arm action explicit. The camera station never asks for a camera permission; it is a dark, live presence monitor. Light panels are intentionally bright, because they are the physical output.

## What synchronizes

- A Yjs document over y-webrtc carries device roles and a shared `rotationCounter`.
- Each persistent local `peerId` maps to a stable hue: `(hash(peerId) + rotationCounter) mod 8`.
- A role heartbeat provides the honest count of fresh light panels in the room.
- Rotating the palette increments the CRDT counter, so every panel recomputes at once without an elected host or clock sync.

The fixed palette is `0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°`. Human labels such as Amber, Cyan, and Cobalt only describe that deterministic state; they do not add a second source of truth.

## Privacy and security

Shadow Paint has no application backend, account system, media upload, or camera/microphone access. The shared payload is limited to role, timestamp, palette rotation, and a local device identifier used to choose a hue.

- [Privacy notes](docs/privacy.md)
- [Security policy](SECURITY.md)
- [Programmatic security audit](docs/security-audit.md) — regenerate with `npm run audit:security`

## Run locally

Clone `mesh-common` as a sibling, then install both workspaces:

```bash
git clone https://github.com/baditaflorin/mesh-common.git
git clone https://github.com/baditaflorin/mesh-shadow-paint.git
cd mesh-common && npm ci
cd ../mesh-shadow-paint && npm ci
npm run dev
```

## Validation

```bash
npm run fmt:check
npm run typecheck
npm run test
npm run smoke
npm run audit:security
```

The browser suite includes a real two-peer palette rotation, camera-to-light presence, keyboard role selection, and first-viewport contracts at `390×844` and `1141×602`.

## Architecture

- **Static deployment:** GitHub Pages from `main/docs`.
- **Coordination:** Yjs + y-webrtc with self-hosted signaling and TURN credentials.
- **State ownership:** browser-local storage and peer-to-peer CRDT updates only.

## Design records

- [0001 — Deployment mode](docs/adr/0001-deployment-mode.md)
- [0002 — Deterministic color assignment](docs/adr/0002-deterministic-color-assignment.md)
- [0003 — No clock sync needed](docs/adr/0003-no-clock-sync.md)
- [0010 — GitHub Pages publishing](docs/adr/0010-pages-publishing.md)

## License

MIT © 2026 Florin Badita
