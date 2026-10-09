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
  
  page.on('response', response => {
    if (response.request().method() === 'POST') {
      console.log(`POST ${response.url()} status: ${response.status()}`);
    }
  });

  await page.click('button[type="submit"]');
  
  try {
    await page.waitForNavigation({ timeout: 5000 });
  } catch(e) {
    console.log("No navigation.");
  }
  
  const content = await page.content();
  if (content.includes("500")) {
    console.log("500 ERROR FOUND ON PAGE");
  } else if (content.includes("That email and password")) {
    console.log("VALIDATION ERROR FOUND");
  } else {
    console.log("SUCCESS OR OTHER");
  }

  await browser.close();
})();
