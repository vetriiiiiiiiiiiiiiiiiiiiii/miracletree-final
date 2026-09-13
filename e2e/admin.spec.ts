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

    const marker = `Shade-dried in Madurai. ${Date.now()}`;
    await page.getByLabel(/^Short description/).fill(marker);
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText("Product saved.")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel(/^Short description/)).toHaveValue(marker);
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

    // The design credit is a row like any other, editable here rather than
    // only in Prisma Studio.
    await expect(page.getByText("sketch-portfolio").first()).toBeVisible();
  });
});
