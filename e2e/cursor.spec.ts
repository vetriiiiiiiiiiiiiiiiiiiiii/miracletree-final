import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * The leaf cursor.
 *
 * Both the artwork and the hotspot are asserted here. The hotspot matters more
 * than it looks: the whole reason this is a leaflet and not the seed the first
 * version drew is that a leaf comes to a tip, and that tip has to sit on the
 * pointer. If the artwork is ever redrawn without moving `TIP_RATIO` with it,
 * the pointer silently starts aiming at the wrong pixel.
 */

/** The leaf and the sprig share this viewBox; the old seed used 0 0 120 120. */
const LEAF = 'svg[viewBox="0 0 64 64"]';

// The sprig is rendered first so it sits *behind* the resting leaf, which means
// a plain `querySelector` returns the sprig — correctly invisible at rest. The
// resting leaf is the last match, hence `.at(-1)` below.

test.describe("leaf cursor", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("renders and follows the pointer", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();
    mkdirSync("shots", { recursive: true });

    await page.goto("/shop", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    await page.mouse.move(700, 400);
    await page.waitForTimeout(600);
    await page.mouse.move(720, 420);
    await page.waitForTimeout(900);

    const state = await page.evaluate((sel) => {
      const svg = [...document.querySelectorAll(sel)].at(-1);
      const holder = svg?.closest("div") as HTMLElement | null;
      return {
        present: !!svg,
        opacity: holder ? getComputedStyle(holder).opacity : null,
        transform: holder ? getComputedStyle(holder).transform : null,
        htmlCursor: document.documentElement.getAttribute("data-cursor-mode"),
      };
    }, LEAF);

    expect(state.present, "leaf cursor must render").toBeTruthy();
    expect(state.htmlCursor).toBe("custom");
    expect(Number(state.opacity)).toBeGreaterThan(0.5);
    expect(state.transform).not.toBe("none");

    // Nothing but the plant: no ring, no box, no label, no trail.
    const chrome = await page.evaluate((sel) => {
      // Found by contents rather than by Tailwind classes, whose bracket
      // syntax is not a valid CSS selector.
      const mark = document.querySelector(sel);
      let layer: HTMLElement | null = mark?.parentElement ?? null;
      while (layer && getComputedStyle(layer).position !== "fixed") {
        layer = layer.parentElement;
      }
      if (!layer) return { rounded: -1, borders: -1, text: "?", marks: -1 };

      const styled = [...layer.querySelectorAll("*")].filter((el) => {
        const s = getComputedStyle(el);
        return parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderRadius) > 20;
      });

      return {
        rounded: layer.querySelectorAll(".rounded-full").length,
        borders: styled.length,
        text: (layer.textContent ?? "").trim(),
        // Exactly two: the resting leaf and the sprig that unfurls over it.
        // The old cursor trailed three shed leaflets behind it as well.
        marks: layer.querySelectorAll("svg").length,
      };
    }, LEAF);

    expect(chrome.rounded, "no circle around the cursor").toBe(0);
    expect(chrome.borders, "no ring or box").toBe(0);
    expect(chrome.text, "no text label").toBe("");
    expect(chrome.marks, "just the leaf and its sprig — no trail").toBe(2);

    // The tip must sit on the pointer, not the middle of the artwork.
    //
    // Asserted through the transform rather than through getBoundingClientRect:
    // the leaf tilts, and the bounding rect of a rotated box is its axis-aligned
    // envelope, which is several pixels wider than the box itself. The contract
    // is three things — the box is translated to the pointer, it is inset by
    // exactly the tip's offset, and every transform pivots on that same point.
    const hotspot = await page.evaluate((sel) => {
      const svg = [...document.querySelectorAll(sel)].at(-1);
      const holder = svg?.closest("div") as HTMLElement | null;
      if (!holder) return null;

      const style = getComputedStyle(holder);
      const m = new DOMMatrixReadOnly(style.transform);
      return {
        translateX: m.m41,
        translateY: m.m42,
        left: parseFloat(style.left),
        top: parseFloat(style.top),
        size: parseFloat(style.width),
        origin: style.transformOrigin,
      };
    }, LEAF);

    expect(hotspot, "cursor box must exist").not.toBeNull();

    // Translated to the pointer.
    expect(Math.abs(hotspot!.translateX - 720)).toBeLessThan(2);
    expect(Math.abs(hotspot!.translateY - 420)).toBeLessThan(2);

    // Inset by the tip's own offset inside the artwork (6/64 of the box), so
    // the drawn tip lands on the translated point.
    const tipOffset = (6 / 64) * hotspot!.size;
    expect(Math.abs(hotspot!.left + tipOffset)).toBeLessThan(0.2);
    expect(Math.abs(hotspot!.top + tipOffset)).toBeLessThan(0.2);

    // And scale and rotation pivot there too, so growing or tilting the leaf
    // never walks the point off the thing it is pointing at.
    const [originX, originY] = hotspot!.origin.split(" ").map(parseFloat);
    expect(Math.abs(originX! - tipOffset)).toBeLessThan(0.2);
    expect(Math.abs(originY! - tipOffset)).toBeLessThan(0.2);

    await page.screenshot({
      path: "shots/cursor-rest.png",
      clip: { x: 660, y: 360, width: 140, height: 130 },
    });

    // Over a product the single leaflet becomes a sprig. The card declares the
    // intent, so anywhere on its artwork works.
    const card = page.locator("article").filter({ has: page.locator("h3") }).first();
    await card.hover({ position: { x: 60, y: 60 } });
    await page.waitForTimeout(1200);

    const sprig = await page.evaluate((sel) => {
      const marks = [...document.querySelectorAll<SVGElement>(sel)];
      // The sprig is rendered first so it sits behind the resting leaf.
      const holder = marks[0]?.closest("div") as HTMLElement | null;
      if (!holder) return null;
      return { opacity: Number(getComputedStyle(holder).opacity) };
    }, LEAF);

    expect(sprig, "sprig element must exist").not.toBeNull();
    expect(sprig!.opacity, "the leaf unfurls over a product").toBeGreaterThan(0.6);

    const box = await card.boundingBox();
    if (box) {
      await page.screenshot({
        path: "shots/cursor-sprout.png",
        clip: {
          x: Math.max(0, box.x + 60 - 70),
          y: Math.max(0, box.y + 60 - 70),
          width: 150,
          height: 150,
        },
      });
    }
  });

  test("gives the caret back over a text field", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();

    await page.goto("/contact", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const email = page.getByLabel(/^Email/).first();
    await email.hover();
    await page.waitForTimeout(500);

    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-cursor-mode")))
      .toBe("native");
  });
});
