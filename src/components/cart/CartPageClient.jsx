"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { QuantityStepper } from "@/components/cart/CartDrawer";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecentlyViewedRail } from "@/components/product/RecentlyViewed";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
/**
 * The full cart page. Same data and the same server actions as the drawer —
 * this is the roomier view for editing a large order before checkout.
 */
export function CartPageClient() {
  const { cart, setQuantity, remove, applyCoupon, removeCoupon, pending } = useCart();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState(null);
  const [applying, setApplying] = useState(false);
  const { totals, lines } = cart;
  useEffect(() => {
    if (!lines.length) return;
    analytics.viewCart(
      totals.grandTotal / 100,
      lines.map((l) => ({
        item_id: l.productId,
        item_name: l.productName,
        item_variant: l.variantName,
        price: l.unitPrice / 100,
        quantity: l.quantity,
      })),
    );
    // Once per mount, not on every quantity nudge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!lines.length) {
    return (
      <>
        <EmptyState
          icon="bag"
          className="mt-12"
          title="Your bag is empty"
          body="Nothing here yet. Everything we make starts as a seed — pick where yours begins."
          actionLabel="Explore the collection"
          actionHref="/shop"
          secondaryLabel="Start with leaf powder"
          secondaryHref="/shop/herbal-supplements"
        />
        <div className="mt-16">
          <RecentlyViewedRail />
        </div>
      </>
    );
  }
  const submitCoupon = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    setCouponError(await applyCoupon(code.trim()));
    setApplying(false);
    setCode("");
  };
  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
      {/* Lines */}
      <div>
        <p className="mb-6 text-sm text-cream-400">
          {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
        </p>

        <ul className="divide-y divide-border-subtle border-y border-border-subtle">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-5 py-7 md:gap-7">
              <Link
                href={`/product/${line.productSlug}`}
                className="relative h-28 w-24 shrink-0 overflow-hidden bg-ink-800 md:h-36 md:w-32"
              >
                {line.imageUrl ? (
                  <Image
                    src={line.imageUrl}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-contain p-3"
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.productSlug}`}
                      className="text-[1.05rem] leading-snug text-cream-50 hover:text-gold-300"
                    >
                      {line.productName}
                    </Link>
                    <p className="mt-1 text-sm text-cream-400">{line.variantName}</p>
                    {line.sku ? (
                      <p className="mt-0.5 text-xs text-cream-400">SKU {line.sku}</p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="tabular-nums text-cream-50">
                      {formatPrice(line.lineTotal)}
                    </p>
                    {line.quantity > 1 ? (
                      <p className="mt-0.5 text-xs tabular-nums text-cream-400">
                        {formatPrice(line.unitPrice)} each
                      </p>
                    ) : null}
                  </div>
                </div>

                {line.overStock ? (
                  <p className="mt-2 text-xs text-[#e0a19c]" role="status">
                    Only {line.available} in stock. Reduce the quantity to continue.
                  </p>
                ) : null}

                <div className="mt-auto flex items-center gap-5 pt-4">
                  <QuantityStepper
                    value={line.quantity}
                    max={Math.max(1, line.available)}
                    disabled={pending}
                    onChange={(next) => void setQuantity(line.id, next)}
                    label={`Quantity for ${line.productName}`}
                  />
                  <button
                    type="button"
                    onClick={() => void remove(line.id)}
                    className="text-xs text-cream-400 underline underline-offset-4 transition-colors hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-cream-300 hover:text-cream-50"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M8.5 3L4.5 7l4 4" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Continue shopping
        </Link>

        <div className="mt-16">
          <RecentlyViewedRail />
        </div>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-border-subtle bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-title text-cream-50">Summary</h2>

          {/* Free shipping meter */}
          <div className="mt-6">
            {totals.amountToFreeShipping > 0 ? (
              <p className="text-sm text-cream-300">
                Add{" "}
                <span className="text-gold-300">
                  {formatPrice(totals.amountToFreeShipping)}
                </span>{" "}
                for free shipping
              </p>
            ) : (
              <p className="text-sm text-leaf-300">Free shipping applied</p>
            )}
            <div className="mt-2 h-px w-full bg-border-subtle">
              <div
                className="h-px bg-gold-400 transition-[width] duration-700 ease-[var(--ease-organic)]"
                style={{
                  width: `${Math.min(100, (totals.subtotal / Math.max(1, totals.freeShippingThreshold)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Coupon */}
          <div className="mt-7 border-t border-border-subtle pt-6">
            {cart.coupon ? (
              <div className="flex items-center justify-between gap-3 border border-emerald-400/30 bg-emerald-500/8 px-3 py-2.5">
                <span className="text-xs text-leaf-200">
                  <strong className="font-medium">{cart.coupon.code}</strong>
                  {cart.coupon.description ? ` — ${cart.coupon.description}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => void removeCoupon()}
                  className="text-xs text-cream-400 underline underline-offset-2 hover:text-cream-100"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={submitCoupon} className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCouponError(null);
                  }}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className="min-w-0 flex-1 border border-border-subtle bg-white/[0.03] px-3 py-2.5 text-sm uppercase tracking-wider text-cream-50 placeholder:normal-case placeholder:tracking-normal placeholder:text-cream-400 focus:border-emerald-400 focus:outline-none"
                />
                <Button type="submit" variant="secondary" size="sm" loading={applying}>
                  Apply
                </Button>
              </form>
            )}

            {couponError ? (
              <p className="mt-2 text-xs text-[#e0a19c]" role="alert">
                {couponError}
              </p>
            ) : null}
            {cart.couponWarning ? (
              <p className="mt-2 text-xs text-[#e0a19c]" role="status">
                {cart.couponWarning}
              </p>
            ) : null}
          </div>

          {/* Totals */}
          <dl className="mt-7 grid gap-2.5 border-t border-border-subtle pt-6 text-sm">
            <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
            {totals.discountTotal > 0 ? (
              <Row
                label="Discount"
                value={`−${formatPrice(totals.discountTotal)}`}
                tone="positive"
              />
            ) : null}
            <Row
              label="Shipping"
              value={
                totals.shippingTotal === 0 ? "Free" : formatPrice(totals.shippingTotal)
              }
            />
            <Row label="Tax" value="Included" muted />

            <div className="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-4">
              <dt className="text-cream-100">Estimated total</dt>
              <dd className="text-xl tabular-nums text-cream-50">
                {formatPrice(totals.grandTotal)}
              </dd>
            </div>
          </dl>

          <LinkButton
            href="/checkout"
            size="lg"
            className="mt-7 w-full"
            magnetic
            onClick={() =>
              analytics.beginCheckout(
                totals.grandTotal / 100,
                lines.map((l) => ({
                  item_id: l.productId,
                  item_name: l.productName,
                  item_variant: l.variantName,
                  price: l.unitPrice / 100,
                  quantity: l.quantity,
                })),
                cart.coupon?.code,
              )
            }
          >
            Proceed to checkout
          </LinkButton>

          <ul className="mt-6 grid gap-2 text-xs text-cream-400">
            <li>Secure payment — card, UPI, net banking or cash on delivery</li>
            <li>Packed within 1–2 working days</li>
            <li>Shipped across India</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
function Row({ label, value, tone, muted }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-cream-400">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          tone === "positive"
            ? "text-leaf-300"
            : muted
              ? "text-cream-400"
              : "text-cream-200",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
