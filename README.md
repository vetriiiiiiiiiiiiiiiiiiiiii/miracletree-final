# Miracle Tree

A complete e-commerce platform for **Miracletree Life Science** (Madurai, Tamil Nadu) — storefront, checkout, customer accounts, and a full admin CMS.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Prisma, GSAP and Three.js.

---

## Quick start

```bash
npm install
npm run setup
npm run dev
```

`npm run setup` generates the Prisma client, creates the database and seeds it with the real catalogue.

Then open http://localhost:3000 and sign in to the admin at http://localhost:3000/admin.

**Seeded admin:** `admin@miracletree.in` / `ChangeMe!2026` — change this immediately (Account → Your details, or reseed with different `SEED_ADMIN_*` values).

---

## What's in the database

The catalogue is **real**, ingested from the live store's public `products.json` feed, not invented:

| | |
|---|---|
| Products | 27 |
| Variants | 48 |
| Product images | 90 (Shopify CDN URLs) |
| Categories | 5 |
| FAQs | 14 |
| Journal articles | 3 |
| Timeline milestones | 7 (each cited) |
| Awards & certifications | 8 (each cited) |
| Testimonials | 2 (real quotes carried over from the old site) |
| Reviews | **0** |
| Orders | 0 |

Two deliberate zeros:

- **No reviews are seeded.** Every review on the site must be submitted by a real customer and approved in the admin. The homepage and product pages state honestly when there are none yet.
- **No orders are seeded**, so your first dashboard numbers are real ones.

Product **benefits** are extracted from the brand's own bullet copy in the original descriptions — no health claims were written for this build. Every product page carries a compliance note stating these are foods, not medicines.

---

## Our Story

`/about` is drawn as a naturalist's field notebook — warm paper, ruled lines, hand-drawn botanical plates whose strokes draw themselves in on scroll. It is the only light surface on the site, and that is deliberate: it should read as an object that was kept rather than a page that was designed.

**The journal lives inside it.** Field notes were previously a separate section competing with the story for the same visitor; they are now a chapter of it, which is where they belong. `/journal` redirects to `/about#field-notes`, and individual articles keep their own URLs at `/journal/<slug>` so nothing already indexed breaks.

Sections: the origin, a dated timeline, awards and certification, field notes, and credits.

### Every claim is cited

The history is **researched, not written**. Founders, dates, the farm, the awards and the certifications come from published sources, and each row carries a link to where it was published:

- [Government of Tamil Nadu feature](https://www.gotn.in/miracletree-marketing-the-moringa/) — founders, the 2009 start, 80 acres at Sirumalai, 11,000 trees, the 2022–23 Best Agriculturist award, research in twenty universities, forty grower families
- [IndiaMART trade profile](https://www.indiamart.com/miracletreelifescience/about-us.html) — 2015 incorporation, GMP, HALAL 2019–20, APEDA registration, export markets
- [Company records](https://www.thecompanycheck.com/org/miracle-tree-life-science/f4e22bc825) — partnership firm, registration date

This is not decoration. On a food brand an award or certification a reader cannot trace is a legal exposure, so `sourceUrl` is part of the `Milestone` and `Accolade` models rather than an afterthought. **Anything the sources did not support is simply absent** — add it from admin once the business confirms it.

Timeline, awards and credits are database rows (`Milestone`, `Accolade`, `Credit`), so the business can extend its own history without a deploy.

---

## The cursor

On pointer devices the cursor is a winged moringa seed — **and nothing else**. No ring, no box, no text label. State is expressed through the plant:

| | |
|---|---|
| at rest | the seed tumbles as it travels, rotation driven by pointer velocity — a flick spins it, a slow drift barely turns it |
| over a link | it leans in and grows slightly |
| over a product or image | it **germinates**: a pair of leaflets unfurls from the seed |
| over a text field | the native caret returns — a seed cannot show you a column |

A short chain of shed leaflets trails behind, each lagging further than the last. That trail is the only thing standing in for a conventional trailing ring.

Disabled entirely on touch and under `prefers-reduced-motion`, and the native cursor is only hidden once JavaScript has actually taken over.

**Two attribute names, deliberately:** elements declare intent with `data-cursor="view"`, while the document-level state lives on `data-cursor-mode`. Sharing one name puts a `data-cursor` on `<html>`, which `closest("[data-cursor]")` then matches for every element on the page — so nothing below it is ever detected.

### Using the real photograph

The shipped cursor is a drawing (`src/components/motion/SeedCursor.tsx`) — at 44px a photograph turns to mush, while line and gradient stay legible. To use a photo instead:

```bash
# save the image first, then:
node scripts/make-cursor.mjs public/cursor/source.png
```

The script trims the white field, keys the white background out to transparency with a soft ramp so a pale husk is not cut away with it, and writes `public/cursor/seed.webp` at 128px. **The site picks it up automatically** — the component probes for that file on mount and swaps the drawing for the photograph if it loads. No code change.

---

## Environment

Copy `.env.example` to `.env`. Only the first three are required to run.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Database connection |
| `AUTH_SECRET` | yes | Session signing key, 32+ chars |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical URLs, sitemap, OG tags |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | seed only | First admin account |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for card/UPI | Payment gateway |
| `RAZORPAY_WEBHOOK_SECRET` | for card/UPI | Verifies payment webhooks |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | for card/UPI | Public key for the checkout widget |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Google Analytics 4 |
| `GOOGLE_SITE_VERIFICATION` | optional | Search Console verification tag |

Generate a secret with `openssl rand -base64 48`.

**Without Razorpay keys the store still works** — checkout runs in cash-on-delivery-only mode and says so.

---

## Architecture decisions

**Money is always an integer number of paise.** Never a float, never a decimal string. `formatPrice()` in `src/lib/money.ts` is the only place rupees are produced, so rounding happens exactly once.

**Prices and stock are re-read on the server for every cart and checkout operation.** The client sends ids and quantities; it never sends a price, a total or a discount.

**Stock has three states, not two.** Placing an order *reserves* units (`reserved` rises, `onHand` is untouched). Dispatching *commits* them (both fall). Cancelling *releases* them. Every transition writes an `InventoryMovement`, so the current number is explained by a ledger rather than merely asserted. Reservation happens inside the same transaction that creates the order, so two shoppers cannot both claim the last unit.

**Authorization is checked against the database, never the token.** Middleware does a fast JWT check to keep unauthenticated users out of `/admin`, but every admin action calls `requireAdmin()`, which re-reads the user's role. A revoked role takes effect immediately rather than when the token expires.

**Payments are confirmed by signature, not by the browser.** The Razorpay webhook is the authoritative path; the browser callback is a convenience. Both converge on the same idempotent `markOrderPaid()`, so whichever arrives first the result is identical.

**The schema is portable.** No native enums, no scalar lists — status fields are strings validated by the unions in `src/lib/constants.ts`. Moving from SQLite to Postgres is a one-line change (below).

**Rich text is sanitised twice** — on write in the admin action, and again on render. The allow-list sanitiser is in `src/lib/sanitize.ts`.

---

## Going to production

### 1. Switch to PostgreSQL

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Point `DATABASE_URL` at your Postgres instance, then:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

No application code changes are needed — the schema was written to be portable.

### 2. Payments

Add your Razorpay keys, then register the webhook in the Razorpay dashboard:

- **URL:** `https://yourdomain.com/api/payments/razorpay/webhook`
- **Events:** `payment.captured`, `payment.failed`, `order.paid`
- **Secret:** the same value as `RAZORPAY_WEBHOOK_SECRET`

### 3. Media storage

Uploads currently write to `public/uploads`, which is fine for a single server. For a multi-instance deployment, replace the `persist()` function in `src/app/api/admin/upload/route.ts` with an S3/R2 put — nothing else changes.

### 4. Email

Two flows currently have no delivery mechanism and need an email provider wired in:

- **Password reset** — the token is generated, hashed and stored correctly; the link is logged server-side in development instead of being sent. See `forgotPasswordAction` in `src/app/actions/auth.ts`.
- **Contact form** — submissions are recorded in the audit log (Admin → Settings → Activity) so nothing is lost, but no email is sent.

Order confirmation emails are also not sent. The confirmation page and account order history cover the customer-facing need until a provider is added.

### 5. Google Search Console

1. Deploy with `NEXT_PUBLIC_SITE_URL` set to the real domain. `robots.txt` blocks all crawling on any other host, so staging cannot be indexed by accident.
2. Add the property in Search Console, choose the HTML-tag method, and set `GOOGLE_SITE_VERIFICATION` to the token. It renders on every page.
3. Submit `https://yourdomain.com/sitemap.xml`. It is generated from the database and includes every published product, category and article, with `lastModified` from each row's own `updatedAt`.
4. Check **Enhancements → Products** and **Breadcrumbs** after the first crawl. Product, Organization, WebSite, BreadcrumbList, ItemList, Article and FAQPage structured data are already emitted. Rating markup only appears when a product genuinely has approved reviews.
5. The old Shopify URL shapes (`/products/…`, `/collections/…`, `/pages/…`, `/policies/…`) are 301-redirected in `next.config.ts`, so existing indexed links and inbound traffic keep working.

---

## Admin

`/admin` — sign in with a `staff` or `admin` account. Press <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> anywhere for the command palette.

| Screen | What it does |
|---|---|
| Dashboard | 30-day revenue, orders, customers, low stock, top sellers |
| Products | Full CRUD, duplicate, archive, bulk publish; tabbed editor for media, pricing, variants, description, SEO |
| Inventory | Stock levels with reserved/available split; adjustments require a reason and are logged |
| Orders | Status lifecycle with stock consequences stated before you commit them; tracking, notes, timeline |
| Customers | Order history, lifetime spend, addresses, internal notes, role management |
| Promotions | Percentage, fixed and free-shipping codes with limits, windows and usage caps |
| Reviews | Approve, reject, feature, mark verified. Nothing publishes without approval |
| Homepage | Reorder, enable/disable and edit every section of the homepage |
| FAQs / Testimonials / Navigation / Categories / Announcements | Content CRUD |
| Journal | Article editor with live preview and per-article SEO |
| Media | Upload library; images are re-encoded to WebP, resized and stripped of EXIF |
| Settings | Shipping thresholds, COD toggle, default SEO, all four policy pages, activity log |

**Roles:** `admin` has full access. `staff` can manage orders, stock and content but cannot delete products or articles, or change anyone's role. Nobody can change their own role, and the last remaining admin cannot be demoted.

### Nothing important is hardcoded

Products, prices, FAQs, testimonials, articles, homepage copy, navigation, categories, promotions, announcements and all four policy pages are database rows, editable from the admin. Only UI labels, system logic and design tokens live in code.

---

## Scripts

```bash
npm run dev          # development server
npm run test:e2e     # full Playwright suite (49 tests, desktop + mobile)
npm run shots        # capture screenshots of every chapter into shots/
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # TypeScript, no emit
npm run db:seed      # reseed (clears and re-imports the catalogue)
npm run db:studio    # Prisma Studio
npm run setup        # generate + push + seed, for a fresh clone
node scripts/a11y-audit.mjs [baseUrl]   # alt text, labels, heading order, landmarks
```

---

## Verified

`npm run test:e2e` runs 49 Playwright tests against a **production build** across desktop and a Pixel 7, with WebGL forced through SwiftShader so the 3D scene renders identically without a GPU.

Covered: the seven-chapter journey renders and does not leak over the sections below it; shop listing, category filtering and search; discount badges are sanity-checked for plausibility; product page price, variants and stock; add-to-bag with exact totals (₹160 + ₹60 shipping = ₹220, ₹539 to the free-shipping threshold); quick view; checkout rejecting an invalid PIN; a complete cash-on-delivery order; the branded 404; every policy page; admin sign-in, dashboard figures, product editing that persists, inventory adjustment, the command palette, and every admin screen rendering.

Also asserted as *failures*: every admin route redirects when signed out, the upload endpoint returns 401 unauthenticated, and the payment webhook returns 400/401 for a missing or forged signature.

Two tests assert no console errors on the homepage and product page, so a regression that only shows up at runtime fails the build rather than shipping.

`npm run shots` writes a screenshot of each chapter and each key page to `shots/` — the fastest way to review the 3D work after a change.

Accessibility (`node scripts/a11y-audit.mjs`): one `h1` per page, no heading skips, every image has `alt`, every input is labelled, every control has an accessible name, `main` landmark and skip link throughout. Every foreground/background pair in the palette passes WCAG AA; the lowest is 5.0:1.

## Known limitations

Things a developer cannot honestly supply, listed plainly:

- **Cinematic macro footage.** The brief asked for a filmed seed→sprout→leaf sequence. Rather than fake it with generic procedural 3D — which the brief also rules out — the hero uses a WebGL particle field for atmosphere, hand-drawn botanical linework for the germination, and the brand's real product photography for the payoff. If macro video is shot later it drops into the hero's media slot without a rewrite.
- **Policy pages need legal review.** The returns and payment text is carried over from the store's own published policy. Shipping and privacy were never published on the old site, so those state only what is observably true of this store. All four are editable in Admin → Settings.
- **No 3D product models.** The schema, admin field and lazy-loading path exist; no `.glb` assets were provided, and the site falls back to photography.
- **Product images are still served from Shopify's CDN.** They are the brand's own photographs and the URLs are stable, but they should be migrated onto your own storage before the Shopify account is closed. Upload them in Admin → Media and swap the URLs.
- **Email delivery** is not wired (see *Going to production*).
- **Recommendations are rule-based** — admin-set relations first, then same-category fill. The `ProductRelation` model supports cross-sell and upsell kinds for a smarter engine later.
