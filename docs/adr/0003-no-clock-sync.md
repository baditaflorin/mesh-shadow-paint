---
status: accepted
date: 2026-05-12
---

# 0003 — No clock sync needed

## Context

Many apps in the `mesh-*` family rely on a mesh clock (see
`mesh-firefly-walk/docs/adr/0002-clock-sync.md`) to keep animations in
lockstep across phones. `mesh-shadow-paint` is different: the lamps just sit
and glow a solid color. There is nothing time-sensitive to coordinate.

## Decision

Do **not** import or initialize `createClockSync()`. Each lamp renders a
static fill; the camera phone renders a static black. The only "event" in
the system is the `rotationCounter` increment, which is a CRDT write and
needs no clock — every peer eventually sees the same value and recomputes its
hue from the deterministic formula.

The user takes the photo with their native camera app, holding the shutter
manually (or using a long-exposure / live-photo mode). No JS-side timing,
no `setTimeout`, no `requestAnimationFrame` for the mechanic.

## Consequences

- **Pros.** Simpler. No Web Audio context dance, no `DeviceMotionEvent`
  permission ritual, no median-offset machinery. Joining is one fewer round.
  Battery cost is essentially the WebRTC heartbeat plus a `setInterval`
  publishing presence every 1.5 s.
- **Cons.** When the photographer says "ok, now," there is no synchronized
  "fire" signal to tell the lamps to flash, strobe, or change color in
  unison. We accept this: the manual-shutter UX is the right primitive for
  this use case. If we later add a synchronized flash mode, it would be a
  separate feature and would justify pulling `clockSync.ts` back in.

## Alternatives considered

- **Mesh-synced flash button**: pressing a button on any phone makes all
  lamps strobe white for N ms. Tempting, but moves us back into the
  shutter-coordination problem and bloats the UX. Filed as a future ADR if
  someone asks.
- **Server-coordinated shutter** with one phone as designated camera-trigger.
  Rejected — see ADR 0002 about avoiding leader roles.
