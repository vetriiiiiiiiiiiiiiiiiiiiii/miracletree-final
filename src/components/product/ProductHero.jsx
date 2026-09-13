"use client";
import { useState } from "react";
import Link from "next/link";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PackViewer } from "@/components/product/PackViewer";
import { cn } from "@/lib/utils";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { Rating } from "@/components/ui/Rating";
/**
 * Owns the one piece of state the gallery and the buy box share: which variant
 * is selected. Keeping it here means the page itself stays a Server Component.
 */
export function ProductHero({
  productId,
  productName,
  shortDescription,
  categoryName,
  categorySlug,
  images,
  variants,
  ratingAverage,
  ratingCount,
  badges,
}) {
  const [activeImageUrl, setActiveImageUrl] = useState(variants[0]?.imageUrl ?? null);
  // Photographs are the default: they are what a shopper came to look at, and
  // they are what a variant selection needs to move. Turning the pack is the
  // second thing you do, not the first.
  const [view, setView] = useState("photos");
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <div>
        {view === "pack" ? (
          <PackViewer images={images} productName={productName} />
        ) : (
          <ProductGallery
            images={images}
            productName={productName}
            activeImageUrl={activeImageUrl}
          />
        )}

        {images.length > 0 ? (
          <div
            role="group"
            aria-label="How to view the product"
            className="mt-4 flex justify-center gap-1"
          >
            {["photos", "pack"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                data-cursor="link"
                className={cn(
                  "border px-4 py-2 text-[0.62rem] uppercase tracking-[0.16em] transition-colors",
                  view === option
                    ? "border-emerald-400/50 bg-emerald-500/10 text-cream-50"
                    : "border-border-subtle text-cream-400 hover:border-border-strong hover:text-cream-200",
                )}
              >
                {option === "photos" ? "Photos" : "Turn the pack"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="lg:pt-4">
        {badges.length ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="border border-emerald-400/35 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-leaf-200"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        {categoryName && categorySlug ? (
          <Link
            href={`/shop/${categorySlug}`}
            className="eyebrow inline-block py-1.5 text-gold-400 transition-colors hover:text-gold-300"
          >
            {categoryName}
          </Link>
        ) : null}

        <h1 className="mt-4 text-display text-cream-50">{productName}</h1>

        {shortDescription ? (
          <p className="mt-5 max-w-[48ch] text-[1.05rem] leading-relaxed text-cream-300">
            {shortDescription}
          </p>
        ) : null}

        <div className="mt-5">
          {ratingCount > 0 ? (
            <a href="#reviews" className="inline-block">
              <Rating value={ratingAverage} count={ratingCount} size="sm" />
            </a>
          ) : (
            <a
              href="#reviews"
              className="inline-block py-1.5 text-xs text-cream-400 underline underline-offset-4 hover:text-cream-200"
            >
              No reviews yet — be the first
            </a>
          )}
        </div>

        <div className="mt-9">
          <ProductPurchase
            productId={productId}
            productName={productName}
            categoryName={categoryName}
            variants={variants}
            onVariantChange={(variant) => setActiveImageUrl(variant.imageUrl)}
          />
        </div>
      </div>
    </div>
  );
}
