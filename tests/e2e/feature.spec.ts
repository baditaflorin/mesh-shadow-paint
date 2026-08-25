import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

// Mirror of src/features/shadow/palette.ts so the test asserts the EXACT hue
// the app must show, not just "something changed".
const PALETTE_HUES = [0, 45, 90, 135, 180, 225, 270, 315];
function hashPeerId(peerId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < peerId.length; i++) {
    h ^= peerId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function hueForPeer(peerId: string, rotationCounter: number): number {
  const idx = (hashPeerId(peerId) + rotationCounter) % PALETTE_HUES.length;
  return PALETTE_HUES[idx]!;
}

/**
 * Load-bearing cross-peer assertion for the advertised core action:
 * "Phones become colored fill lights … Tap Reshuffle palette on any phone to
 * redistribute hues." The shared mesh state is the CRDT `rotationCounter`; each
 * lamp's hue is `hueForPeer(peerId, rotationCounter)`. We drive Reshuffle on
 * peer A and assert peer B's displayed fill hue recomputes to the value the
 * SHARED counter dictates — the hue each phone shows is mesh state.
 *
 * (Both pages share one browser context — required for y-webrtc's
 * BroadcastChannel sync — hence one shared `peerId`, so both lamps start on the
 * same hue. The cross-peer claim under test is that A's reshuffle moves B's hue,
 * which depends ONLY on the shared rotationCounter, not on the peerId.)
 *
 * This fails on any regression that routes the rotationCounter through React
 * useState instead of the Yjs `state` map (or mismatches the read/write key),
 * because peer B reads its own replica and would never see A's reshuffle.
 */
test("peer A's Reshuffle changes peer B's shared lamp hue across the mesh", async ({
  browser,
  baseURL,
}) => {
  const { context, a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    // Pin a deterministic peerId (shared across the one context) so the test
    // asserts the EXACT hue, not just "something changed".
    const peerId = "e2e-peer-0";
    await a.evaluate(([prefix, id]) => localStorage.setItem(`${prefix}:peerId`, id), [
      storagePrefix,
      peerId,
    ] as const);
    await Promise.all([a.reload(), b.reload()]);

    // Both connect as lamps (default role).
    await a.getByRole("button", { name: /connect as lamp/i }).click();
    await b.getByRole("button", { name: /connect as lamp/i }).click();

    // At rotationCounter 0 both lamps show the deterministic hue for this peer.
    const hue0 = hueForPeer(peerId, 0);
    await expect(a.locator(".shadow-hud-lamp")).toContainText(`hue ${hue0}°`);
    await expect(b.locator(".shadow-hud-lamp")).toContainText(`hue ${hue0}°`);
    // Peer B's actual fill background matches that hue.
    await expect(b.locator(".shadow-lamp")).toHaveCSS("background-color", hslToRgb(hue0, 95, 55));

    // Peer A taps Reshuffle → shared rotationCounter goes 0 → 1 over the mesh.
    await a.getByRole("button", { name: /reshuffle palette/i }).click();

    // CROSS-PEER ASSERTION: peer B's displayed hue recomputes to the value the
    // SHARED counter (now 1) dictates — proving the reshuffle crossed the mesh.
    const hue1 = hueForPeer(peerId, 1);
    expect(hue1).not.toBe(hue0);
    await expect(b.locator(".shadow-hud-lamp")).toContainText(`hue ${hue1}°`);
    await expect(b.locator(".shadow-lamp")).toHaveCSS("background-color", hslToRgb(hue1, 95, 55));
  } finally {
    void context;
    await cleanup();
  }
});

/**
 * Cross-peer PRESENCE assertion for the camera role. The README promises one
 * phone is the camera and "sees" the lamps. That count is driven by the shared
 * `phones` Y.Map (each phone republishes `{role, ts}` every 1.5s); the camera
 * tallies fresh lamps. We open A as camera, B as lamp, and assert A's HUD count
 * rises from 0 to 1 — proving B's presence crossed the mesh into A's replica.
 *
 * This complements the hue test: the hue path exercises the `state` map
 * (rotationCounter), this exercises the `phones` map (per-peer presence). A
 * regression in either Y key name is caught by one of the two tests.
 */
test("a camera peer sees a lamp peer appear in its HUD count across the mesh", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    // Role is captured once at App mount from localStorage. localStorage is
    // shared across both pages in one context, so set + reload each peer in
    // turn: A captures "camera" in React state before B flips the key to "lamp".
    await a.evaluate((prefix) => localStorage.setItem(`${prefix}:role`, "camera"), storagePrefix);
    await a.reload();
    await a.getByRole("button", { name: /connect as camera/i }).click();

    await b.evaluate((prefix) => localStorage.setItem(`${prefix}:role`, "lamp"), storagePrefix);
    await b.reload();
    await b.getByRole("button", { name: /connect as lamp/i }).click();

    // Connection timing is intentionally unconstrained: by the time this
    // assertion starts, B can already have published its presence. Assert the
    // durable cross-peer result rather than a transient "waiting" state.
    await expect(a.locator(".shadow-camera .shadow-hud")).toContainText(/1 lamp ready/i);
  } finally {
    await cleanup();
  }
});

// Convert the app's `hsl(h, 95%, 55%)` to the `rgb(r, g, b)` form the browser
// reports for `background-color`, so the CSS assertion is exact.
function hslToRgb(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let bl = 0;
  if (h < 60) [r, g, bl] = [c, x, 0];
  else if (h < 120) [r, g, bl] = [x, c, 0];
  else if (h < 180) [r, g, bl] = [0, c, x];
  else if (h < 240) [r, g, bl] = [0, x, c];
  else if (h < 300) [r, g, bl] = [x, 0, c];
  else [r, g, bl] = [c, 0, x];
  const to255 = (v: number) => Math.round((v + m) * 255);
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(bl)})`;
}
