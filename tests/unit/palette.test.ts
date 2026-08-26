import { describe, expect, it } from "vitest";
import { hueForPeer, lightToneForHue, PALETTE_HUES } from "../../src/features/shadow/palette";

describe("Shadow Paint palette", () => {
  it("assigns one stable palette hue for a peer and rotation", () => {
    expect(hueForPeer("studio-device-a", 0)).toBe(hueForPeer("studio-device-a", 0));
    expect(PALETTE_HUES).toContain(hueForPeer("studio-device-a", 0));
    expect(hueForPeer("studio-device-a", 1)).not.toBe(hueForPeer("studio-device-a", 0));
  });

  it("exposes a human-readable label for every deterministic hue", () => {
    for (const hue of PALETTE_HUES) {
      const tone = lightToneForHue(hue);
      expect(tone.hue).toBe(hue);
      expect(tone.name.length).toBeGreaterThan(0);
      expect(tone.direction.length).toBeGreaterThan(0);
    }
  });
});
