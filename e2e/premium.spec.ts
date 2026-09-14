import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * The pack viewer and the route-change wipe.
 *
 * The wipe's assertion is the important one: it must never be able to swallow a
 * click. An overlay that covers the viewport during navigation is exactly the
 * kind of thing that traps a shopper if it fails to clean up, so the test
 * checks that whatever is under the pointer mid-transition is still the page.
 */

test.describe("pack viewer", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("turns the pack and returns it face-on", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "pointer drag, desktop");
    mkdirSync("shots", { recursive: true });

    await page.goto("/product/moringa-leaf-powder-hpd-dried");

    // Photographs are the default view.
    const toggle = page.getByRole("group", { name: /How to view/i });
    await expect(toggle.getByRole("button", { name: "Photos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await toggle.getByRole("button", { name: /Turn the pack/i }).click();

    const stage = page.getByRole("img", { name: /Drag to turn/i });
    await expect(stage).toBeVisible();

    const box = await stage.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // The plane must be face-on before the drag.
    const plane = stage.locator("div").first();
    const before = await plane.evaluate((el) => getComputedStyle(el).transform);

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 90, cy - 20, { steps: 12 });
    await page.waitForTimeout(150);

    const during = await plane.evaluate((el) => getComputedStyle(el).transform);
    expect(during, "dragging actually rotates the pack").not.toEqual(before);

    await page.screenshot({ path: "shots/pack-turned.png", clip: box! });

    // Releasing settles it back, so the shopper never leaves it askew.
    await page.mouse.up();
    await page.waitForTimeout(900);
    const after = await plane.evaluate((el) => getComputedStyle(el).transform);
    expect(after, "it returns face-on").toEqual(before);
  });
});

test.describe("route progress", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("indicates navigation without ever blocking the page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "desktop");

    await page.goto("/");
    await page.getByRole("link", { name: "Shop", exact: true }).first().click();
    await expect(page).toHaveURL(/\/shop/);

    // The bar is a fixed overlay at the very top of the stacking order. If it
    // ever became interactive it would eat the first click of every navigation,
    // so this asserts the property that keeps it harmless rather than asserting
    // that it was visible at some exact instant.
    const bar = page.locator('div.pointer-events-none.fixed.inset-x-0.top-0');
    await expect(bar).toHaveCount(1);
    await expect(bar).toHaveCSS("pointer-events", "none");

    // Whatever sits under the centre of the viewport must be page content.
    const blocking = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      let node: Element | null = el;
      while (node) {
        if (node instanceof HTMLElement && node.style.zIndex === "9999") return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(blocking, "the progress bar never intercepts the pointer").toBe(false);

    // And it retires rather than sitting there at a half-finished width.
    await page.waitForTimeout(1200);
    await expect(bar).toHaveCSS("opacity", "0");
  });
});
