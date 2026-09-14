/**
 * Side-by-side theme screenshots.
 *
 * Loads each route twice — once pinned dark, once pinned light — and writes a
 * PNG per pair into the output directory. Reveal animations are forced to their
 * end state first, so a shot never catches a section mid-fade and reads as a
 * missing element.
 *
 * Usage: node scripts/theme-shots.mjs <outDir> [route ...]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const [outDir, ...routeArgs] = process.argv.slice(2);
if (!outDir) {
  console.error("usage: node scripts/theme-shots.mjs <outDir> [route ...]");
  process.exit(1);
}

const routes = routeArgs.length ? routeArgs : ["/", "/shop", "/leadership", "/about"];
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();

for (const route of routes) {
  for (const theme of ["dark", "light"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript((t) => {
      try { localStorage.setItem("mt-theme", t); } catch {}
    }, theme);
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => {
      document.querySelectorAll("[data-animate]").forEach((e) => {
        e.style.opacity = "1";
        e.style.transform = "none";
      });
    });
    // WebGL scenes need a couple of frames after their first paint.
    await page.waitForTimeout(1400);
    const name = (route === "/" ? "home" : route.replace(/\//g, "-").replace(/^-/, ""));
    const file = `${outDir}/${name}--${theme}.png`;
    await page.screenshot({ path: file });
    console.log(file);
    await page.close();
  }
}

await browser.close();
