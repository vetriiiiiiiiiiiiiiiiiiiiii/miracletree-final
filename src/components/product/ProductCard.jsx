"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice } from "@/lib/money";
import { useCart } from "@/components/cart/CartProvider";
import { WishlistButton } from "@/components/product/WishlistButton";
import { analytics } from "@/lib/analytics";
/**
 * The product card: pack on a soft ground with a tag and wishlist, then
 * category, name, one line of description, rating, price with strike-through
 * and saving, an inline size picker, and a quantity stepper beside "Add to
 * cart". Picking a size changes the price, the saving and what is added, so a
 * shopper never has to open the product page just to choose 100 ml over 50.
 *
 * `layout="list"` lays the same content out horizontally for the list view.
 */
const MAX_QTY = 10;
export function ProductCard({
  product,
  index = 0,
  listName = "Product list",
  priority = false,
  className,
  layout = "grid",
}) {
  const { add } = useCart();
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const available = (v) =>
    !v.inventory?.trackInventory ||
    (v.inventory ? v.inventory.onHand - v.inventory.reserved > 0 : true);
  const stockOf = (v) =>
    v.inventory?.trackInventory
      ? Math.max(0, v.inventory.onHand - v.inventory.reserved)
      : MAX_QTY;
  // Start on the cheapest size that is in stock — the price shoppers expect.
  const initial = useMemo(() => {
    const inStock = variants.filter(available);
    const pool = inStock.length ? inStock : variants;
    return pool.reduce((low, v) => (v.price < low.price ? v : low), pool[0]);
  }, [variants]);
  const [selectedId, setSelectedId] = useState(initial?.id ?? null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const selected = variants.find((v) => v.id === selectedId) ?? initial;
  const price = selected ? selected.price : product.price;
  const compareAt = selected ? selected.compareAtPrice : product.compareAtPrice;
  const discount = discountPercent(price, compareAt);
  const inStock = product.inStock ?? variants.some(available);
  const selectedAvailable = selected ? available(selected) : false;
  const maxQty = selected ? Math.min(MAX_QTY, stockOf(selected)) : 1;
  const primary = product.images[0];
  const href = `/product/${product.slug}`;
  const sizeLabel = sizeLabelFor(product);
  const analyticsItem = {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category?.name,
    price: price / 100,
    index,
  };
  const tag = !inStock
    ? { label: "Sold out", tone: "muted" }
    : discount
      ? { label: `${discount}% off`, tone: "berry" }
      : product.isBestSeller
        ? { label: "Bestseller", tone: "green" }
        : product.isNew
          ? { label: "New", tone: "green" }
          : null;
  const addToCart = async () => {
    if (!selected) return;
    setAdding(true);
    const ok = await add({
      productId: product.id,
      variantId: selected.id,
      quantity: qty,
      meta: {
        name: product.name,
        variantName: selected.name,
        price: selected.price,
        category: product.category?.name,
      },
    });
    setAdding(false);
    if (ok !== false) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    }
  };
  const list = layout === "list";
  return (
    <article
      className={cn(
        "group relative flex h-full overflow-hidden rounded-2xl border border-border-subtle bg-ink transition-shadow duration-300 hover:shadow-[var(--mt-shadow-card)]",
        list ? "flex-col sm:flex-row" : "flex-col",
        className,
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-photo-from",
          list ? "aspect-square sm:aspect-auto sm:w-64" : "aspect-square",
        )}
      >
        <Link
          href={href}
          onClick={() => analytics.selectItem(listName, analyticsItem)}
          aria-label={product.name}
          className="absolute inset-0"
        >
          {primary ? (
            <Image
              src={primary.url}
              alt={primary.alt ?? product.name}
              fill
              sizes={list ? "256px" : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"}
              priority={priority}
              // Edge to edge: 24 of the 27 packshots are square, so a square frame
              // shows each one whole while it fills the top of the card.
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              unoptimized={
                typeof primary.url === "string"
                  ? primary.url.startsWith("/uploads/")
                  : undefined
              }
            />
          ) : null}
        </Link>

        {tag ? (
          <span
            className={cn(
              "pointer-events-none absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide",
              tag.tone === "green" && "bg-emerald-600 text-white",
              tag.tone === "berry" && "bg-berry-500 text-white",
              tag.tone === "muted" && "bg-cream-300 text-ink",
            )}
          >
            {tag.label}
          </span>
        ) : null}

        <div className="absolute right-3 top-3 z-10 [&_button]:grid [&_button]:h-9 [&_button]:w-9 [&_button]:place-items-center [&_button]:rounded-full [&_button]:bg-white [&_button]:shadow-sm [&_button:not([aria-pressed=true])]:text-cream-100">
          <WishlistButton productId={product.id} productName={product.name} />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        {product.category ? (
          <p className="text-[0.7rem] font-bold uppercase tracking-wider text-emerald-500">
            {product.category.name}
          </p>
        ) : null}

        <h3 className="mt-1 text-[1.02rem] font-bold leading-snug tracking-normal text-cream-50">
          <Link
            href={href}
            onClick={() => analytics.selectItem(listName, analyticsItem)}
            className="hover:text-emerald-500"
          >
            {product.name}
          </Link>
        </h3>

        {product.shortDescription ? (
          <p className={cn("mt-1 text-[0.85rem] leading-snug text-cream-400", list ? "line-clamp-2" : "line-clamp-1")}>
            {product.shortDescription}
          </p>
        ) : null}

        {product.ratingCount ? (
          <p className="mt-2 flex items-center gap-1.5 text-[0.82rem] text-cream-400">
            <Star />
            <span className="font-bold text-cream-100">
              {product.ratingAverage?.toFixed(1)}
            </span>
            <span>
              ({product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"})
            </span>
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-[1.25rem] font-extrabold tabular-nums tracking-tight text-cream-50">
            {formatPrice(price)}
          </span>
          {compareAt && compareAt > price ? (
            <>
              <span className="text-[0.85rem] tabular-nums text-cream-400 line-through">
                {formatPrice(compareAt)}
              </span>
              {discount ? (
                <span className="text-[0.85rem] font-bold text-berry-500">
                  {discount}% off
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        {/* Size picker — only when there is a real choice to make. */}
        {variants.length > 1 ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
            <span className="text-[0.8rem] text-cream-300">{sizeLabel}:</span>
            {variants.slice(0, 3).map((v) => {
              const off = !available(v);
              const isSelected = v.id === selected?.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(v.id);
                    setQty(1);
                  }}
                  disabled={off}
                  aria-pressed={isSelected}
                  title={off ? `${v.name} — out of stock` : v.name}
                  className={cn(
                    "max-w-[9rem] truncate rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors",
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-border-subtle bg-ink-900 text-cream-200 hover:border-emerald-500",
                    off && "cursor-not-allowed line-through opacity-50",
                  )}
                >
                  {v.name}
                </button>
              );
            })}
            {variants.length > 3 ? (
              <Link href={href} className="text-[0.78rem] font-semibold text-emerald-500 underline-offset-2 hover:underline">
                +{variants.length - 3} more
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* Quantity + add */}
        <div className={cn("mt-auto flex items-center gap-2.5 pt-4", list && "sm:max-w-sm")}>
          {inStock && selectedAvailable ? (
            <>
              <div className="flex h-10 shrink-0 items-center rounded-full border border-border-strong">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label={`Decrease quantity of ${product.name}`}
                  className="grid h-10 w-9 place-items-center text-lg text-cream-200 disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold tabular-nums text-cream-50" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  aria-label={`Increase quantity of ${product.name}`}
                  className="grid h-10 w-9 place-items-center text-lg text-cream-200 disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={adding}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-[0.85rem] font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-70"
              >
                <CartIcon />
                {adding ? "Adding…" : added ? "Added ✓" : "Add to cart"}
              </button>
            </>
          ) : (
            <span className="flex h-10 w-full items-center justify-center rounded-full border border-border-subtle text-[0.85rem] font-semibold text-cream-400">
              {inStock ? "This size is sold out" : "Sold out"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
/** The size picker's label, in the words the pack itself uses. */
function sizeLabelFor(product) {
  const slug = product.category?.slug ?? "";
  const type = product.productType ?? "";
  if (slug.includes("oil") || type === "oil") return "Net volume";
  if (type === "supplement" || slug.includes("supplement")) return "Pack size";
  return "Select size";
}
function Star() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden fill="#f5a623">
      <path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M2.5 3h2l1.6 9.2a1.2 1.2 0 0 0 1.2 1h7.4a1.2 1.2 0 0 0 1.2-.9L17.5 6H5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="16.5" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="16.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
