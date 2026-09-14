/**
 * End-to-end check of the theme switch.
 *
 * Contrast is audited separately; this asserts the *behaviour* — that the
 * header toggle flips the ground, that the choice survives a reload, that the
 * "system" setting follows the OS preference, and above all that a cold load on
 * paper never paints the dark ground first. That last one is the whole reason
 * the init script is inlined in <head>, and it is invisible to a screenshot
 * taken after load, so it is measured here instead.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const browser = await chromium.launch();
const results = [];
const check = (name, pass, detail = "") =>
  results.push({ name, pass, detail });

const ground = (page) =>
  page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    bg: getComputedStyle(document.body).backgroundColor,
    scheme: getComputedStyle(document.documentElement).colorScheme,
  }));

// --- 1. default, toggle, and persistence ---------------------------------
{
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const before = await ground(page);
  check("defaults to dark", before.theme === "dark", before.theme ?? "none");

  await page.click('button[aria-label*="Switch to"]');
  await page.waitForTimeout(400);
  const after = await ground(page);
  check("toggle flips the ground", after.theme === "light" && after.bg !== before.bg,
    `${before.theme}→${after.theme} ${after.bg}`);
  check("color-scheme follows", after.scheme === "light", after.scheme);

  await page.reload({ waitUntil: "domcontentloaded" });
  const persisted = await ground(page);
  check("choice survives reload", persisted.theme === "light", persisted.theme ?? "none");
  await page.close();
}

// --- 2. no flash of the wrong ground on a cold load ----------------------
{
  const page = await browser.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem("mt-theme", "light"); } catch {}
    // Record the attribute at the earliest moment scripts can observe the
    // document. If the init script has not run by now, the page paints dark.
    document.addEventListener("readystatechange", () => {
      if (!window.__firstTheme) {
        window.__firstTheme = document.documentElement.getAttribute("data-theme");
      }
    }, { once: true });
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const first = await page.evaluate(() => window.__firstTheme);
  check("no dark flash on a light cold load", first === "light", `first paint: ${first}`);
  await page.close();
}

// --- 3. the "system" setting follows the OS ------------------------------
for (const scheme of ["light", "dark"]) {
  const page = await browser.newPage({ colorScheme: scheme });
  await page.addInitScript(() => {
    try { localStorage.setItem("mt-theme", "system"); } catch {}
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const got = await ground(page);
  check(`system follows OS (${scheme})`, got.theme === scheme, got.theme ?? "none");
  await page.close();
}

await browser.close();

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  — ${r.detail}` : ""}`);
}
console.log(failed ? `\n${failed} failing` : "\nall theme behaviour checks pass");
process.exit(failed ? 1 : 0);
