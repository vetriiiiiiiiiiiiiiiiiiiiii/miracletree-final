import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@miracletree.in');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
    
    console.log("Current URL:", page.url());
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
