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

  // The chapter-by-chapter capture was removed with the scroll journey: the
  // homepage hero is now a single screen, so there are no camera stops to
  // photograph. Commerce shots below are unaffected.

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
