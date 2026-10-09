import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto("http://localhost:3001/login");

  console.log("Filling form...");
  await page.fill('input[name="email"]', "admin@miracletree.in");
  await page.fill('input[name="password"]', "Miracletree@2026");

  console.log("Submitting...");
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000); // Wait for RSC
  
  const content = await page.content();
  if (content.includes("That email and password")) {
    console.log("VALIDATION MESSAGE IS RENDERED SUCCESSFULLY.");
  } else {
    console.log("NOT FOUND. DUMPING SOME HTML:", content.slice(0, 500));
  }

  await browser.close();
})();
