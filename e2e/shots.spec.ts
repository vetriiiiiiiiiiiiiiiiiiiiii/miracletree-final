import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Visual capture pass.
 *
 * Not assertions — this exists so a human (or the author) can actually look at
 * what the renderer produces at each chapter of the journey, rather than
 * inferring it from GL state. Output lands in `shots/`.
 */

const OUT = "shots";
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

test.describe("Moringa World", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("captures every chapter of the journey", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();

    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for the scene to actually paint, not just for the canvas to exist.
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    await page.waitForFunction(
      () => {
        const c = document.querySelector("canvas");
        return !!c && getComputedStyle(c).opacity === "1";
      },
      { timeout: 20_000 },
    );
    await page.waitForTimeout(1500);

    // The world's own scrollable range, not the document's: the page continues
    // for several more sections after the journey ends, and sampling against
    // total height walks straight past the last chapters.
    const total = await page.evaluate(() => {
      const track = document.querySelector("canvas")?.closest("div")?.parentElement;
      if (!track) return document.body.scrollHeight - window.innerHeight;
      return track.getBoundingClientRect().height - window.innerHeight;
    });

    const stops = [
      { name: "01-seed", at: 0 },
      { name: "02-germination", at: 0.16 },
      { name: "03-rise", at: 0.33 },
      { name: "04-flower-and-pod", at: 0.55 },
      { name: "05-inside-leaf", at: 0.66 },
      { name: "06-drying", at: 0.82 },
      { name: "07-product", at: 0.99 },
    ];

    for (const stop of stops) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(total * stop.at));
      // Scroll is damped, so give the camera time to arrive before capturing.
      await page.waitForTimeout(2200);
      await page.screenshot({ path: `${OUT}/world-${stop.name}.png` });
    }
  });

  test("captures the commerce sections", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();

    const pages = [
      { name: "shop", url: "/shop" },
      { name: "pdp", url: "/product/moringa-leaf-powder-hpd-dried" },
      { name: "cart-empty", url: "/cart" },
      { name: "moringa", url: "/moringa" },
      { name: "journal", url: "/journal" },
      { name: "admin-login", url: "/admin/login" },
    ];

    for (const entry of pages) {
      await page.goto(entry.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${OUT}/page-${entry.name}.png`, fullPage: false });
    }
  });
});

test.describe("mobile", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("captures the mobile experience", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "mobile") test.skip();

    for (const entry of [
      { name: "home", url: "/" },
      { name: "shop", url: "/shop" },
      { name: "pdp", url: "/product/moringa-leaf-powder-hpd-dried" },
    ]) {
      await page.goto(entry.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT}/mobile-${entry.name}.png` });
    }
  });
});

test.describe("our story", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("captures the notebook", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();

    await page.goto("/about", { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/story-cover.png` });

    for (const [name, hash] of [
      ["origin", "#origin"],
      ["timeline", "#timeline"],
      ["recognition", "#recognition"],
      ["field-notes", "#field-notes"],
      ["credits", "#credits"],
    ] as const) {
      await page.evaluate((h) => {
        document.querySelector(h)?.scrollIntoView({ behavior: "instant", block: "start" });
      }, hash);
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `${OUT}/story-${name}.png` });
    }
  });
});
