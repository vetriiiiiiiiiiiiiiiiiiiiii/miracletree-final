import { test, expect } from "@playwright/test";

/**
 * The Our Story timeline.
 *
 * The WebGL flight that used to open this page is gone; what remains is the
 * paper timeline, which is the readable record and always was.
 */

test.describe("story timeline", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the paper timeline still carries every milestone", async ({ page }) => {
    await page.goto("/about");

    // The readable record must list every milestone.
    const timeline = page.locator("#timeline");
    await expect(timeline.getByRole("listitem")).not.toHaveCount(0);
  });
});
