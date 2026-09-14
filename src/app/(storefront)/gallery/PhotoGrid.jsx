"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
/**
 * A masonry-ish photo grid with a lightbox.
 *
 * Columns are CSS `columns` rather than a grid, because these photographs come
 * in wildly mixed aspect ratios — 1600×576 panoramas next to 720×1280 portraits
 * — and forcing them into uniform cells would crop the subject out of half of
 * them. Flowing them down columns keeps every picture whole.
 */
export function PhotoGrid({ photos }) {
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta) =>
      setOpen((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );
  useEffect(() => {
    if (open === null) return;
    const onKey = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // The page behind must not scroll while the lightbox is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close, step]);
  const active = open === null ? null : photos[open];
  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {photos.map((photo, i) => (
          <figure key={photo.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block w-full overflow-hidden border border-border-subtle bg-photo-to focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
              aria-label={`Open photograph: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-700 ease-[var(--ease-organic)] group-hover:scale-[1.03]"
              />
            </button>
            {photo.caption ? (
              <figcaption className="mt-2.5 text-[0.82rem] leading-relaxed text-cream-400">
                {photo.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-[300] flex flex-col bg-ink/95 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-[0.72rem] tabular-nums tracking-[0.14em] text-cream-400">
              {(open ?? 0) + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={close}
              className="text-[0.72rem] uppercase tracking-[0.16em] text-cream-300 transition-colors hover:text-cream-50"
            >
              Close
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={active.alt}
              width={active.width}
              height={active.height}
              sizes="100vw"
              className="max-h-full w-auto max-w-full object-contain"
              priority
            />
          </div>

          <div
            className="flex items-center justify-between gap-6 px-5 pb-6"
            onClick={(event) => event.stopPropagation()}
          >
            <Arrow direction="prev" onClick={() => step(-1)} />
            <p className="min-w-0 flex-1 text-center text-[0.85rem] leading-relaxed text-cream-300">
              {active.caption ?? active.alt}
            </p>
            <Arrow direction="next" onClick={() => step(1)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
function Arrow({ direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous photograph" : "Next photograph"}
      className="shrink-0 rounded-full border border-border-subtle p-3 text-cream-300 transition-colors hover:border-border-strong hover:text-cream-50"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d={direction === "prev" ? "M12.5 4 6.5 10l6 6" : "M7.5 4l6 6-6 6"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
/** Anchor nav across the groups, so the page is navigable without scrolling it all. */
export function GroupNav({ groups }) {
  return (
    <nav aria-label="Photograph sections" className="flex flex-wrap gap-x-6 gap-y-3">
      {groups.map((group) => (
        <a
          key={group.slug}
          href={`#${group.slug}`}
          className={cn(
            "inline-block py-1.5 text-sm text-cream-300 underline-offset-4 transition-colors",
            "hover:text-cream-50 hover:underline",
          )}
        >
          {group.title}{" "}
          <span className="tabular-nums text-cream-400">({group.count})</span>
        </a>
      ))}
    </nav>
  );
}
