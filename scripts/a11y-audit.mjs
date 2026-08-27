/**
 * Static accessibility sweep over the server-rendered HTML: alt text, form
 * labels, accessible names, heading order, landmarks and lang.
 */
const BASE = process.argv[2] ?? "http://127.0.0.1:59161";
const PAGES = ["/", "/shop", "/product/moringa-leaf-powder-hpd-dried", "/faq", "/contact", "/cart", "/journal", "/moringa", "/login"];

const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

for (const page of PAGES) {
  const html = await (await fetch(BASE + page)).text();

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt\s*=/.test(t));

  const inputs = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => !/type\s*=\s*["']hidden["']/i.test(t));
  const unlabelled = inputs.filter(
    (t) => !/aria-label\s*=/.test(t) && !/aria-labelledby\s*=/.test(t) && !/\bid\s*=/.test(t),
  );

  const buttons = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)];
  const nameless = buttons.filter(
    (m) => !strip(m[1]) && !/aria-label\s*=/.test(m[0]) && !/sr-only/.test(m[1]),
  );

  const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => +m[1]);
  const skips = [];
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) skips.push(`${headings[i - 1]}->${headings[i]}`);
  }

  console.log(
    [
      page.padEnd(42),
      `h1:${(html.match(/<h1\b/gi) || []).length}`,
      `imgNoAlt:${noAlt.length}/${imgs.length}`,
      `inputNoLabel:${unlabelled.length}/${inputs.length}`,
      `btnNoName:${nameless.length}`,
      `hSkips:${skips.length ? skips.slice(0, 2).join(",") : "0"}`,
      `main:${(html.match(/<main\b/gi) || []).length}`,
      `lang:${/(<html[^>]*lang="([^"]+)")/.exec(html)?.[2] ?? "MISSING"}`,
      `skipLink:${/Skip to content/.test(html) ? "y" : "n"}`,
    ].join("  "),
  );
}
