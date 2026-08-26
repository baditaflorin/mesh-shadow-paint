import { expect, test, type Page } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

const PALETTE_HUES = [0, 45, 90, 135, 180, 225, 270, 315];

function hashPeerId(peerId: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < peerId.length; index += 1) {
    hash ^= peerId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function hueForPeer(peerId: string, rotationCounter: number): number {
  const index = (hashPeerId(peerId) + rotationCounter) % PALETTE_HUES.length;
  return PALETTE_HUES[index]!;
}

function hslToRgb(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = l - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;
  if (hue < 60) [red, green, blue] = [chroma, secondary, 0];
  else if (hue < 120) [red, green, blue] = [secondary, chroma, 0];
  else if (hue < 180) [red, green, blue] = [0, chroma, secondary];
  else if (hue < 240) [red, green, blue] = [0, secondary, chroma];
  else if (hue < 300) [red, green, blue] = [secondary, 0, chroma];
  else [red, green, blue] = [chroma, 0, secondary];
  const toRgb = (channel: number) => Math.round((channel + match) * 255);
  return `rgb(${toRgb(red)}, ${toRgb(green)}, ${toRgb(blue)})`;
}

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) await close.click();
  else await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
}

test("one peer rotates the actual shared palette seen by another light panel", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    const peerId = "e2e-shadow-light";
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    await Promise.all(
      [a, b].map((page) =>
        page.evaluate(([prefix, id]) => localStorage.setItem(`${prefix}:peerId`, id), [
          storagePrefix,
          peerId,
        ] as const),
      ),
    );
    await Promise.all([a.reload(), b.reload()]);
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);

    await a.getByRole("button", { name: "Arm light panel" }).click();
    await b.getByRole("button", { name: "Arm light panel" }).click();

    const hue0 = hueForPeer(peerId, 0);
    await expect(a.getByText(`${String(hue0).padStart(3, "0")}°`, { exact: true })).toBeVisible();
    await expect(b.getByText(`${String(hue0).padStart(3, "0")}°`, { exact: true })).toBeVisible();
    await expect(b.locator(".shadow-light-stage")).toHaveCSS(
      "background-color",
      hslToRgb(hue0, 95, 55),
    );

    await a.getByRole("button", { name: "Rotate lighting palette" }).click();

    const hue1 = hueForPeer(peerId, 1);
    expect(hue1).not.toBe(hue0);
    await expect(b.getByText(`${String(hue1).padStart(3, "0")}°`, { exact: true })).toBeVisible();
    await expect(b.locator(".shadow-light-stage")).toHaveCSS(
      "background-color",
      hslToRgb(hue1, 95, 55),
    );
  } finally {
    await cleanup();
  }
});

test("the camera station sees a light panel arrive through the mesh", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);

    await a.evaluate((prefix) => localStorage.setItem(`${prefix}:role`, "camera"), storagePrefix);
    await a.reload();
    await closeInitiallyOpenSettings(a);
    await a.getByRole("button", { name: "Arm camera station" }).click();

    await b.evaluate((prefix) => localStorage.setItem(`${prefix}:role`, "lamp"), storagePrefix);
    await b.reload();
    await closeInitiallyOpenSettings(b);
    await b.getByRole("button", { name: "Arm light panel" }).click();

    await expect(a.getByText(/1 lighting panel in room/i)).toBeVisible();
    await expect(
      a.getByRole("status").filter({ hasText: /1 lighting panels in room/i }),
    ).toBeVisible();
  } finally {
    await cleanup();
  }
});

test("role selection is keyboard-accessible and the arm action remains above the fold", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1141, height: 602 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("./", { waitUntil: "domcontentloaded" });
    await closeInitiallyOpenSettings(page);

    const camera = page.getByRole("button", { name: /camera station/i }).first();
    await camera.focus();
    await page.keyboard.press("Enter");
    await expect(camera).toHaveAttribute("aria-pressed", "true");

    const action = page.getByRole("button", { name: "Arm camera station" });
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box, `missing arm action at ${viewport.width}×${viewport.height}`).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  }
});
