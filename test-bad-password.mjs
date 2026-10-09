import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/login");

  console.log("Filling form...");
  await page.fill('input[name="email"]', "admin@miracletree.in");
  await page.fill('input[name="password"]', "Miracletree@2026");

  console.log("Submitting...");
  
  // Intercept response to check status code
  page.on('response', response => {
    if (response.url() === 'http://localhost:3000/login' && response.request().method() === 'POST') {
      console.log(`POST response status: ${response.status()}`);
    }
  });

  await page.click('button[type="submit"]');
  
  // wait for navigation or error
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
    console.log("SOMETHING ELSE HAPPENED");
  }

  await browser.close();
})();
