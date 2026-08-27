"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductGallery, type GalleryImage } from "@/components/product/ProductGallery";
import {
  ProductPurchase,
  type PurchaseVariant,
} from "@/components/product/ProductPurchase";
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
}: {
  productId: string;
  productName: string;
  shortDescription: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  images: GalleryImage[];
  variants: PurchaseVariant[];
  ratingAverage: number | null;
  ratingCount: number;
  badges: string[];
}) {
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(
    variants[0]?.imageUrl ?? null,
  );

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <ProductGallery
        images={images}
        productName={productName}
        activeImageUrl={activeImageUrl}
      />

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
            className="eyebrow text-gold-400/90 transition-colors hover:text-gold-300"
          >
            {categoryName}
          </Link>
        ) : null}

        <h1 className="mt-4 text-display text-cream-50">{productName}</h1>

        {shortDescription ? (
          <p className="mt-5 max-w-[48ch] text-[1.05rem] leading-relaxed text-cream-300/85">
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
              className="text-xs text-cream-400 underline underline-offset-4 hover:text-cream-200"
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
