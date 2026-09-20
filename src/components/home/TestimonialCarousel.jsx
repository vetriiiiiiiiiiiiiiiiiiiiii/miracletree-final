"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rating } from "@/components/ui/Rating";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Three reviews at a time, turned a page at a time.
 *
 * This showed one quote at display size, which read well and left most of a
 * very tall section empty — a single sentence floating in a screen of ground.
 * Three to a row fills it, and turning a whole page rather than sliding one
 * card keeps the reading order honest: you finish a set, then the next set
 * arrives, instead of a row that is always mid-shuffle.
 *
 * The properties the single-quote version had are all kept, because they are
 * what stops a carousel being hostile:
 *
 * - it advances every nine seconds, and stops the moment a pointer enters, a
 *   control takes focus, or the tab goes to the background;
 * - arrow keys work, the dots are real buttons, and a live region announces
 *   each page without moving focus;
 * - under `prefers-reduced-motion` it does not rotate at all — every review
 *   renders as one plain list, which is also what a crawler and a printer get.
 *
 * The rows are stacked in one grid cell rather than swapped, so the section
 * holds the height of its tallest page and nothing below it moves while the
 * rotation runs.
 */
const PER_PAGE = 3;
const INTERVAL = 9000;

export function TestimonialCarousel({ items }) {
  const [page, setPage] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [paused, setPaused] = useState(false);
  const root = useRef(null);

  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < items.length; i += PER_PAGE) out.push(items.slice(i, i + PER_PAGE));
    return out;
  }, [items]);

  // The average and the count, from the reviews actually on the page. Stated
  // rather than implied: a row of five-star quotes with no figure beside it is
  // the shape of a testimonial wall, and this is not one.
  const summary = useMemo(() => {
    const rated = items.filter((i) => typeof i.rating === "number" && i.rating > 0);
    if (!rated.length) return null;
    return {
      average: rated.reduce((n, i) => n + i.rating, 0) / rated.length,
      count: rated.length,
    };
  }, [items]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (pages.length < 2) return;
    setRotating(true);
  }, [pages.length]);

  const go = useCallback(
    (delta) => setPage((i) => (i + delta + pages.length) % pages.length),
    [pages.length],
  );

  useEffect(() => {
    if (!rotating || paused) return;
    const id = window.setInterval(() => go(1), INTERVAL);
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
      <>
        {summary ? <Summary {...summary} className="mt-12" /> : null}
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Quote item={item} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <div
      ref={root}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!root.current?.contains(e.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {summary ? <Summary {...summary} className="mt-12" /> : null}

      <div className="mt-10 grid">
        {pages.map((group, p) => (
          <div
            key={p}
            aria-hidden={p !== page}
            inert={p !== page}
            className={cn(
              "col-start-1 row-start-1 grid gap-6 transition-opacity duration-500 md:grid-cols-2 lg:grid-cols-3",
              p === page ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {group.map((item, i) => (
              <div
                key={item.id}
                style={
                  // Keyed on the page so the stagger replays on every turn.
                  // Tailwind cannot see a delay interpolated at runtime, so the
                  // animation is set here rather than as a class.
                  p === page
                    ? {
                        animation: `hero-rise 0.6s var(--ease-organic) ${i * 0.09}s both`,
                      }
                    : undefined
                }
              >
                <Quote item={item} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-border-subtle pt-5">
        <div className="flex items-center gap-2">
          {pages.map((group, p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-label={`Reviews ${p * PER_PAGE + 1} to ${p * PER_PAGE + group.length} of ${items.length}`}
              aria-current={p === page}
              className="grid h-6 w-8 place-items-center"
            >
              <span
                className={cn(
                  "block h-px w-6 transition-colors duration-300",
                  p === page ? "bg-gold-400" : "bg-border-strong",
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Arrow label="Previous reviews" onClick={() => go(-1)} direction="prev" />
          <span className="px-2 text-[0.72rem] tabular-nums text-cream-400">
            {page + 1} / {pages.length}
          </span>
          <Arrow label="Next reviews" onClick={() => go(1)} direction="next" />
        </div>
      </div>

      {/* Announced without moving focus, so a screen reader follows the
          rotation instead of being yanked around by it. */}
      <p aria-live="polite" className="sr-only">
        {(pages[page] ?? [])
          .map((item) => `${item.authorName}: ${item.body}`)
          .join(". ")}
      </p>
    </div>
  );
}

/** The aggregate, from the same rows the quotes come from. */
function Summary({ average, count, className }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-x-8 gap-y-3 border-t border-border-subtle pt-6",
        className,
      )}
    >
      <p className="flex items-baseline gap-2">
        <span
          className="text-[2.6rem] leading-none text-cream-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {average.toFixed(1)}
        </span>
        <span className="text-sm text-cream-400">out of 5</span>
      </p>
      <Rating value={average} count={count} size="md" showCount={false} className="pb-1.5" />
      <p className="pb-1.5 text-[0.72rem] uppercase tracking-[0.16em] text-cream-400">
        {count} {count === 1 ? "review" : "reviews"}
      </p>
    </div>
  );
}

function Quote({ item }) {
  return (
    <figure className="panel-lit relative flex h-full flex-col overflow-hidden bg-ink-800/40 p-7">
      {/* The opening mark, set as ornament rather than punctuation: it is
          decorative, so the quote below keeps its own real quotation marks for
          anyone reading with the styles off. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-8 select-none text-[7rem] leading-none text-cream-50/[0.05]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        &rdquo;
      </span>

      <Rating value={item.rating} count={1} showCount={false} size="sm" />

      <blockquote
        className="relative mt-5 flex-1 text-[1.12rem] leading-[1.6] text-cream-100"
        style={{ fontFamily: "var(--font-display)" }}
      >
        &ldquo;{item.body}&rdquo;
      </blockquote>

      <figcaption className="mt-7 border-t border-border-subtle pt-5 text-sm text-cream-400">
        <span className="text-cream-200">{item.authorName}</span>
        {item.location ? <span> · {item.location}</span> : null}
        {item.isVerified ? (
          <span className="ml-2 border border-emerald-400/30 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-leaf-300">
            Verified
          </span>
        ) : null}

        {/* `flex`, not `inline-flex`: inline ran the product straight on from
            the author, so the caption read "Sruthi Bon Movita Sprouted…". */}
        {item.product ? (
          <Link
            href={`/product/${item.product.slug}`}
            className="mt-2 flex min-h-[1.5rem] items-center text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
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

function Arrow({ label, onClick, direction }) {
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
