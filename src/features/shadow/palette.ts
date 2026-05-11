// Deterministic palette mapping. Each peer maps (peerId, rotationCounter) to
// an index into PALETTE_HUES. Increment rotationCounter to reshuffle the room.

export const PALETTE_HUES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

/**
 * Tiny string hash (FNV-1a 32-bit). Stable across browsers and machines.
 * Output is a non-negative 32-bit integer.
 */
export function hashPeerId(peerId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < peerId.length; i++) {
    h ^= peerId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function hueForPeer(peerId: string, rotationCounter: number): number {
  const idx = (hashPeerId(peerId) + rotationCounter) % PALETTE_HUES.length;
  return PALETTE_HUES[idx]!;
}
