---
status: accepted
date: 2026-05-12
---

# 0002 — Deterministic color assignment

## Context

Each "lamp" phone in `mesh-shadow-paint` needs a hue from a shared palette,
distinct from its neighbors. The natural design instinct is to have a leader
phone hand out colors round-robin, but that adds a single point of failure
and a special-case code path. We want every peer's view of the palette to be
authoritative, with zero coordination overhead beyond what Yjs already gives
us for free.

## Decision

Each peer derives its own hue from a pure function:

```ts
paletteIdx = (hash(peerId) + rotationCounter) mod 8
hue        = PALETTE[paletteIdx]
PALETTE    = [0, 45, 90, 135, 180, 225, 270, 315]   // degrees, evenly spaced
hash       = FNV-1a 32-bit of peerId
peerId     = crypto.randomUUID() persisted to localStorage
```

`rotationCounter` is the only piece of shared state — a single integer in a
Yjs `Y.Map`. Tapping "Reshuffle palette" on any phone increments it; all
phones recompute their hue in lockstep.

## Consequences

- **Pros.** No central assigner. Joining the room is instant — your hue is
  determined the moment your `peerId` is known. Reshuffling is one CRDT
  increment. Every peer arrives at the same conclusion about every other
  peer's color (useful for debug overlays, though we don't render that today).
- **Cons.** With N peers and P=8 palette slots, collisions are inevitable for
  N > 8 (pigeonhole). A reshuffle redistributes but cannot make collisions
  impossible. For the target use case (3–6 phones lighting a subject), this
  is fine.
- **Stability across reloads.** `peerId` is persisted to `localStorage`. If
  the user clears storage, their assignment changes — that's an explicit
  reshuffle for them only, which is harmless.

## Palette

8 colors, 45° apart on the HSL hue wheel at 95% saturation, 55% lightness:

| idx | hue   | rough name |
| --- | ----- | ---------- |
| 0   | 0°    | red        |
| 1   | 45°   | orange     |
| 2   | 90°   | lime       |
| 3   | 135°  | jade       |
| 4   | 180°  | cyan       |
| 5   | 225°  | blue       |
| 6   | 270°  | magenta    |
| 7   | 315°  | pink       |

Evenly spaced so neighboring assignments visually differ even when collisions
push two phones to adjacent slots.

## Alternatives considered

- **Leader-elected round-robin assignment.** Rejected — adds a leader-election
  protocol for what should be a one-line formula.
- **Awareness-based opt-in claiming**, where each peer picks an unclaimed
  slot. Rejected — races on join, no determinism, hard to reshuffle.
- **Yjs `clientID` instead of persisted UUID.** Rejected — `clientID` rotates
  on every reload, so your color would change every time you refresh. The
  persistent UUID gives stable assignments without needing accounts.
