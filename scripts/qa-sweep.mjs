/**
 * Site-wide defect sweep.
 *
 * Loads every route at desktop and mobile and reports the classes of problem
 * that a contrast audit and an e2e suite both miss: console and page errors,
 * hydration mismatches, failed requests, images that never resolve, horizontal
 * overflow, links that 404, controls too small to tap, and headings that skip
 * a level.
 *
 * Usage: node scripts/qa-sweep.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3001";

const ROUTES = [
  "/", "/shop", "/shop/moringa-tea", "/product/moringa-leaf-powder-hpd-dried",
  "/moringa", "/innovation", "/leadership", "/gallery", "/about", "/ritual",
  "/cart", "/contact", "/faq", "/track", "/login", "/register",
  "/shipping", "/returns", "/privacy", "/terms",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const findings = [];
const add = (route, viewport, kind, detail) =>
  findings.push({ route, viewport, kind, detail });

const browser = await chromium.launch();
const linkCache = new Map();

for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });

    const consoleErrors = [];
    const failedRequests = [];
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message.split("\n")[0]}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // Next's dev overlay repeats server errors; keep one line of each.
      consoleErrors.push(t.slice(0, 160));
    });
    page.on("requestfailed", (r) => {
      const u = r.url();
      if (u.startsWith("data:")) return;
      failedRequests.push(`${r.failure()?.errorText ?? "failed"} ${u.slice(0, 110)}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().includes("/_next/static/webpack")) {
        failedRequests.push(`HTTP ${r.status()} ${r.url().slice(0, 110)}`);
      }
    });

    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    } catch (err) {
      add(route, viewport.name, "load", err.message.split("\n")[0]);
      await page.close();
      continue;
    }

    // Let reveals and lazy images settle.
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      document.querySelectorAll("[data-animate]").forEach((e) => {
        e.style.opacity = "1";
        e.style.transform = "none";
      });
    });
    await page.waitForTimeout(400);

    const hydration = consoleErrors.filter((e) => /hydrat/i.test(e));
    const otherErrors = consoleErrors.filter((e) => !/hydrat/i.test(e));
    if (hydration.length) add(route, viewport.name, "hydration", hydration[0]);
    for (const e of [...new Set(otherErrors)].slice(0, 2)) {
      add(route, viewport.name, "console", e);
    }
    for (const f of [...new Set(failedRequests)].slice(0, 3)) {
      add(route, viewport.name, "request", f);
    }

    const dom = await page.evaluate(() => {
      const out = {};

      // Horizontal overflow — the page body must never scroll sideways.
      out.overflow =
        document.documentElement.scrollWidth > window.innerWidth + 1
          ? document.documentElement.scrollWidth - window.innerWidth
          : 0;
      if (out.overflow) {
        const wide = [...document.querySelectorAll("body *")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.right > window.innerWidth + 1 && r.left < window.innerWidth;
          })
          .slice(0, 3)
          .map((e) => `${e.tagName}.${(e.className?.baseVal ?? e.className ?? "").toString().slice(0, 45)}`);
        out.overflowCulprits = wide;
      }

      // Images that never resolved.
      out.brokenImages = [...document.images]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.currentSrc || i.src)
        .slice(0, 3);

      // Images with no alt attribute at all (empty alt is a valid choice).
      out.missingAlt = [...document.images].filter((i) => !i.hasAttribute("alt")).length;

      // Tap targets under 24px in either dimension.
      //
      // WCAG 2.5.8 exempts a link sitting inside a sentence, because enlarging
      // it would break the line box around it. So a link whose parent holds
      // real text of its own is skipped, and what is left is standalone
      // controls — nav items, breadcrumbs, buttons — where the size is a
      // genuine defect rather than a property of running prose.
      const inProse = (el) => {
        const parent = el.parentElement;
        if (!parent) return false;
        if (/^(P|LI|SPAN|LABEL|BLOCKQUOTE|FIGCAPTION|DD|DT)$/.test(parent.tagName)) {
          const own = [...parent.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim())
            .join("");
          if (own.length > 1) return true;
        }
        return false;
      };

      out.smallTargets = [...document.querySelectorAll("a[href], button")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          if (!r.width || !r.height || cs.visibility === "hidden") return false;
          // Skip-links are offscreen until focused, and sized when they appear.
          if (cs.position === "absolute" && r.width < 2) return false;
          if (e.className && /sr-only/.test(e.className.toString())) return false;
          if (inProse(e)) return false;
          // A closed drawer is inert; its contents are not reachable.
          if (e.closest("[inert]") || e.closest('[aria-hidden="true"]')) return false;

          // The "stretched link" pattern: a ::before pinned to inset-0 makes
          // the whole positioned ancestor clickable, so the real target is the
          // card, not the text box getBoundingClientRect reports. Product cards
          // use it, and without this every one of them is a false positive.
          const before = getComputedStyle(e, "::before");
          if (before.position === "absolute" && before.content !== "none") {
            // inset-0 stretches over the positioned ancestor; a negative inset
            // simply pads the hit area outwards. Both make the measured text
            // box the wrong thing to judge.
            const expands = ["top", "right", "bottom", "left"].every((side) => {
              const v = before[side];
              return v === "auto" || v === "0px" || parseFloat(v) <= 0;
            });
            if (expands) return false;
          }

          return r.width < 24 || r.height < 24;
        })
        .slice(0, 4)
        .map((e) => {
          const r = e.getBoundingClientRect();
          return `${e.tagName}"${e.textContent.trim().slice(0, 20)}" ${Math.round(r.width)}×${Math.round(r.height)}`;
        });

      // Heading order.
      const levels = [...document.querySelectorAll("main h1,main h2,main h3,main h4")]
        .map((h) => Number(h.tagName[1]));
      out.h1Count = levels.filter((l) => l === 1).length;
      out.headingSkip = null;
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          out.headingSkip = `h${levels[i - 1]} → h${levels[i]}`;
          break;
        }
      }

      // Internal links, for the 404 check.
      out.links = [...new Set(
        [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute("href")),
      )];
      return out;
    });

    if (dom.overflow) {
      add(route, viewport.name, "overflow",
        `${dom.overflow}px — ${(dom.overflowCulprits ?? []).join(", ")}`);
    }
    for (const src of dom.brokenImages) add(route, viewport.name, "image", src.slice(0, 110));
    if (dom.missingAlt) add(route, viewport.name, "a11y", `${dom.missingAlt} image(s) with no alt attribute`);
    if (dom.smallTargets.length) {
      add(route, viewport.name, "tap-target", dom.smallTargets.join(", "));
    }
    if (dom.h1Count !== 1) add(route, viewport.name, "heading", `${dom.h1Count} h1 elements in <main>`);
    if (dom.headingSkip) add(route, viewport.name, "heading", `level skipped: ${dom.headingSkip}`);

    // Follow internal links once each, desktop pass only.
    if (viewport.name === "desktop") {
      for (const href of dom.links) {
        const clean = href.split("#")[0];
        if (!clean || linkCache.has(clean)) continue;
        try {
          const res = await page.request.get(BASE + clean, { maxRedirects: 5 });
          linkCache.set(clean, res.status());
          if (res.status() >= 400) add(route, "link", "404", `${clean} → ${res.status()}`);
        } catch {
          linkCache.set(clean, 0);
        }
      }
    }

    await page.close();
  }
}

await browser.close();

if (!findings.length) {
  console.log("PASS — no issues found");
} else {
  const byKind = {};
  for (const f of findings) (byKind[f.kind] ??= []).push(f);
  for (const [kind, list] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n### ${kind.toUpperCase()} (${list.length})`);
    const seen = new Set();
    for (const f of list) {
      const key = f.kind + f.detail;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`  [${f.viewport}] ${f.route}\n      ${f.detail}`);
    }
  }
  console.log(`\nTOTAL ${findings.length} findings`);
}
