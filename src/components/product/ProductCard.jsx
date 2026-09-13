"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice } from "@/lib/money";
import { Rating } from "@/components/ui/Rating";
import { useCart } from "@/components/cart/CartProvider";
import { WishlistButton } from "@/components/product/WishlistButton";
import { analytics } from "@/lib/analytics";
/**
 * The product card.
 *
 * Hover does three things at once — the image crossfades to the second
 * photograph, the card lifts a little, and quick-add appears. The information a
 * shopper needs to decide (name, price, rating, size) is never hidden behind
 * that hover, because on touch there is no hover to reveal it.
 */
export function ProductCard({
  product,
  index = 0,
  listName = "Product list",
  priority = false,
  className,
  onQuickView,
}) {
  const { add } = useCart();
  const [adding, setAdding] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1];
  const discount = discountPercent(product.price, product.compareAtPrice);
  const multipleSizes = product.variants.length > 1;
  const inStock =
    product.inStock ??
    product.variants.some(
      (v) =>
        !v.inventory?.trackInventory ||
        (v.inventory ? v.inventory.onHand - v.inventory.reserved > 0 : true),
    );
  const analyticsItem = {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category?.name,
    price: product.price / 100,
    index,
  };
  const handleQuickAdd = async () => {
    const variant = product.variants[0];
    if (!variant) return;
    setAdding(true);
    await add({
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      meta: {
        name: product.name,
        variantName: variant.name,
        price: variant.price,
        category: product.category?.name,
      },
    });
    setAdding(false);
  };
  return (
    <article
      className={cn(
        "group relative flex flex-col",
        "transition-transform duration-700 ease-[var(--ease-organic)] md:hover:-translate-y-1.5",
        className,
      )}
      data-animate="fade-up"
      data-cursor="view"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-gradient-to-b from-photo-from to-photo-to">
        {/* A warm wash deepens on hover — depth without a drop shadow. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent to-photo-to/0 transition-colors duration-700 group-hover:to-photo-to/80"
          aria-hidden
        />

        {primary ? (
          <Image
            src={primary.url}
            alt={primary.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className={cn(
              "object-contain p-6 transition-all duration-[900ms] ease-[var(--ease-organic)]",
              "group-hover:scale-[1.06]",
              secondary && "group-hover:opacity-0",
            )}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-cream-400">
            <LeafMark />
          </div>
        )}

        {secondary ? (
          <Image
            src={secondary.url}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-6 opacity-0 transition-all duration-[900ms] ease-[var(--ease-organic)] group-hover:scale-[1.04] group-hover:opacity-100"
          />
        ) : null}

        {/* Badges */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col items-start gap-1.5">
          {!inStock ? <Badge tone="muted">Out of stock</Badge> : null}
          {inStock && discount ? <Badge tone="gold">−{discount}%</Badge> : null}
          {inStock && product.isBestSeller ? (
            <Badge tone="leaf">Bestseller</Badge>
          ) : null}
          {inStock && product.isNew ? <Badge tone="leaf">New</Badge> : null}
        </div>

        <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-1 [&_button]:text-ink-600">
          <WishlistButton productId={product.id} productName={product.name} />

          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(product.slug)}
              aria-label={`Quick view ${product.name}`}
              data-cursor="link"
              className={cn(
                "grid h-8 w-8 place-items-center bg-photo-from/80 text-on-photo backdrop-blur-sm",
                "opacity-0 transition-all duration-300 hover:text-emerald-600",
                "group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
                "max-md:hidden",
              )}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M13.5 13.5L17 17M9 6.5v5M6.5 9h5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Quick add. Hidden until hover on pointer devices; always visible on
            touch, where there is no hover to reveal it. */}
        {inStock ? (
          <div
            className={cn(
              "absolute inset-x-3 bottom-3 z-20",
              "translate-y-2 opacity-0 transition-all duration-500 ease-[var(--ease-organic)]",
              "group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
              "max-md:translate-y-0 max-md:opacity-100",
            )}
          >
            {multipleSizes ? (
              <Link
                href={`/product/${product.slug}`}
                data-cursor="link"
                onClick={() => analytics.selectItem(listName, analyticsItem)}
                className="flex h-11 w-full items-center justify-center border border-on-photo/15 bg-on-photo/85 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-photo-from backdrop-blur-md transition-colors hover:bg-on-photo"
              >
                Choose size
              </Link>
            ) : (
              <button
                type="button"
                data-cursor="link"
                onClick={handleQuickAdd}
                disabled={adding}
                className="flex h-11 w-full items-center justify-center border border-emerald-400/50 bg-emerald-600/85 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-on-accent backdrop-blur-md transition-colors hover:bg-emerald-500 disabled:opacity-60"
              >
                {adding ? "Adding…" : "Quick add"}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 pt-5">
        {product.category ? (
          <p className="eyebrow text-cream-400">{product.category.name}</p>
        ) : null}

        <h3 className="text-[1.05rem] leading-snug text-cream-50">
          <Link
            href={`/product/${product.slug}`}
            onClick={() => analytics.selectItem(listName, analyticsItem)}
            className="before:absolute before:inset-0 before:z-10 before:content-['']"
          >
            {product.name}
          </Link>
        </h3>

        {product.shortDescription ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-cream-400">
            {product.shortDescription}
          </p>
        ) : null}

        <Rating value={product.ratingAverage} count={product.ratingCount} size="xs" />

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-[1.05rem] tabular-nums text-cream-50">
            {multipleSizes ? "From " : ""}
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-sm tabular-nums text-cream-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
function Badge({ children, tone = "leaf" }) {
  const tones = {
    leaf: "border-emerald-400/40 bg-forest-800/80 text-leaf-200",
    gold: "border-gold-400/40 bg-ink/80 text-gold-300",
    muted: "border-border-subtle bg-ink/85 text-cream-400",
  };
  return (
    <span
      className={cn(
        "border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] backdrop-blur-sm",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
function LeafMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 34C20 34 6 28 6 16C6 9 12 4 20 4C28 4 34 9 34 16C34 28 20 34 20 34Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <path d="M20 34V10" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}
