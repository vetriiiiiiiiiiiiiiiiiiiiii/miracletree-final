"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import {
  moveWishlistItemToCartAction,
  toggleWishlistAction,
} from "@/app/actions/wishlist";
import { useCart } from "@/components/cart/CartProvider";
export function WishlistGrid({ items }) {
  const router = useRouter();
  const { open } = useCart();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const moveToCart = async (productId) => {
    setBusy(productId);
    setError(null);
    const result = await moveWishlistItemToCartAction(productId);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    startTransition(() => router.refresh());
    open();
  };
  const removeItem = async (productId) => {
    setBusy(productId);
    await toggleWishlistAction(productId);
    setBusy(null);
    startTransition(() => router.refresh());
  };
  return (
    <>
      {error ? (
        <p
          className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#f0b3b0]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="group flex flex-col">
            <Link
              href={`/product/${item.slug}`}
              className="relative aspect-4/5 overflow-hidden bg-ink-800"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 90vw, 30vw"
                  className="object-contain p-6 transition-transform duration-700 ease-[var(--ease-organic)] group-hover:scale-105"
                />
              ) : null}

              {!item.inStock ? (
                <span className="absolute left-3 top-3 border border-border-subtle bg-ink/85 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-cream-400">
                  Out of stock
                </span>
              ) : null}
            </Link>

            <div className="flex flex-1 flex-col pt-5">
              {item.categoryName ? (
                <p className="eyebrow text-cream-400">{item.categoryName}</p>
              ) : null}

              <h3 className="mt-2 text-[1.05rem] leading-snug text-cream-50">
                <Link href={`/product/${item.slug}`}>{item.name}</Link>
              </h3>

              <p className="mt-2 flex items-baseline gap-2">
                <span className="tabular-nums text-cream-100">
                  {item.variantCount > 1 ? "From " : ""}
                  {formatPrice(item.price)}
                </span>
                {item.compareAtPrice && item.compareAtPrice > item.price ? (
                  <span className="text-sm tabular-nums text-cream-400 line-through">
                    {formatPrice(item.compareAtPrice)}
                  </span>
                ) : null}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                {item.inStock ? (
                  item.variantCount > 1 ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/product/${item.slug}`)}
                    >
                      Choose size
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      loading={busy === item.productId}
                      onClick={() => void moveToCart(item.productId)}
                    >
                      Move to bag
                    </Button>
                  )
                ) : (
                  <span className="text-xs text-cream-400">
                    Back after the next harvest
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => void removeItem(item.productId)}
                  disabled={busy === item.productId}
                  className="text-xs text-cream-400 underline underline-offset-4 transition-colors hover:text-danger disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
