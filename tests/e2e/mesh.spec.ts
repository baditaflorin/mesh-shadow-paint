import { expect, test, type Page } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) await close.click();
  else await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
}

test("two peers reach the shared Shadow Paint workspace", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    await expect(a.locator("[data-mesh-app-shell]").first()).toBeVisible();
    await expect(b.locator("[data-mesh-app-shell]").first()).toBeVisible();
    await expect(a.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(b.getByRole("heading", { level: 1 }).first()).toBeVisible();
  } finally {
    await cleanup();
  }
});
