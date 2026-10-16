"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice } from "@/lib/money";
import { useCart } from "@/components/cart/CartProvider";
import { WishlistButton } from "@/components/product/WishlistButton";
import { analytics } from "@/lib/analytics";
/**
 * The product card, in the D2C pattern: one tag ribbon, the pack on white, a
 * rating chip, price with strike-through and saving, and an add-to-cart button
 * that is always visible — touch has no hover to reveal it.
 *
 * Multi-size products open quick view (or the product page) instead of adding
 * blind: guessing the size for someone is how a cart fills with returns.
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
  const [added, setAdded] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1];
  const variants = product.variants ?? [];
  const cheapest = variants.length
    ? variants.reduce((low, v) => (v.price < low.price ? v : low))
    : null;
  const displayPrice = cheapest ? cheapest.price : product.price;
  const displayCompareAt = cheapest
    ? cheapest.compareAtPrice
    : product.compareAtPrice;
  const discount = discountPercent(displayPrice, displayCompareAt);
  const multipleSizes = variants.length > 1;
  const inStock =
    product.inStock ??
    variants.some(
      (v) =>
        !v.inventory?.trackInventory ||
        (v.inventory ? v.inventory.onHand - v.inventory.reserved > 0 : true),
    );
  const href = `/product/${product.slug}`;
  const analyticsItem = {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category?.name,
    price: displayPrice / 100,
    index,
  };
  const tag = !inStock
    ? { label: "Sold out", tone: "muted" }
    : product.isBestSeller
      ? { label: "Bestseller", tone: "green" }
      : product.isNew
        ? { label: "New launch", tone: "berry" }
        : discount
          ? { label: `${discount}% off`, tone: "berry" }
          : null;
  const handleQuickAdd = async () => {
    const variant = variants[0];
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
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-ink",
        "transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--mt-shadow-card)]",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-photo-from">
        {primary ? (
          <Image
            src={primary.url}
            alt={primary.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className={cn(
              "object-contain p-4 transition-all duration-500 group-hover:scale-[1.04]",
              secondary && "group-hover:opacity-0",
            )}
            unoptimized={
              typeof primary.url === "string"
                ? primary.url.startsWith("/uploads/")
                : undefined
            }
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
            className="object-contain p-4 opacity-0 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
            unoptimized={
              typeof secondary.url === "string"
                ? secondary.url.startsWith("/uploads/")
                : undefined
            }
          />
        ) : null}

        {tag ? (
          <span
            className={cn(
              "pointer-events-none absolute left-0 top-3 z-10 rounded-r-full py-1 pl-3 pr-3.5 text-[0.68rem] font-bold uppercase tracking-wide",
              tag.tone === "green" && "bg-emerald-500 text-on-accent",
              tag.tone === "berry" && "bg-berry-500 text-white",
              tag.tone === "muted" && "bg-cream-300 text-ink",
            )}
          >
            {tag.label}
          </span>
        ) : null}

        <div className="absolute right-2 top-2 z-20 flex flex-col items-end gap-1 [&_button]:rounded-full [&_button]:bg-white/90 [&_button]:text-ink-600 [&_button]:shadow-sm">
          <WishlistButton productId={product.id} productName={product.name} />
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(product.slug)}
              aria-label={`Quick view ${product.name}`}
              className="grid h-8 w-8 place-items-center text-on-photo opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:hidden"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.5 13.5L17 17M9 6.5v5M6.5 9h5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {product.category ? (
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-emerald-500">
            {product.category.name}
          </p>
        ) : null}

        <h3 className="line-clamp-2 min-h-[2.5em] text-[0.92rem] font-semibold leading-snug tracking-normal text-cream-50 sm:text-[0.98rem]">
          <Link
            href={href}
            onClick={() => analytics.selectItem(listName, analyticsItem)}
            className="before:absolute before:inset-0 before:z-10 before:content-['']"
          >
            {product.name}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-[0.75rem] text-cream-400">
          {product.ratingCount ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-forest-900 px-1.5 py-0.5 font-semibold text-emerald-600">
              <Star /> {product.ratingAverage?.toFixed(1)}
              <span className="font-normal text-cream-400">
                ({product.ratingCount})
              </span>
            </span>
          ) : null}
          {multipleSizes ? <span>{variants.length} sizes</span> : null}
        </div>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1.5">
          <span className="text-[1.05rem] font-bold tabular-nums text-cream-50">
            {multipleSizes ? <span className="text-xs font-medium text-cream-400">From </span> : null}
            {formatPrice(displayPrice)}
          </span>
          {displayCompareAt && displayCompareAt > displayPrice ? (
            <>
              <span className="text-[0.8rem] tabular-nums text-cream-400 line-through">
                {formatPrice(displayCompareAt)}
              </span>
              {discount ? (
                <span className="text-[0.78rem] font-bold text-berry-500">
                  {discount}% off
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="relative z-20 pt-2">
          {!inStock ? (
            <span className="flex h-10 w-full items-center justify-center rounded-full border border-border-subtle text-[0.8rem] font-semibold text-cream-400">
              Sold out
            </span>
          ) : multipleSizes ? (
            onQuickView ? (
              <button
                type="button"
                onClick={() => onQuickView(product.slug)}
                className="flex h-10 w-full items-center justify-center rounded-full border-2 border-emerald-500 text-[0.82rem] font-bold text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-on-accent"
              >
                Choose size
              </button>
            ) : (
              <Link
                href={href}
                onClick={() => analytics.selectItem(listName, analyticsItem)}
                className="flex h-10 w-full items-center justify-center rounded-full border-2 border-emerald-500 text-[0.82rem] font-bold text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-on-accent"
              >
                Choose size
              </Link>
            )
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={adding}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-[0.82rem] font-bold text-on-accent transition-colors hover:bg-emerald-600 disabled:opacity-70"
            >
              {adding ? "Adding…" : added ? "Added ✓" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
function Star() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" aria-hidden fill="currentColor">
      <path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" />
    </svg>
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
