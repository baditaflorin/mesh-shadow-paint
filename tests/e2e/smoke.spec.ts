import { expect, test, type Locator, type Page } from "@playwright/test";
import { captureConsoleErrors } from "@baditaflorin/mesh-common/testing";

function settingsDialog(page: Page): Locator {
  return page.getByRole("dialog", { name: "Settings" });
}

async function isVisible(locator: Locator): Promise<boolean> {
  return locator.isVisible().catch(() => false);
}

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const dialog = settingsDialog(page);
  if (!(await isVisible(dialog))) return;
  const close = dialog.getByRole("button", { name: "close" });
  if (await isVisible(close)) await close.click();
  else await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

async function openSettings(page: Page): Promise<Locator> {
  const dialog = settingsDialog(page);
  if (await isVisible(dialog)) return dialog;
  await page.getByLabel("Open settings").click();
  await expect(dialog).toBeVisible();
  return dialog;
}

test("the polished first screen loads without application errors", async ({ page }) => {
  const consoleErrors = captureConsoleErrors(page);
  await page.goto("./");
  await closeInitiallyOpenSettings(page);

  await expect(page.getByRole("heading", { name: /shape the shadow/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Arm light panel" })).toBeVisible();

  await page.waitForTimeout(800);
  const actionableErrors = consoleErrors
    .getErrors()
    .filter(
      (error) =>
        !/turn|stun|signaling|websocket|webrtc|failed to load resource|err_failed|err_connection|err_blocked|err_name_not_resolved/i.test(
          error,
        ),
    );
  expect(actionableErrors, actionableErrors.join("\n")).toHaveLength(0);
});

test("settings retains transparent product and infrastructure details", async ({ page }) => {
  await page.goto("./");
  const drawer = await openSettings(page);
  await expect(drawer.getByRole("link", { name: /^source$/i })).toBeVisible();
  await expect(drawer.getByRole("link", { name: /^support$/i })).toBeVisible();
  await expect(drawer.getByText(/^v\d/).first()).toBeVisible();
  await expect(drawer.getByText(/Self-hosted infra/i)).toBeVisible();
  await expect(drawer.getByText(/Signaling URL/i)).toBeVisible();
  await expect(drawer.getByText(/TURN credentials URL/i)).toBeVisible();
});
