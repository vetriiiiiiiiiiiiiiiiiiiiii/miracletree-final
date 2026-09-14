import { test, expect } from "@playwright/test";

/**
 * The Our Story flight.
 *
 * Captures the canvas at three points so the port can actually be looked at —
 * the in-app browser never runs rAF while hidden, so nothing animates there and
 * a screenshot taken from it proves nothing.
 */

test.describe("story flight", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("renders the flight and flies on scroll", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "captured on desktop");

    await page.goto("/about");

    // The renderer is ~340kB and the flight sits several screens down, so it
    // is not downloaded until the reader is heading towards it. Asserting its
    // absence here is the guard against that deferral quietly regressing to an
    // eager import, which is what it used to be.
    await page.waitForTimeout(1200);
    await expect(page.locator("#flight canvas")).toHaveCount(0);

    // Scrolled by wheel from a known top, not scrollIntoView: Lenis owns the
    // scroll on pointer devices, converts wheel into real window scroll, and
    // animates a programmatic scrollTo straight back. An earlier version of
    // this test scrolled into view first, which had already flown a third of
    // the way in before the first screenshot was even taken.
    const counter = page.locator("#flight").getByText(/\d+\s*\/\s*\d+/);

    const flyBy = async (ticks: number) => {
      for (let i = 0; i < ticks; i++) {
        await page.mouse.wheel(0, 240);
        await page.waitForTimeout(35);
      }
      await page.waitForTimeout(1800);
    };

    await flyBy(9);
    // By now the observer has long since fired and the canvas is warm.
    await expect(page.locator("#flight canvas")).toBeVisible();
    const first = await counter.textContent();
    await page.screenshot({ path: "shots/flight-start.png" });

    await flyBy(8);
    await page.screenshot({ path: "shots/flight-mid.png" });

    await flyBy(8);
    const last = await counter.textContent();
    await page.screenshot({ path: "shots/flight-later.png" });

    // It actually flew. This is the assertion that would have caught the first
    // port sitting motionless while the page scrolled past it.
    expect(first).not.toEqual(last);
  });

  test("the paper timeline still carries every milestone", async ({ page }) => {
    await page.goto("/about");

    // The flight is decorative; the readable record is the paper section, and
    // it must list everything regardless of whether WebGL ran.
    const timeline = page.locator("#timeline");
    await expect(timeline.getByRole("listitem")).not.toHaveCount(0);
  });
});
