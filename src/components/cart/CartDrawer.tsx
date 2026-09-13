"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Drawer, DrawerHeader } from "@/components/ui/Drawer";
import { Button, LinkButton } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

export function CartDrawer() {
  const { cart, isOpen, close, setQuantity, remove, applyCoupon, removeCoupon, pending } =
    useCart();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const { totals } = cart;
  const progress = Math.min(
    100,
    (totals.subtotal / Math.max(1, totals.freeShippingThreshold)) * 100,
  );

  const submitCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    setCouponError(await applyCoupon(code.trim()));
    setApplying(false);
    setCode("");
  };

  return (
    <Drawer open={isOpen} onClose={close} title="Your bag" side="right">
      <DrawerHeader
        title="Your bag"
        subtitle={cart.itemCount ? `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}` : undefined}
        onClose={close}
      />

      {cart.lines.length === 0 ? (
        <EmptyBag onClose={close} />
      ) : (
        <>
          {/* Free-shipping meter: a real, useful nudge rather than decoration. */}
          <div className="border-b border-border-subtle px-6 py-4">
            {totals.amountToFreeShipping > 0 ? (
              <p className="text-xs text-cream-300">
                <span className="text-gold-300">
                  {formatPrice(totals.amountToFreeShipping)}
                </span>{" "}
                away from free shipping
              </p>
            ) : (
              <p className="text-xs text-leaf-300">Free shipping unlocked</p>
            )}
            <div className="mt-2 h-px w-full bg-border-subtle">
              <div
                className="h-px bg-gold-400 transition-[width] duration-700 ease-[var(--ease-organic)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ul className="flex-1 divide-y divide-border-subtle overflow-y-auto px-6">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex gap-4 py-5">
                <Link
                  href={`/product/${line.productSlug}`}
                  onClick={close}
                  className="relative h-24 w-20 shrink-0 overflow-hidden bg-ink-800"
                >
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${line.productSlug}`}
                        onClick={close}
                        className="block truncate text-sm text-cream-50 hover:text-gold-300"
                      >
                        {line.productName}
                      </Link>
                      <p className="mt-0.5 text-xs text-cream-400">{line.variantName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(line.id)}
                      className="shrink-0 p-1 text-cream-400 transition-colors hover:text-danger"
                      aria-label={`Remove ${line.productName} from bag`}
                    >
                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    </button>
                  </div>

                  {line.overStock ? (
                    <p className="mt-1 text-xs text-[#e0a19c]">
                      Only {line.available} left — quantity will be reduced at checkout.
                    </p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <QuantityStepper
                      value={line.quantity}
                      max={Math.max(1, line.available)}
                      disabled={pending}
                      onChange={(next) => void setQuantity(line.id, next)}
                      label={`Quantity for ${line.productName}`}
                    />
                    <span className="text-sm tabular-nums text-cream-100">
                      {formatPrice(line.lineTotal)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-border-subtle px-6 py-5">
            {cart.coupon ? (
              <div className="mb-4 flex items-center justify-between gap-3 border border-emerald-400/30 bg-emerald-500/8 px-3 py-2.5">
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
              <form onSubmit={submitCoupon} className="mb-4 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCouponError(null);
                  }}
                  placeholder="Discount code"
                  aria-label="Discount code"
                  className="min-w-0 flex-1 border border-border-subtle bg-white/[0.03] px-3 py-2.5 text-sm uppercase tracking-wider text-cream-50 placeholder:normal-case placeholder:tracking-normal placeholder:text-cream-400 focus:border-emerald-400 focus:outline-none"
                />
                <Button type="submit" variant="secondary" size="sm" loading={applying}>
                  Apply
                </Button>
              </form>
            )}

            {couponError ? (
              <p className="mb-3 text-xs text-[#e0a19c]" role="alert">
                {couponError}
              </p>
            ) : null}
            {cart.couponWarning ? (
              <p className="mb-3 text-xs text-[#e0a19c]" role="status">
                {cart.couponWarning}
              </p>
            ) : null}

            <dl className="grid gap-1.5 text-sm">
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
                value={totals.shippingTotal === 0 ? "Free" : formatPrice(totals.shippingTotal)}
              />
              <div className="mt-2 flex items-baseline justify-between border-t border-border-subtle pt-3">
                <dt className="text-cream-100">Total</dt>
                <dd className="text-lg tabular-nums text-cream-50">
                  {formatPrice(totals.grandTotal)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 grid gap-2">
              <LinkButton
                href="/checkout"
                size="lg"
                className="w-full"
                onClick={() => {
                  close();
                  analytics.beginCheckout(
                    totals.grandTotal / 100,
                    cart.lines.map((l) => ({
                      item_id: l.productId,
                      item_name: l.productName,
                      item_variant: l.variantName,
                      price: l.unitPrice / 100,
                      quantity: l.quantity,
                    })),
                    cart.coupon?.code,
                  );
                }}
              >
                Checkout
              </LinkButton>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={close}
                  className="py-2 text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
                >
                  Continue shopping
                </button>
                <Link
                  href="/cart"
                  onClick={close}
                  className="py-2 text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
                >
                  View full bag
                </Link>
              </div>
            </div>

            <p className="mt-4 text-center text-[0.65rem] uppercase tracking-[0.14em] text-cream-400">
              Secure checkout · Ships across India
            </p>
          </div>
        </>
      )}
    </Drawer>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-cream-400">{label}</dt>
      <dd className={cn("tabular-nums", tone === "positive" ? "text-leaf-300" : "text-cream-200")}>
        {value}
      </dd>
    </div>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  label,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="inline-flex items-center border border-border-subtle" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        className="grid h-8 w-8 place-items-center text-cream-300 transition-colors hover:text-cream-50 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M1 5h8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
      <span className="min-w-8 text-center text-sm tabular-nums text-cream-50" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        className="grid h-8 w-8 place-items-center text-cream-300 transition-colors hover:text-cream-50 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
    </div>
  );
}

function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
      <svg width="56" height="56" viewBox="0 0 40 40" fill="none" aria-hidden className="text-border-subtle">
        <path
          d="M20 34C20 34 6 28 6 16C6 9 12 4 20 4C28 4 34 9 34 16C34 28 20 34 20 34Z"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path d="M20 34V10" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div>
        <p className="text-lg text-cream-100">Your bag is empty</p>
        <p className="mt-2 text-sm text-cream-400">
          Everything here starts as a seed. Pick where yours begins.
        </p>
      </div>
      <div className="grid w-full gap-2">
        <LinkButton href="/shop" size="md" className="w-full" onClick={onClose}>
          Explore the collection
        </LinkButton>
        <LinkButton
          href="/shop/herbal-supplements"
          variant="secondary"
          size="md"
          className="w-full"
          onClick={onClose}
        >
          Start with leaf powder
        </LinkButton>
      </div>
    </div>
  );
}
