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

  test("homepage hero fits one screen and stays error-free", async ({ page }) => {
    const errors = watchConsole(page);

    await page.goto("/");

    // The hero carries the page's only h1. It had none at all when the scene
    // was a scroll journey and every chapter title was an h2.
    const heading = page.getByRole("heading", { level: 1, name: /From the Miracle Tree/i });
    await expect(heading).toBeVisible();

    // Both calls to action and the credentials are readable without scrolling.
    // The scene used to be a 2.4-screen journey, which taxed every repeat
    // visitor before they could reach a product; this is the guard against it
    // quietly growing back.
    // The headline and both calls to action must be readable without scrolling
    // at every size. The credential strip is held to the same rule on desktop
    // only: on a 390px phone the hero also carries a product photograph, and
    // demanding all four fit would mean shrinking the products to nothing.
    const viewport = page.viewportSize()!;
    const mustFit = [
      page.getByRole("link", { name: /Shop the range/i }),
      page.getByRole("link", { name: /What we developed/i }),
      ...(viewport.width >= 1024 ? [page.getByText("Working with moringa since")] : []),
    ];
    for (const locator of mustFit) {
      const box = await locator.first().boundingBox();
      expect(box, "hero element is rendered").not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    }

    // The hero must never swallow the rest of the page.
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

  test("a guest order is not readable by anyone who guesses its number", async ({
    page,
    browser,
  }) => {
    await page.goto("/product/moringa-leaf-powder-hpd-dried");
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("dialog", { name: "Your bag" })).toBeVisible();

    await page.goto("/checkout");
    await fillCheckout(page, "625018");
    await page.getByRole("button", { name: /Place order/i }).click();
    await page.waitForURL(/\/order\/MT-/, { timeout: 30_000 });

    const orderNumber = page.url().split("/order/")[1]!.split("?")[0]!;
    // The browser that placed it still sees it.
    await expect(page.getByText(orderNumber).first()).toBeVisible();

    // Order numbers are sequential, so a stranger holding one must get nothing.
    // This is the regression guard for an earlier version that treated any
    // order without a userId as public and leaked the whole guest order book.
    const stranger = await browser.newContext();
    const strangerPage = await stranger.newPage();
    const response = await strangerPage.goto(`/order/${orderNumber}`);
    expect(response?.status()).toBe(404);

    // Assert on details unique to THIS buyer. The footer carries the company's
    // own address and email on every page, 625018 included, so those strings
    // prove nothing either way.
    const body = await strangerPage.content();
    expect(body).not.toContain("12 Milakaranai Road");
    expect(body).not.toContain("buyer@example.com");
    expect(body).not.toContain("9876543210");
    await stranger.close();
  });

  test("the gallery renders the company's own photographs", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Real files, not placeholders. The path is matched unencoded because
    // next/image rewrites it to /_next/image?url=%2Fphotos%2F… — a selector
    // looking for a literal "/photos/" matches nothing.
    const images = page.locator('main img[src*="photos"]');
    expect(await images.count()).toBeGreaterThan(10);

    // The captions the company supplied are attached to the visitor photos.
    await expect(page.getByText(/Farmers visiting Miracle Tree Life Science/i)).toBeVisible();

    // The lightbox opens and closes without trapping the page.
    await page.locator("main figure button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("guests can track an order with its number and email", async ({ page }) => {
    await page.goto("/track");
    await expect(page.getByRole("heading", { name: /Track your order/i })).toBeVisible();

    // A wrong pair must not confirm whether the order number exists.
    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: /Find my order/i }),
    });
    await form.getByLabel(/^Order number/).fill("MT-0000-0001");
    await form.getByLabel(/^Email address/).fill("nobody@example.com");
    await form.getByRole("button", { name: /Find my order/i }).click();
    await expect(page.getByText(/could not find an order/i)).toBeVisible();
  });

  test("our story carries the history, awards, credits and field notes", async ({ page }) => {
    await page.goto("/about");

    await expect(page.getByRole("heading", { name: /Our story/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /A working history/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Awards & certification/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Field notes", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Credits$/i })).toBeVisible();

    // The researched history, not invented history. Scoped to the paper
    // sections rather than the page: the timeline renders the same
    // milestones into the DOM ahead of time, hidden until each one flies into
    // view, so an unscoped `.first()` matches a copy that is deliberately
    // invisible. The paper record is the authoritative one in any case — it is
    // what survives without WebGL.
    await expect(page.locator("#credits").getByText("Sujatha Rajendran").first()).toBeVisible();
    // A milestone only the company's own records carry, so this also proves the
    // history is the supplied one rather than the earlier researched version.
    await expect(page.locator("#timeline").getByText(/ULTCD/i).first()).toBeVisible();

    // Every claim must be attributed. Most now come from the company's own
    // history document and its scope certificates, which have no public URL —
    // so this counts attributions rather than links, and the certificate
    // numbers below are what make those particular claims checkable.
    const citations = page.getByText(/^Source:/i);
    expect(await citations.count()).toBeGreaterThan(4);

    // The certifications carry numbers a buyer can verify with the issuer.
    await expect(page.getByText(/12418012002283/).first()).toBeVisible();
    await expect(page.getByText(/ORG\/SC\/2510\/001122/).first()).toBeVisible();
  });

  test("leadership carries the founder's record, each claim cited", async ({ page }) => {
    await page.goto("/leadership");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The featured founder, his role, and the achievement the page exists to
    // carry. These come from rows, so this also proves the seed reached the DB
    // and the featured/other split rendered.
    await expect(page.getByRole("heading", { name: "R. Saravanakumaran" })).toBeVisible();
    await expect(page.getByText(/Founder & Chief Executive/i).first()).toBeVisible();
    await expect(page.getByText(/Best Agriculturist/i).first()).toBeVisible();

    // The team grid below him was taken down on instruction: those were the
    // profiles the old site presented as "trusted by doctors". The rows are
    // still seeded, so this guards the page, not the data.
    await expect(page.locator("#team")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Sujatha Rajendran" })).toHaveCount(0);

    // Same rule as the story page: a credential nobody can check is a legal
    // exposure on a food brand, so every profile shown carries its source.
    // One profile is shown now that the team grid is gone, so one citation is
    // the whole set rather than a floor that happened to be comfortable.
    const citations = page.getByRole("link", { name: /^Source:/i });
    expect(await citations.count()).toBeGreaterThan(0);

    // Search engines should attach the award to the person, not the company.
    const personSchema = await page.locator('script#ld-leadership-person').textContent();
    expect(personSchema).toContain('"@type":"Person"');
    expect(personSchema).toContain("Best Agriculturist");
  });

  test("the journal index now lives inside the story", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/\/about/);

    // An article still resolves under /journal. The slug is read from the
    // index rather than hard-coded: the field notes are company copy and get
    // rewritten, and a test that pins one slug fails on the rewrite rather
    // than on anything being broken.
    const href = await page
      .locator('a[href^="/journal/"]')
      .first()
      .getAttribute("href");
    expect(href, "an article is linked from the story page").toBeTruthy();

    const article = await page.goto(href!);
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
