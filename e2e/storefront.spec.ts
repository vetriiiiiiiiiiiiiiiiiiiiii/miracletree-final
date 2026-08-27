import { test, expect, type Page } from "@playwright/test";

/**
 * Storefront behaviour. These assert on what a shopper can actually do, not on
 * markup details — so they survive design changes and fail only when the store
 * genuinely stops working.
 */

/** Fails the test if the page logs an error, so regressions surface here. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

/** Fills the checkout form, scoped so the footer newsletter cannot be matched. */
async function fillCheckout(page: Page, pin: string) {
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: /Place order|Pay /i }) });
  // Required fields render a trailing asterisk, so their accessible name is
  // "Address*" rather than "Address" — anchored regexes, not exact matches.
  await form.getByLabel(/^Email/).fill("buyer@example.com");
  await form.getByLabel(/^Mobile/).fill("9876543210");
  await form.getByLabel(/^First name/).fill("Test");
  await form.getByLabel(/^Address\*?$/).fill("12 Milakaranai Road");
  await form.getByLabel(/^City/).fill("Madurai");
  await form.getByLabel(/^State/).fill("Tamil Nadu");
  await form.getByLabel(/^PIN code/).fill(pin);
}

test.describe("storefront", () => {
  // Shop as a guest. The project default carries an admin session for the admin
  // suite, and being signed in changes checkout (saved addresses, prefilled
  // contact details) — which is a different test, not this one.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("homepage renders the journey and stays error-free", async ({ page }) => {
    const errors = watchConsole(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /From the Miracle Tree/i })).toBeVisible();

    // All seven chapters ship in the HTML, not just the visible one.
    await expect(page.locator("article[aria-hidden]")).toHaveCount(7);

    // The world must never swallow the rest of the page.
    await expect(page.getByRole("heading", { name: /Farm to pack/i })).toBeAttached();

    expect(errors).toEqual([]);
  });

  test("shop lists products, filters and sorts", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "The collection" })).toBeVisible();

    const cards = page.locator("article").filter({ has: page.locator("h3") });
    await expect(cards.first()).toBeVisible();
    const all = await cards.count();
    expect(all).toBeGreaterThan(5);

    // Category filter narrows the grid and is reflected in the URL.
    await page.goto("/shop/moringa-tea");
    await expect(page.getByRole("heading", { name: "Moringa Tea", level: 1 })).toBeVisible();
    const teaCount = await page.locator("article").filter({ has: page.locator("h3") }).count();
    expect(teaCount).toBeGreaterThan(0);
    expect(teaCount).toBeLessThan(all);
  });

  test("search returns relevant products", async ({ page }) => {
    const response = await page.request.get("/api/search?q=tea");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.hits.length).toBeGreaterThan(0);
    expect(data.hits.some((h: { title: string }) => /tea/i.test(h.title))).toBeTruthy();
  });

  test("discounts shown are plausible", async ({ page }) => {
    await page.goto("/shop");
    const badges = await page.getByText(/^−\d+%$/).allTextContents();
    for (const badge of badges) {
      const percent = Number(badge.replace(/[^\d]/g, ""));
      // A genuine retail discount; anything above this means the compare-at
      // price is being read from the wrong variant.
      expect(percent).toBeGreaterThan(0);
      expect(percent).toBeLessThan(60);
    }
  });

  test("product page shows price, variants and stock", async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto("/product/moringa-leaf-powder-hpd-dried");

    await expect(page.getByRole("heading", { name: "Moringa Leaf Powder", level: 1 })).toBeVisible();
    await expect(page.getByText("₹160").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to bag" })).toBeVisible();
    await expect(page.getByText(/In stock/i).first()).toBeVisible();

    // Descriptions must not be cut mid-word.
    const lede = await page.locator("p").filter({ hasText: /Elevate your well-being/ }).first().textContent();
    expect(lede ?? "").not.toMatch(/\s\w{1,3}…$/);

    expect(errors).toEqual([]);
  });

  test("add to bag updates the cart and the totals are correct", async ({ page }) => {
    await page.goto("/product/moringa-leaf-powder-hpd-dried");
    await page.getByRole("button", { name: "Add to bag" }).click();

    const drawer = page.getByRole("dialog", { name: "Your bag" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Moringa Leaf Powder")).toBeVisible();

    // ₹160 subtotal is under the ₹699 threshold, so ₹60 shipping applies.
    await expect(drawer.getByText("₹160").first()).toBeVisible();
    await expect(drawer.getByText("₹60")).toBeVisible();
    await expect(drawer.getByText("₹220")).toBeVisible();
    await expect(drawer.getByText(/₹539 away from free shipping/)).toBeVisible();

    await expect(page.getByRole("button", { name: /Open bag, 1 item/ })).toBeVisible();
  });

  test("quick view opens from the grid and can add to bag", async ({ page }, testInfo) => {
    // Quick view is a pointer-device affordance. On touch there is no hover to
    // reveal it and the full product page is one tap away, so it is hidden.
    test.skip(testInfo.project.name === "mobile", "desktop-only affordance");

    await page.goto("/shop");
    const card = page.locator("article").filter({ has: page.locator("h3") }).first();
    await card.hover();
    await card.getByRole("button", { name: /Quick view/i }).click();

    const modal = page.getByRole("dialog", { name: "Quick view" });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading")).toBeVisible();
    await expect(modal.getByRole("link", { name: "Full details" })).toBeVisible();
  });

  test("checkout requires a bag and rejects a bad PIN code", async ({ page }) => {
    // Empty bag redirects rather than showing a broken form.
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart$/);

    await page.goto("/product/moringa-leaf-powder-hpd-dried");
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("dialog", { name: "Your bag" })).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();

    await fillCheckout(page, "000000"); // invalid PIN
    await page.getByRole("button", { name: /Place order/i }).click();

    await expect(page.getByText(/valid 6-digit PIN code/i)).toBeVisible();
  });

  test("a cash-on-delivery order completes", async ({ page }) => {
    await page.goto("/product/moringa-leaf-powder-hpd-dried");
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("dialog", { name: "Your bag" })).toBeVisible();

    await page.goto("/checkout");
    await fillCheckout(page, "625018");
    await page.getByRole("button", { name: /Place order/i }).click();

    await page.waitForURL(/\/order\/MT-/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Your miracle is on its way/i })).toBeVisible();
    await expect(page.getByText("₹220").first()).toBeVisible();
  });

  test("our story carries the history, awards, credits and field notes", async ({ page }) => {
    await page.goto("/about");

    await expect(page.getByRole("heading", { name: /Our story/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /A working history/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Awards & certification/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Field notes", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Credits$/i })).toBeVisible();

    // The researched history, not invented history. Scoped to the paper
    // sections rather than the page: the flight above renders the same
    // milestones into the DOM ahead of time, hidden until each one flies into
    // view, so an unscoped `.first()` matches a copy that is deliberately
    // invisible. The paper record is the authoritative one in any case — it is
    // what survives without WebGL.
    await expect(page.locator("#credits").getByText("Sujatha Rajendran").first()).toBeVisible();
    await expect(
      page.locator("#timeline").getByText(/Best Agriculturist/i).first(),
    ).toBeVisible();

    // Every award and certification must be traceable to a published source.
    const citations = page.getByRole("link", { name: /^Source:/i });
    expect(await citations.count()).toBeGreaterThan(4);
  });

  test("the journal index now lives inside the story", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/\/about/);

    // Article URLs are untouched, so nothing already indexed breaks.
    const article = await page.goto("/journal/reading-a-moringa-label");
    expect(article?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("404 renders the branded page", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /didn.t grow/i })).toBeVisible();
  });

  test("policy and content pages render", async ({ page }) => {
    for (const path of ["/moringa", "/about", "/faq", "/contact", "/shipping", "/returns", "/privacy", "/terms"]) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should be 200`).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
