import { test as setup, expect } from "@playwright/test";

/**
 * Authenticates once and saves the session for the admin suite.
 *
 * Signing in per test would hammer the login rate limiter — which caps attempts
 * per account precisely to make credential stuffing expensive — and the suite
 * would start failing for the right reason at the wrong time.
 */
const AUTH_FILE = "e2e/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel(/^Email/).fill(process.env.SEED_ADMIN_EMAIL ?? "admin@miracletree.in");
  await page.getByLabel(/^Password/).fill(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
