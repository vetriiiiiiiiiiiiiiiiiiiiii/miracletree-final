/**
 * Theme + contrast audit.
 *
 * Loads every route in both themes and reports text that fails WCAG AA against
 * whatever actually paints behind it. Colours are resolved by painting them to
 * a 1x1 canvas, because Tailwind emits `oklab()` / `color-mix()` for every
 * opacity modifier and naive rgb() parsing reads those as near-black.
 *
 * Usage: node theme-audit.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3001";

const ROUTES = [
  "/", "/shop", "/shop/moringa-tea", "/moringa", "/ritual", "/about",
  "/gallery", "/leadership", "/track", "/innovation",
  "/contact", "/faq", "/cart", "/login", "/register", "/shipping",
  "/returns", "/privacy", "/terms", "/product/mogo-moringa-energy-bar-movita-r", "/leadership",
];

const AUDIT = () => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const P = (str) => {
    if (!str || str === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = str;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (f, b) => ({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a), a: 1,
  });
  // A gradient paints through `background-image`, where `backgroundColor` reads
  // transparent — so without this the walk falls past a gradient plate all the
  // way to the page and reports the opposite ground. The stops are averaged,
  // which is an approximation, but a far better one than ignoring them.
  const gradientOf = (cs) => {
    const img = cs.backgroundImage;
    if (!img || img === "none" || !/gradient\(/.test(img)) return null;
    const stops = img.match(/(?:rgba?|oklab|oklch|color|hsla?)\([^)]*\)|#[0-9a-fA-F]{3,8}/g);
    if (!stops || !stops.length) return null;
    const parsed = stops.map(P).filter((c) => c.a > 0);
    if (!parsed.length) return null;
    const n = parsed.length;
    return {
      r: parsed.reduce((s, c) => s + c.r, 0) / n,
      g: parsed.reduce((s, c) => s + c.g, 0) / n,
      b: parsed.reduce((s, c) => s + c.b, 0) / n,
      a: parsed.reduce((s, c) => s + c.a, 0) / n,
    };
  };

  const bgOf = (el) => {
    let acc = null, n = el;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      for (const c of [gradientOf(cs), P(cs.backgroundColor)]) {
        if (c && c.a > 0) {
          acc = acc ? over(acc, c) : c;
          if (acc.a >= 0.999) return acc;
        }
      }
      n = n.parentElement;
    }
    const body = P(getComputedStyle(document.body).backgroundColor);
    return acc ? over(acc, body) : body;
  };
  const ratio = (a, b) => { const s = [lum(a), lum(b)].sort((x, y) => y - x); return (s[0] + 0.05) / (s[1] + 0.05); };

  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
    if (!txt || txt.length < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.15) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const fgRaw = P(cs.color);
    if (fgRaw.a === 0) continue;
    const bg = bgOf(el);
    const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    const need = large ? 3 : 4.5;
    const r = ratio(fg, bg);
    if (r < need) {
      out.push({
        t: txt.slice(0, 40), r: +r.toFixed(2), need,
        cls: (el.className?.baseVal ?? el.className ?? "").toString().slice(0, 70),
      });
    }
  }
  const seen = new Set();
  return out.filter((o) => { const k = o.cls + o.r; if (seen.has(k)) return false; seen.add(k); return true; })
            .sort((a, b) => a.r - b.r);
};

const browser = await chromium.launch();
let total = 0;

for (const theme of ["dark", "light"]) {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript((t) => {
      try { localStorage.setItem("mt-theme", t); } catch {}
    }, theme);
    try {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
      // Let reveal animations AND colour transitions settle. Controls that
      // reflect the stored theme only become active once the provider hydrates,
      // and `transition-colors` then interpolates their text over ~150ms — a
      // measurement taken inside that window reads a midpoint that is never
      // actually at rest on screen, and reports it as a contrast failure.
      await page.waitForTimeout(1800);
      await page.evaluate(() => {
        document.querySelectorAll("[data-animate]").forEach((e) => {
          e.style.opacity = "1"; e.style.transform = "none";
        });
      });
      const issues = await page.evaluate(AUDIT);
      if (issues.length) {
        total += issues.length;
        console.log(`\n${theme.toUpperCase()} ${route} — ${issues.length}`);
        for (const i of issues.slice(0, 8)) {
          console.log(`  ${i.r}/${i.need}  "${i.t}"  ${i.cls}`);
        }
      }
    } catch (err) {
      console.log(`\n${theme.toUpperCase()} ${route} — ERROR ${err.message.split("\n")[0]}`);
    }
    await page.close();
  }
}

console.log(`\n${total === 0 ? "PASS — no contrast failures" : `TOTAL ${total} failures`}`);
await browser.close();
