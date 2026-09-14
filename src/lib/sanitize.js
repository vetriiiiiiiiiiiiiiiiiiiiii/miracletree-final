/**
 * HTML sanitiser for admin-authored rich text (product descriptions, articles).
 *
 * Allow-list based, not deny-list: anything not explicitly permitted is dropped.
 * Applied on write, in the admin actions, and again on render — the second pass
 * costs almost nothing and means legacy rows imported from elsewhere cannot
 * carry a payload through.
 */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "sub",
  "sup",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
]);
const ALLOWED_ATTRS = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
};
/** Only these URL schemes may appear in href/src. */
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;
export function sanitizeHtml(input) {
  if (!input) return "";
  let html = input;
  // Remove entire dangerous elements including their content.
  html = html.replace(
    /<(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base|svg|math)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  // …and their self-closing / unclosed forms.
  html = html.replace(
    /<(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base)\b[^>]*\/?>/gi,
    "",
  );
  // HTML comments can hide conditional-comment script in old engines.
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(
    /<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^>]*?)?)\s*(\/?)>/g,
    (_match, closing, rawName, rawAttrs, selfClose) => {
      const tag = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return `</${tag}>`;
      const attrs = sanitizeAttributes(tag, rawAttrs ?? "");
      return `<${tag}${attrs}${selfClose ? " /" : ""}>`;
    },
  );
  return html.trim();
}
function sanitizeAttributes(tag, raw) {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed || !raw.trim()) return "";
  const out = [];
  const pattern =
    /([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match;
  while ((match = pattern.exec(raw)) !== null) {
    const name = match[1].toLowerCase();
    const value = (match[3] ?? match[4] ?? match[5] ?? "").trim();
    // Every on* handler is rejected regardless of tag.
    if (name.startsWith("on")) continue;
    if (!allowed.has(name)) continue;
    if ((name === "href" || name === "src") && !SAFE_URL.test(value)) continue;
    out.push(`${name}="${escapeAttr(value)}"`);
  }
  // External links get rel="noopener noreferrer" whether the author added it or not.
  if (tag === "a") {
    const href = out.find((a) => a.startsWith("href="));
    if (href && /^href="https?:/i.test(href)) {
      if (!out.some((a) => a.startsWith("target="))) out.push('target="_blank"');
      const relIndex = out.findIndex((a) => a.startsWith("rel="));
      if (relIndex >= 0) out.splice(relIndex, 1);
      out.push('rel="noopener noreferrer"');
    }
  }
  return out.length ? ` ${out.join(" ")}` : "";
}
function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
