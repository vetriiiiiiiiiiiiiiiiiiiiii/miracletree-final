"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Rating } from "@/components/ui/Rating";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProofItem } from "@/components/home/SocialProof";

/**
 * One review at a time, on a slow rotation.
 *
 * A grid of nine quotes is read as wallpaper; a single quote at display size
 * gets read. The trade is that a carousel can hide content and steal control,
 * so this one gives both back:
 *
 * - It advances every eight seconds and stops the moment a pointer enters, a
 *   control takes focus, or the tab goes to the background. It never moves
 *   while someone is part-way through reading.
 * - Arrow keys work, the dots are real buttons, and the live region announces
 *   each quote as it arrives.
 * - Under `prefers-reduced-motion` it does not rotate at all and every review
 *   is rendered as a plain list, which is also what a crawler and a printer
 *   get.
 *
 * The quotes are stacked rather than swapped so the section keeps the height
 * of its tallest one: an auto-advancing block that resizes under the reader is
 * how a carousel makes the whole page jump.
 */
export function TestimonialCarousel({ items }: { items: ProofItem[] }) {
  const [index, setIndex] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (items.length < 2) return;
    setRotating(true);
  }, [items.length]);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + items.length) % items.length),
    [items.length],
  );

  useEffect(() => {
    if (!rotating || paused) return;
    const id = window.setInterval(() => go(1), 8000);
    return () => window.clearInterval(id);
  }, [rotating, paused, go]);

  // A hidden tab should not burn through the whole set unseen.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!items.length) return null;

  // Without rotation there is no carousel to speak of — just the reviews.
  if (!rotating) {
    return (
      <ul className="mt-16 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="border-t border-border-subtle pt-6">
            <Quote item={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      ref={root}
      className="mt-14"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {/* The stack sizes itself to the tallest quote, so nothing below it
          moves as the rotation runs. */}
      <div className="grid">
        {items.map((item, i) => (
          <div
            key={item.id}
            aria-hidden={i !== index}
            inert={i !== index}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-[var(--ease-organic)]",
              i === index
                ? "opacity-100 translate-y-0"
                : "pointer-events-none opacity-0 translate-y-3",
            )}
          >
            <Quote item={item} large />
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-6 border-t border-border-subtle pt-5">
        <div className="flex items-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Review ${i + 1} of ${items.length}, by ${item.authorName}`}
              aria-current={i === index}
              className="grid h-6 w-6 place-items-center"
            >
              <span
                className={cn(
                  "block h-px w-4 transition-colors duration-300",
                  i === index ? "bg-gold-400" : "bg-border-strong",
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Arrow label="Previous review" onClick={() => go(-1)} direction="prev" />
          <span className="px-2 text-[0.72rem] tabular-nums text-cream-400">
            {index + 1} / {items.length}
          </span>
          <Arrow label="Next review" onClick={() => go(1)} direction="next" />
        </div>
      </div>

      {/* Announced without moving focus, so a screen reader follows the
          rotation instead of being yanked around by it. */}
      <p aria-live="polite" className="sr-only">
        {items[index]
          ? `${items[index]!.authorName}: ${items[index]!.body}`
          : ""}
      </p>
    </div>
  );
}

function Quote({ item, large = false }: { item: ProofItem; large?: boolean }) {
  return (
    <figure className="flex h-full flex-col">
      <Rating value={item.rating} count={1} showCount={false} size="sm" />

      <blockquote
        className={cn(
          "mt-5 flex-1 leading-relaxed text-cream-100",
          large
            ? "max-w-[36ch] text-[clamp(1.3rem,2.6vw,2.1rem)] leading-[1.35]"
            : "text-[1.05rem]",
        )}
        style={{ fontFamily: "var(--font-display)" }}
      >
        &ldquo;{item.body}&rdquo;
      </blockquote>

      <figcaption className={cn("text-sm text-cream-400", large ? "mt-8" : "mt-6")}>
        <span className="text-cream-200">{item.authorName}</span>
        {item.location ? <span> · {item.location}</span> : null}
        {item.isVerified ? (
          <span className="ml-2 border border-emerald-400/30 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-leaf-300">
            Verified
          </span>
        ) : null}

        {item.product ? (
          <Link
            href={`/product/${item.product.slug}`}
            className="mt-2 inline-flex min-h-[1.5rem] items-center text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
          >
            on {item.product.name}
          </Link>
        ) : null}

        {item.createdAt ? (
          <span className="mt-1 block text-xs text-cream-400">
            {formatDate(item.createdAt, { day: undefined })}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

function Arrow({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: "prev" | "next";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center border border-border-subtle text-cream-300 transition-colors hover:border-border-strong hover:text-cream-50"
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
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
