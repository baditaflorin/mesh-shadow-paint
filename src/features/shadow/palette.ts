// Deterministic palette mapping. Each peer maps (peerId, rotationCounter) to
// an index into PALETTE_HUES. Increment rotationCounter to reshuffle the room.

export const PALETTE_HUES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

type PaletteHue = (typeof PALETTE_HUES)[number];

/** Human labels make the lighting state useful at a glance while the hue stays deterministic. */
export const LIGHT_TONES = {
  0: { hue: 0, name: "Crimson", direction: "Warm edge light" },
  45: { hue: 45, name: "Amber", direction: "Soft key light" },
  90: { hue: 90, name: "Citrine", direction: "Bright fill light" },
  135: { hue: 135, name: "Verdant", direction: "Cool edge light" },
  180: { hue: 180, name: "Cyan", direction: "Clean fill light" },
  225: { hue: 225, name: "Cobalt", direction: "Deep contour light" },
  270: { hue: 270, name: "Violet", direction: "Low-key accent light" },
  315: { hue: 315, name: "Orchid", direction: "Soft contour light" },
} as const satisfies Record<PaletteHue, { hue: PaletteHue; name: string; direction: string }>;

export type LightTone = (typeof LIGHT_TONES)[PaletteHue];

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

export function lightToneForHue(hue: number): LightTone {
  return LIGHT_TONES[hue as PaletteHue] ?? LIGHT_TONES[0];
}
