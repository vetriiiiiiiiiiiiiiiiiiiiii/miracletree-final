# Going live

Everything here needs a value only you can supply. Nothing in this list needs
code written — each is a paste, a toggle, or a decision.

Work down the list; the order matters only in that the database has to move
before anything else is worth doing.

---

## 1. Database — SQLite to Postgres

The schema is deliberately portable: no native enums, no scalar lists, no
provider-specific column types. Switching is one line.

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then point `DATABASE_URL` at the new server and push:

```bash
npx prisma db push && npm run db:seed
```

`db:seed` is idempotent — it clears and rewrites the catalogue, the story
content and the admin account, and is safe to re-run. Do **not** run it against
a database that already has real orders in it; it truncates content tables.

**Where:** Neon, Supabase and Railway all work. Whatever you pick, take the
*pooled* connection string for `DATABASE_URL` if the host offers one, since
serverless functions open a connection per invocation.

---

## 2. Razorpay

Three secrets, from the Razorpay dashboard:

| Variable | Where it comes from |
|---|---|
| `RAZORPAY_KEY_ID` | Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | shown once when the key is generated |
| `RAZORPAY_WEBHOOK_SECRET` | Settings → Webhooks, when you add the endpoint |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same value as `RAZORPAY_KEY_ID` |

Only the last is public, and it is the key *id*, never the secret.

**Webhook endpoint:** `https://your-domain/api/payments/razorpay/webhook`,
subscribed to `payment.captured`, `order.paid` and `payment.failed`.

The webhook is the authoritative path — the browser callback can be closed,
blocked or simply lost, and the webhook always arrives. Both routes converge on
the same idempotent `markOrderPaid`, so whichever wins the race the result is
identical.

**Leaving these blank is a supported state:** checkout runs cash-on-delivery
only. That is a reasonable way to open.

---

## 3. Email

Nothing is wired up. Order confirmations, password resets and back-in-stock
notices all currently go nowhere.

Pick a provider (Resend and Postmark both have simple APIs and good Indian
deliverability), then implement the single sending function the app already
expects. It is the only integration point — nothing else needs to change.

Until this is done, **password reset cannot complete**: the token is generated
and stored correctly, but the shopper never receives the link.

---

## 4. Stock reservation sweep

An unpaid order holds its stock until it is paid or cancelled. Abandoned
checkouts would otherwise hold it for ever, and a product reports itself sold
out while the shelves are full.

Run the sweep on a schedule:

```bash
*/10 * * * * cd /srv/miracle && node scripts/sweep-reservations.mjs
```

It only ever touches orders that are still `pending` **and** still `unpaid`, it
is a no-op when there are none, and it is safe to run concurrently with traffic.

If you have nowhere to run cron, the app already sweeps opportunistically on
roughly one page load in fifty, so stock cannot leak indefinitely either way.
The scheduled version is still the one to prefer — it is predictable.

`RESERVATION_TTL_MINUTES` (default 45) controls how long an unpaid order keeps
its hold.

---

## 5. Legal review

These pages are written and readable, but they are **drafts** and have not been
reviewed by anyone qualified:

- `/privacy`
- `/returns`
- `/shipping`
- `/terms`

They need a lawyer's eye before launch, specifically on the refund window, the
shipping-damage terms, and the personal-data claims in the privacy page. All
four are database rows, editable under **Admin → Settings** — no deployment is
needed to correct them, and the change takes effect immediately.

---

## 6. Domain and hosting

Set `NEXT_PUBLIC_SITE_URL` to the real origin. It is used for canonical URLs,
`sitemap.xml`, Open Graph tags and the JSON-LD organisation record, so getting
it wrong is quietly bad for search rather than loudly broken.

Vercel is the path of least resistance. Two things to know:

- **Uploads are written to `public/uploads`**, which does not survive a
  serverless deploy. Swap the `persist` function in
  `src/app/api/admin/upload/route.ts` for an S3 or R2 put — it is isolated
  there precisely so nothing else has to change.
- **HSTS and `upgrade-insecure-requests` are production-only** by design. They
  once pinned `localhost` to HTTPS in a browser for two years and broke local
  development entirely; `next.config.ts` now gates both behind `isProduction`.

---

## 7. Change the admin password

The seed creates `admin@miracletree.in` with the password from
`SEED_ADMIN_PASSWORD`. Change it after the first sign-in. Anyone who has read
this repository knows the default.

---

## Already handled

For completeness, so you do not go looking:

- Rate limiting on every API route, and on coupon attempts and sign-in.
- Coupon restrictions — first-order-only, per-customer limits, and
  product/category scoping — are enforced, not merely stored.
- Razorpay webhook signature verification, with throttling applied *only* to
  requests that fail it, so genuine retries are never dropped.
- CSP, HSTS, `X-Content-Type-Options`, frame-ancestors.
- Uploaded images are decoded and re-encoded through sharp, which strips EXIF
  including GPS and guarantees the file really is an image.
- Every admin action re-checks the actor's role against the database, not
  against the token.
