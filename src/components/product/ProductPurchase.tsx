"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/cart/CartDrawer";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useCart } from "@/components/cart/CartProvider";
import { analytics } from "@/lib/analytics";

export type PurchaseVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  available: number;
  tracked: boolean;
};

/**
 * The buy box. Price, stock and the selected size are all derived from one
 * `selected` variant, so the number a shopper sees is always the number they
 * will be charged.
 */
export function ProductPurchase({
  productId,
  productName,
  categoryName,
  variants,
  onVariantChange,
}: {
  productId: string;
  productName: string;
  categoryName?: string | null;
  variants: PurchaseVariant[];
  onVariantChange?: (variant: PurchaseVariant) => void;
}) {
  const router = useRouter();
  const { add } = useCart();

  // Open on the first variant that can actually be bought.
  const initialIndex = Math.max(
    0,
    variants.findIndex((v) => !v.tracked || v.available > 0),
  );
  const [index, setIndex] = useState(initialIndex);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"add" | "buy" | null>(null);

  // The sticky bar watches the real buy box and takes over once it has
  // scrolled out of sight, so the two can never disagree about the variant,
  // the quantity or the price: there is only one of each.
  const actionsRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    const node = actionsRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only when the buy box has gone *up* off the screen. Firing while it
        // is still below the fold would show the bar before the shopper has
        // even reached the product.
        setStuck(!entry!.isIntersecting && entry!.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [portalReady]);

  const selected = variants[index];

  useEffect(() => {
    if (selected) onVariantChange?.(selected);
  }, [selected, onVariantChange]);

  useEffect(() => {
    if (!selected) return;
    analytics.viewItem({
      item_id: productId,
      item_name: productName,
      item_category: categoryName ?? undefined,
      item_variant: selected.name,
      price: selected.price / 100,
    });
    // Reporting once per product view, not once per variant click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const stock = useMemo(() => {
    if (!selected) return { level: "out" as const, text: "Unavailable" };
    if (!selected.tracked) return { level: "in" as const, text: "In stock" };
    if (selected.available <= 0) return { level: "out" as const, text: "Out of stock" };
    if (selected.available <= 5)
      return { level: "low" as const, text: `Only ${selected.available} left` };
    return { level: "in" as const, text: "In stock" };
  }, [selected]);

  const maxQuantity = selected
    ? selected.tracked
      ? Math.max(1, Math.min(10, selected.available))
      : 10
    : 1;

  const discount = selected ? discountPercent(selected.price, selected.compareAtPrice) : null;

  const handleAdd = async (then: "stay" | "checkout") => {
    if (!selected) return;
    setBusy(then === "stay" ? "add" : "buy");

    const ok = await add({
      productId,
      variantId: selected.id,
      quantity,
      meta: {
        name: productName,
        variantName: selected.name,
        price: selected.price,
        category: categoryName ?? undefined,
      },
    });

    setBusy(null);
    if (ok && then === "checkout") router.push("/checkout");
  };

  if (!selected) return null;

  return (
    <div className="grid gap-7">
      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-[1.9rem] tabular-nums text-cream-50">
          {formatPrice(selected.price)}
        </span>
        {selected.compareAtPrice && selected.compareAtPrice > selected.price ? (
          <>
            <span className="text-lg tabular-nums text-cream-400 line-through">
              {formatPrice(selected.compareAtPrice)}
            </span>
            {discount ? (
              <span className="border border-gold-400/40 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-gold-300">
                Save {discount}%
              </span>
            ) : null}
          </>
        ) : null}
        <span className="w-full text-xs text-cream-400">Inclusive of all taxes</span>
      </div>

      {/* Variants */}
      {variants.length > 1 ? (
        <fieldset>
          <legend className="eyebrow mb-3 text-cream-400">
            Size
            <span className="ml-2 normal-case tracking-normal text-cream-200">
              {selected.name}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant, i) => {
              const soldOut = variant.tracked && variant.available <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setQuantity(1);
                  }}
                  aria-pressed={i === index}
                  disabled={soldOut}
                  className={cn(
                    "relative border px-4 py-2.5 text-sm transition-colors duration-300",
                    i === index
                      ? "border-gold-400 text-cream-50"
                      : "border-border-subtle text-cream-300 hover:border-border-strong",
                    soldOut && "cursor-not-allowed text-cream-400",
                  )}
                >
                  {variant.name}
                  {soldOut ? (
                    <span
                      aria-hidden
                      className="absolute left-2 right-2 top-1/2 h-px -rotate-6 bg-cream-400/40"
                    />
                  ) : null}
                  {soldOut ? <span className="sr-only"> — out of stock</span> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/* Stock */}
      <p className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            stock.level === "in" && "bg-emerald-400",
            stock.level === "low" && "bg-gold-400",
            stock.level === "out" && "bg-danger",
          )}
          aria-hidden
        />
        <span
          className={cn(
            stock.level === "out" ? "text-[#e0a19c]" : "text-cream-300",
          )}
        >
          {stock.text}
        </span>
        {selected.sku ? (
          <span className="ml-auto text-xs text-cream-400">SKU {selected.sku}</span>
        ) : null}
      </p>

      {/* Quantity + actions */}
      {stock.level !== "out" ? (
        <div className="grid gap-4" ref={actionsRef}>
          <div className="flex items-center gap-4">
            <QuantityStepper
              value={quantity}
              max={maxQuantity}
              onChange={setQuantity}
              label={`Quantity of ${productName}`}
            />
            <span className="text-sm text-cream-400">
              Total{" "}
              <span className="tabular-nums text-cream-100">
                {formatPrice(selected.price * quantity)}
              </span>
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button
              size="lg"
              variant="primary"
              magnetic
              loading={busy === "add"}
              disabled={busy !== null}
              onClick={() => handleAdd("stay")}
            >
              Add to bag
            </Button>
            <Button
              size="lg"
              variant="gold"
              magnetic
              loading={busy === "buy"}
              disabled={busy !== null}
              onClick={() => handleAdd("checkout")}
            >
              Buy now
            </Button>
          </div>

          <WishlistButton
            productId={productId}
            productName={productName}
            showLabel
            className="-ml-2 justify-self-start"
          />
        </div>
      ) : (
        <div className="border border-border-subtle bg-white/[0.02] p-5">
          <p className="text-sm text-cream-200">
            This size is sold out. Pick another size above, or check back — we restock
            after each harvest.
          </p>
          <WishlistButton
            productId={productId}
            productName={productName}
            showLabel
            className="-ml-2 mt-3"
          />
        </div>
      )}

      {/* Trust */}
      <ul className="grid gap-3 border-t border-border-subtle pt-6 text-sm text-cream-400">
        <TrustRow icon="ship">
          Free shipping over ₹699 · flat ₹60 below that
        </TrustRow>
        <TrustRow icon="pack">Packed within 1–2 working days, shipped across India</TrustRow>
        <TrustRow icon="leaf">Shade-dried below 40°C · no colouring, no preservatives</TrustRow>
        <TrustRow icon="lock">Secure payment by card, UPI, net banking or COD</TrustRow>
      </ul>

      {/* Rendered into the body because a fixed element inside a transformed
          ancestor is positioned against that ancestor, not the viewport, and
          the product page animates its columns on reveal. */}
      {portalReady && stock.level !== "out"
        ? createPortal(
            <StickyBuyBar
              show={stuck}
              productName={productName}
              variantName={variants.length > 1 ? selected.name : null}
              image={selected.imageUrl}
              total={selected.price * quantity}
              quantity={quantity}
              busy={busy}
              onAdd={() => handleAdd("stay")}
              onBuy={() => handleAdd("checkout")}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * The buy box, condensed, once the real one has scrolled away.
 *
 * It is always mounted while the product is purchasable and slides out of
 * view rather than unmounting, so the transition runs in both directions and
 * focus is never pulled out from under someone tabbing through the page.
 * `inert` keeps it out of the tab order while it is off-screen.
 */
function StickyBuyBar({
  show,
  productName,
  variantName,
  image,
  total,
  quantity,
  busy,
  onAdd,
  onBuy,
}: {
  show: boolean;
  productName: string;
  variantName: string | null;
  image: string | null;
  total: number;
  quantity: number;
  busy: "add" | "buy" | null;
  onAdd: () => void;
  onBuy: () => void;
}) {
  return (
    <div
      inert={!show}
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[200] border-t border-border-subtle bg-glass backdrop-blur-xl",
        "transition-transform duration-400 ease-[var(--ease-organic)] motion-reduce:transition-none",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-[100rem] items-center gap-4 gutter py-3">
        {image ? (
          <div className="relative hidden h-12 w-12 shrink-0 overflow-hidden border border-border-subtle bg-photo-to sm:block">
            <Image src={image} alt="" fill sizes="48px" className="object-contain p-1" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-cream-100">{productName}</p>
          <p className="truncate text-xs text-cream-400">
            {variantName ? `${variantName} · ` : ""}
            {quantity > 1 ? `${quantity} × · ` : ""}
            <span className="tabular-nums text-cream-200">{formatPrice(total)}</span>
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="ghost"
            loading={busy === "buy"}
            disabled={busy !== null}
            onClick={onBuy}
            className="hidden sm:inline-flex"
          >
            Buy now
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={busy === "add"}
            disabled={busy !== null}
            onClick={onAdd}
          >
            Add to bag
          </Button>
        </div>
      </div>
    </div>
  );
}

function TrustRow({
  icon,
  children,
}: {
  icon: "ship" | "pack" | "leaf" | "lock";
  children: React.ReactNode;
}) {
  const paths = {
    ship: "M2 6h9v7H2zM11 8h3.5L17 10.5V13h-6M4.5 15.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8zM13.5 15.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z",
    pack: "M3 6l7-3 7 3v8l-7 3-7-3V6zM3 6l7 3 7-3M10 9v7",
    leaf: "M10 17V7M10 12c0-4-3-6.6-7-6.9C3.4 9.6 6.4 12 10 12zM10 9c0-4 3-6.6 7-6.9C16.6 6.6 13.6 9 10 9z",
    lock: "M5 9V6.5a5 5 0 0 1 10 0V9M3.5 9h13v8h-13z",
  };

  return (
    <li className="flex items-start gap-3">
      <svg
        width="17"
        height="17"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="mt-0.5 shrink-0 text-emerald-400"
        aria-hidden
      >
        <path d={paths[icon]} strokeLinejoin="round" />
      </svg>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
