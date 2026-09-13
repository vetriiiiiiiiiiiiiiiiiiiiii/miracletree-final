"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isTouchDevice } from "@/lib/motion";

export type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Product gallery.
 *
 * Desktop: a thumbnail rail plus a pointer-tracked magnifier on the main image.
 * Touch: a snap-scrolling strip with dot indicators, driven by the browser's own
 * scrolling rather than a JS carousel — smoother, and it keeps momentum.
 */
export function ProductGallery({
  images,
  productName,
  activeImageUrl,
}: {
  images: GalleryImage[];
  productName: string;
  /** When a variant is selected, its image is brought to the front. */
  activeImageUrl?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const stripRef = useRef<HTMLDivElement>(null);

  // Selecting a variant should move the gallery to that variant's photograph.
  useEffect(() => {
    if (!activeImageUrl) return;
    const found = images.findIndex((image) => image.url === activeImageUrl);
    if (found >= 0) setIndex(found);
  }, [activeImageUrl, images]);

  const current = images[index];

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isTouchDevice()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const onStripScroll = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const next = Math.round(strip.scrollLeft / strip.clientWidth);
    if (next !== index) setIndex(next);
  };

  if (!images.length) {
    return (
      <div className="grid aspect-square place-items-center bg-ink-800 text-cream-400">
        <span className="eyebrow">No image yet</span>
      </div>
    );
  }

  return (
    // The thumbnail rail only exists with more than one image, so the two-column
    // template has to be conditional too — otherwise a single-image product
    // renders its main photo into the empty 4.5rem rail column.
    <div
      className={cn(
        "grid gap-4 md:gap-6",
        images.length > 1 && "md:grid-cols-[4.5rem_1fr]",
      )}
    >
      {/* Thumbnails — desktop only */}
      {images.length > 1 ? (
        <div
          className="hidden max-h-[38rem] flex-col gap-3 overflow-y-auto md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={`${productName} images`}
        >
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View image ${i + 1} of ${images.length}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative aspect-square shrink-0 overflow-hidden border bg-photo-to transition-colors duration-300",
                i === index ? "border-gold-400" : "border-border-subtle hover:border-border-strong",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="72px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Main image — desktop */}
      <div
        className="relative hidden aspect-square overflow-hidden bg-gradient-to-b from-photo-from to-photo-to md:block"
        onPointerEnter={() => setZooming(true)}
        onPointerLeave={() => setZooming(false)}
        onPointerMove={onPointerMove}
        data-cursor="image"
      >
        {current ? (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt ?? productName}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 45vw"
            className={cn(
              "object-contain p-10 transition-transform duration-500 ease-[var(--ease-organic)]",
              zooming ? "scale-[1.9]" : "scale-100",
            )}
            style={zooming ? { transformOrigin: `${origin.x}% ${origin.y}%` } : undefined}
          />
        ) : null}

        <span className="pointer-events-none absolute bottom-4 right-4 text-[0.6rem] uppercase tracking-[0.14em] text-on-photo/70">
          Hover to zoom
        </span>
      </div>

      {/* Swipe strip — touch */}
      <div className="md:hidden">
        <div
          ref={stripRef}
          onScroll={onStripScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${productName} images`}
        >
          {images.map((image, i) => (
            <div
              key={image.id}
              className="relative aspect-square w-full shrink-0 snap-center bg-gradient-to-b from-photo-from to-photo-to"
            >
              <Image
                src={image.url}
                alt={i === 0 ? (image.alt ?? productName) : ""}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-contain p-8"
              />
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
            {images.map((image, i) => (
              <span
                key={image.id}
                className={cn(
                  "h-1 w-6 transition-colors duration-300",
                  i === index ? "bg-gold-400" : "bg-border-subtle",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
