const { test, expect } = require('@playwright/test');

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'admin@miracletree.in');
  await page.fill('input[name="password"]', 'admin12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin');
  await page.goto('http://localhost:3000/admin/products/new');
  await page.fill('input[name="name"]', 'My Test Product');
  await page.fill('input[name="slug"]', 'my-test-product');
  await page.click('button[type="submit"]:has-text("Create product")');
  await page.waitForTimeout(3000);
  console.log(await page.url());
  console.log(await page.content());
});
