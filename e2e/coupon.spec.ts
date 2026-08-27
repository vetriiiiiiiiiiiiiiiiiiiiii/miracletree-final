import { test, expect, type Page } from "@playwright/test";

/**
 * Coupon restrictions.
 *
 * Every restriction stored against a coupon — who may use it, how often, and on
 * what — was collected in admin and then never read when the code was applied.
 * `FIRSTLEAF` is seeded as "first order only" and used to work for anybody, any
 * number of times. These tests exist so that cannot come back quietly.
 */

/** Puts one product in the bag and lands on the cart page. */
async function bagAndOpenCart(page: Page) {
  await page.goto("/product/moringa-leaf-powder-hpd-dried");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("dialog", { name: "Your bag" })).toBeVisible();
  await page.goto("/cart");
}

/**
 * The coupon message. Scoped to the paragraph rather than `getByRole("alert")`
 * because Next renders its own route announcer with that role on every page.
 */
function couponMessage(page: Page) {
  return page.locator('p[role="alert"], p[role="status"]');
}

async function applyCode(page: Page, code: string) {
  await page.getByLabel("Promo code").fill(code);
  await page.getByRole("button", { name: "Apply" }).click();
}

test.describe("coupons", () => {
  // These run signed out on purpose: a guest is exactly who used to slip past
  // the restriction.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a first-order code is refused to a guest", async ({ page }) => {
    await bagAndOpenCart(page);
    await applyCode(page, "FIRSTLEAF");

    // Anonymous shoppers have no order history to check against, so the code
    // asks for an account rather than letting the restriction be bypassed by
    // simply not signing in.
    await expect(couponMessage(page)).toContainText(/sign in/i);

    // And crucially: no discount was applied.
    await expect(page.getByText(/Discount/i)).toHaveCount(0);
  });

  test("an unrestricted code still applies", async ({ page }) => {
    await bagAndOpenCart(page);
    await applyCode(page, "SHIPFREE");

    // SHIPFREE is appliesTo "all" — the restriction work must not have broken
    // ordinary coupons.
    const summary = page.getByRole("complementary").filter({ hasText: "Summary" });
    await expect(summary.getByText("SHIPFREE")).toBeVisible();
    await expect(summary.getByRole("button", { name: "Remove" })).toBeVisible();

    // Shipping is actually waived, and the nudge to spend more to earn free
    // shipping is gone — the shopper already has it.
    await expect(summary).not.toContainText(/away from free shipping|for free shipping/i);
  });

  test("an unknown code is rejected", async ({ page }) => {
    await bagAndOpenCart(page);
    await applyCode(page, "NOTAREALCODE");
    await expect(couponMessage(page)).toContainText(/recognise/i);
  });
});
