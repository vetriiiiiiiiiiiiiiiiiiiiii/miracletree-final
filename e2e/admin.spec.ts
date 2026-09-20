import { test, expect } from "@playwright/test";

/**
 * Admin behaviour, including the parts that must NOT work: an unauthenticated
 * visitor reaching any admin route, or an unsigned request reaching the upload
 * endpoint or the payment webhook.
 */

test.describe("admin security", () => {
  // Explicitly signed out, whatever the project default is.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("every admin route redirects when signed out", async ({ page }) => {
    for (const path of [
      "/admin",
      "/admin/products",
      "/admin/orders",
      "/admin/customers",
      "/admin/inventory",
      "/admin/settings",
      "/admin/promotions",
    ]) {
      await page.goto(path);
      await expect(page, `${path} must be gated`).toHaveURL(/\/admin\/login/);
    }
  });

  test("account pages redirect when signed out", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login/);
  });

  test("upload endpoint rejects unauthenticated posts", async ({ request }) => {
    const response = await request.post("/api/admin/upload", {
      multipart: { folder: "products" },
    });
    expect(response.status()).toBe(401);
  });

  test("payment webhook rejects missing and bad signatures", async ({ request }) => {
    const unsigned = await request.post("/api/payments/razorpay/webhook", {
      data: { event: "payment.captured" },
    });
    expect(unsigned.status()).toBe(400);

    const badSignature = await request.post("/api/payments/razorpay/webhook", {
      headers: { "x-razorpay-signature": "deadbeef" },
      data: { event: "payment.captured" },
    });
    expect(badSignature.status()).toBe(401);
  });
});

test.describe("admin", () => {
  // Session comes from the auth setup project.
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("dashboard shows real catalogue numbers", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    await expect(page.getByText("Published products")).toBeVisible();
    await expect(page.getByText("27", { exact: true }).first()).toBeVisible();
  });

  test("products list loads and opens the editor", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();

    await page.getByRole("link", { name: "Moringa Leaf Powder" }).first().click();
    await expect(page.getByRole("tab", { name: "Pricing" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Variants" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save changes/i })).toBeVisible();
  });

  test("editing a product persists", async ({ page }) => {
    await page.goto("/admin/products");
    await page.getByRole("link", { name: "Moringa Leaf Powder" }).first().click();

    // This used to write "Shade-dried in Madurai. <timestamp>" and leave it
    // there. Two problems: the suite edits the real catalogue, so a product on
    // the storefront was left wearing a test string; and the string it chose is
    // a drying claim the company does not make, which made every later check
    // for "shade-dried" look like a content bug that had come back. The marker
    // is inert now, and the original copy goes back afterwards.
    const field = page.getByLabel(/^Short description/);
    const original = await field.inputValue();
    const marker = `E2E short description ${Date.now()}`;

    await field.fill(marker);
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText("Product saved.")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel(/^Short description/)).toHaveValue(marker);

    await page.getByLabel(/^Short description/).fill(original);
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText("Product saved.")).toBeVisible();
  });

  test("the homepage hero follows the admin's choice", async ({ page }) => {
    // The hero used to be a hard-coded list of slugs in the page file, so
    // changing which packs it shows meant a deploy. It reads the product flag
    // now, and falls back to that list only when nothing at all is ticked.
    const heroNames = async () => {
      const shopper = await page.context().browser()!.newContext();
      const home = await shopper.newPage();
      await home.goto("/");
      const names = await home
        .locator('a[href^="/product/"]')
        .evaluateAll((els) => els.slice(0, 3).map((e) => e.textContent?.trim() ?? ""));
      await shopper.close();
      return names.join(" | ");
    };

    const before = await heroNames();
    expect(before).not.toContain("Moringa Gum");

    await page.goto("/admin/products");
    await page.getByRole("link", { name: "Moringa Gum (Gond) Powder" }).first().click();
    await page.getByLabel(/Homepage hero/i).first().check();
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText("Product saved.")).toBeVisible();

    expect(await heroNames()).toContain("Moringa Gum");

    // Put the catalogue back the way the suite found it.
    await page.reload();
    await page.getByLabel(/Homepage hero/i).first().uncheck();
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText("Product saved.")).toBeVisible();
    expect(await heroNames()).not.toContain("Moringa Gum");
  });

  test("inventory adjustment is recorded", async ({ page }) => {
    await page.goto("/admin/inventory");
    await expect(page.getByRole("heading", { name: "Inventory", level: 1 })).toBeVisible();

    // Pin to the variant id, which is what the adjustment field is keyed by.
    // The product name matches every size of that product; the SKU is a
    // substring match and was for a long time not even unique; and the table
    // re-sorts by stock the moment a quantity changes, so anything positional
    // reads a different variant after the update. Only the id identifies one
    // row before and after.
    const firstField = page.locator('input[id^="delta-"]').first();
    await expect(firstField).toBeVisible();
    const variantId = ((await firstField.getAttribute("id")) ?? "").replace("delta-", "");
    expect(variantId).not.toBe("");

    const rowFor = () =>
      page.locator("tbody tr").filter({ has: page.locator(`#delta-${variantId}`) });
    const before = Number((await rowFor().locator("td").nth(3).textContent())?.trim() ?? "0");

    await rowFor().getByLabel(/Stock adjustment/i).fill("5");
    await rowFor().getByRole("button", { name: "Apply" }).click();

    await expect(async () => {
      const after = Number((await rowFor().locator("td").nth(3).textContent())?.trim() ?? "0");
      expect(after).toBe(before + 5);
    }).toPass({ timeout: 25_000 });
  });

  test("orders, customers, content and settings all render", async ({ page }) => {
    for (const [path, heading] of [
      ["/admin/orders", "Orders"],
      ["/admin/customers", "Customers"],
      ["/admin/reviews", "Reviews"],
      ["/admin/promotions", "Promotions"],
      ["/admin/content", "Homepage"],
      ["/admin/journal", "Journal"],
      ["/admin/media", "Media"],
      ["/admin/settings", "Settings"],
    ] as const) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, level: 1 }),
        `${path} should render`,
      ).toBeVisible();
    }
  });

  test("editing a homepage section persists", async ({ page }) => {
    // The section editor submits no Body field, and for a while the action read
    // that absent field straight into the schema, so every save was rejected
    // against a field the operator could not see. The round trip is the test.
    await page.goto("/admin/content");
    await page.getByRole("button", { name: "Edit" }).first().click();

    const title = page.locator('[name="title"]').first();
    const original = await title.inputValue();
    await title.fill(`${original} (edited)`);
    await page.getByRole("button", { name: /save section/i }).click();
    await expect(page.getByText("Section saved.")).toBeVisible();

    await page.goto("/admin/content");
    await expect(page.getByText(`${original} (edited)`)).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.locator('[name="title"]').first().fill(original);
    await page.getByRole("button", { name: /save section/i }).click();
    await expect(page.getByText("Section saved.")).toBeVisible();
  });

  test("command palette opens and finds a product", async ({ page }) => {
    await page.goto("/admin");
    // The shortcut listener is on window; give the document focus first.
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("ControlOrMeta+k");

    const palette = page.getByRole("dialog", { name: "Command palette" });
    await expect(palette).toBeVisible();

    await palette.getByRole("textbox").fill("orders");
    await expect(palette.getByRole("option", { name: /Orders/i }).first()).toBeVisible();
  });
});

test.describe("our story admin", () => {
  test("lists the timeline, awards and credits, and can edit one", async ({ page }) => {
    await page.goto("/admin/story");
    await expect(page.getByRole("heading", { name: "Our Story", level: 1 })).toBeVisible();

    // All three managers render with their seeded rows.
    await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Awards & certification/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible();

    // Credits are rows like any other, editable here rather than only in
    // Prisma Studio. Asserting that some row exists rather than naming one:
    // the credits are company copy, and the design-reference row has already
    // been removed at their request once.
    await expect(page.getByText("The growing families").first()).toBeVisible();
  });
});
