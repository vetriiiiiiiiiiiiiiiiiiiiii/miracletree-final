import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * The ritual builder.
 *
 * The assertion that matters most is the last one: the total the builder quotes
 * and the total the bag charges have to be the same number. A page that lets a
 * shopper assemble several items at a running total is exactly where a
 * client-computed price would go unnoticed.
 */

test.describe("ritual builder", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /** Selects the first in-stock choice in the nth step and returns its price. */
  async function pick(page: Page, stepIndex: number) {
    const step = page.locator("section[aria-labelledby^='step-']").nth(stepIndex);
    const choice = step.getByRole("button").filter({ hasNot: page.locator("[disabled]") }).first();
    const text = await choice.textContent();
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    return text ?? "";
  }

  test("builds a ritual and the quoted total is what the bag charges", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "captured on desktop");
    mkdirSync("shots", { recursive: true });

    await page.goto("/ritual");
    await expect(page.getByRole("heading", { name: /A day around the tree/i })).toBeVisible();

    const summary = page.getByRole("complementary");
    await expect(summary.getByText(/Nothing chosen yet/i)).toBeVisible();

    // Three steps: enough to clear the promotion's minimum.
    await pick(page, 0);
    await pick(page, 1);
    await pick(page, 2);

    // The running summary now lists three lines and a total.
    await expect(summary.getByText("Subtotal")).toBeVisible();
    const quotedTotal = await summary
      .locator("dl div")
      .last()
      .locator("dd")
      .textContent();
    expect(quotedTotal, "a total is quoted").toBeTruthy();

    // Product photography is lazy-loaded; without this the capture is of empty
    // cream tiles and tells you nothing about how the page actually looks.
    await page.waitForLoadState("networkidle");
    const loaded = await page.evaluate(() =>
      [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth > 0).length,
    );
    expect(loaded, "product photography actually loads").toBeGreaterThan(3);

    await page.screenshot({ path: "shots/ritual.png", fullPage: false });

    await summary.getByRole("button", { name: /Add all 3 to bag/i }).click();

    // The bag opens with all three in it.
    const drawer = page.getByRole("dialog", { name: "Your bag" });
    await expect(drawer).toBeVisible();
    await expect(page.getByRole("button", { name: /Open bag, 3 items/ })).toBeVisible();

    // And the number the builder promised is the number the bag charges. This
    // is the assertion that would catch a client-side total drifting from the
    // server's, and the discount being quoted but never applied.
    await expect(drawer.getByText(quotedTotal!.trim(), { exact: false }).first()).toBeVisible();
  });

  test("every step can be skipped", async ({ page }) => {
    await page.goto("/ritual");

    const summary = page.getByRole("complementary");
    const add = summary.getByRole("button", { name: /Choose something first/i });
    await expect(add).toBeDisabled();

    // One pick enables it; unpicking the same one disables it again, so a step
    // is genuinely optional rather than merely re-selectable.
    const step = page.locator("section[aria-labelledby^='step-']").first();
    const choice = step.getByRole("button").first();
    await choice.click();
    await expect(summary.getByRole("button", { name: /Add it to bag/i })).toBeEnabled();

    await choice.click();
    await expect(summary.getByRole("button", { name: /Choose something first/i })).toBeDisabled();
  });
});
