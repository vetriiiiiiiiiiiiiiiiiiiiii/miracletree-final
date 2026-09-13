"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";
import { QuantityStepper } from "@/components/cart/CartDrawer";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useCart } from "@/components/cart/CartProvider";
import { discountPercent, formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

type QuickViewData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  categoryName: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  images: { url: string; alt: string | null }[];
  variants: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    imageUrl: string | null;
    available: number;
    tracked: boolean;
  }[];
  benefits: { title: string }[];
};

/**
 * Quick view.
 *
 * Buying a second jar of leaf powder should not require a page load. The data
 * is fetched on open rather than embedded in every card, so a 27-card grid does
 * not ship 27 product payloads it will probably never use.
 */
export function QuickView({
  slug,
  open,
  onClose,
}: {
  slug: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { add } = useCart();
  const [data, setData] = useState<QuickViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open || !slug) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    setVariantIndex(0);
    setQuantity(1);

    fetch(`/api/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((payload: QuickViewData) => {
        setData(payload);
        const firstAvailable = payload.variants.findIndex(
          (v) => !v.tracked || v.available > 0,
        );
        setVariantIndex(Math.max(0, firstAvailable));
        analytics.viewItem({
          item_id: payload.id,
          item_name: payload.name,
          item_category: payload.categoryName ?? undefined,
          price: (payload.variants[0]?.price ?? 0) / 100,
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("We couldn't load that product.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [open, slug]);

  const variant = data?.variants[variantIndex];
  const image = variant?.imageUrl ?? data?.images[0]?.url ?? null;
  const discount = variant ? discountPercent(variant.price, variant.compareAtPrice) : null;
  const soldOut = variant ? variant.tracked && variant.available <= 0 : false;

  const handleAdd = async () => {
    if (!data || !variant) return;
    setAdding(true);
    const ok = await add({
      productId: data.id,
      variantId: variant.id,
      quantity,
      meta: {
        name: data.name,
        variantName: variant.name,
        price: variant.price,
        category: data.categoryName ?? undefined,
      },
    });
    setAdding(false);
    if (ok) onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Quick view" side="center" className="p-0">
      <div className="max-h-[88vh] overflow-y-auto">
        {loading ? (
          <div className="grid gap-8 p-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse bg-white/[0.04]" />
            <div className="grid content-start gap-4">
              <div className="h-3 w-24 animate-pulse bg-white/[0.06]" />
              <div className="h-8 w-3/4 animate-pulse bg-white/[0.06]" />
              <div className="h-4 w-full animate-pulse bg-white/[0.04]" />
              <div className="h-4 w-2/3 animate-pulse bg-white/[0.04]" />
              <div className="mt-4 h-12 w-full animate-pulse bg-white/[0.06]" />
            </div>
          </div>
        ) : error || !data || !variant ? (
          <div className="p-12 text-center">
            <p className="text-cream-200">{error ?? "That product is unavailable."}</p>
            <Button variant="secondary" size="md" className="mt-6" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 p-6 md:grid-cols-2 md:gap-10 md:p-10">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-ink-800">
              {image ? (
                <Image
                  src={image}
                  alt={data.images[0]?.alt ?? data.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 26rem"
                  className="object-contain p-8"
                />
              ) : null}

              {discount ? (
                <span className="absolute left-4 top-4 border border-gold-400/40 bg-ink/80 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-gold-300">
                  −{discount}%
                </span>
              ) : null}
            </div>

            {/* Detail */}
            <div className="flex flex-col">
              {data.categoryName ? (
                <p className="eyebrow text-gold-400">{data.categoryName}</p>
              ) : null}

              <h2 className="mt-3 text-title text-cream-50">{data.name}</h2>

              <div className="mt-3">
                <Rating value={data.ratingAverage} count={data.ratingCount} size="sm" />
              </div>

              {data.shortDescription ? (
                <p className="mt-4 text-sm leading-relaxed text-cream-300">
                  {data.shortDescription}
                </p>
              ) : null}

              {data.benefits.length ? (
                <ul className="mt-5 grid gap-1.5">
                  {data.benefits.slice(0, 3).map((benefit) => (
                    <li
                      key={benefit.title}
                      className="flex items-start gap-2.5 text-sm text-cream-400"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                      {benefit.title}
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-6 flex items-baseline gap-3">
                <span className="text-[1.6rem] tabular-nums text-cream-50">
                  {formatPrice(variant.price)}
                </span>
                {variant.compareAtPrice && variant.compareAtPrice > variant.price ? (
                  <span className="tabular-nums text-cream-400 line-through">
                    {formatPrice(variant.compareAtPrice)}
                  </span>
                ) : null}
              </p>

              {data.variants.length > 1 ? (
                <fieldset className="mt-5">
                  <legend className="eyebrow mb-2.5 text-cream-400">Size</legend>
                  <div className="flex flex-wrap gap-2">
                    {data.variants.map((option, index) => {
                      const out = option.tracked && option.available <= 0;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={out}
                          aria-pressed={index === variantIndex}
                          onClick={() => {
                            setVariantIndex(index);
                            setQuantity(1);
                          }}
                          className={cn(
                            "border px-3.5 py-2 text-sm transition-colors",
                            index === variantIndex
                              ? "border-gold-400 text-cream-50"
                              : "border-border-subtle text-cream-300 hover:border-border-strong",
                            out && "cursor-not-allowed text-cream-400 line-through",
                          )}
                        >
                          {option.name}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              <div className="mt-auto pt-7">
                {soldOut ? (
                  <p className="border border-border-subtle bg-white/[0.02] p-4 text-sm text-cream-300">
                    This size is sold out. Pick another, or open the full page to be
                    notified when it returns.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <QuantityStepper
                      value={quantity}
                      max={variant.tracked ? Math.max(1, Math.min(10, variant.available)) : 10}
                      onChange={setQuantity}
                      label={`Quantity of ${data.name}`}
                    />
                    <Button
                      size="md"
                      loading={adding}
                      onClick={handleAdd}
                      className="flex-1"
                    >
                      Add to bag · {formatPrice(variant.price * quantity)}
                    </Button>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/product/${data.slug}`}
                    onClick={onClose}
                    className="text-[0.7rem] uppercase tracking-[0.14em] text-cream-300 underline underline-offset-4 hover:text-cream-50"
                  >
                    Full details
                  </Link>
                  <WishlistButton
                    productId={data.id}
                    productName={data.name}
                    showLabel
                    className="-mr-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
