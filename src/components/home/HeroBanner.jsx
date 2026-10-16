"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/money";
/**
 * The homepage banner carousel.
 *
 * Slide one carries the CMS hero copy; every product ticked "Homepage hero" in
 * the admin gets a slide of its own. Each slide is a rounded panel in one of a
 * few soft brand tints with the pack photographed on the right. It advances
 * every six seconds, pauses on hover/focus, swipes on touch, and respects
 * reduced motion by not advancing at all.
 */
const TINTS = [
  "from-[#e8f4ea] to-[#f6fbf3]",
  "from-[#fdf0e1] to-[#fff8ef]",
  "from-[#fbe6ee] to-[#fff4f8]",
  "from-[#e6f0f7] to-[#f5fafd]",
];
export function HeroBanner({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const count = slides.length;
  const go = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count],
  );
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => go(index + 1), 6000);
    return () => window.clearTimeout(id);
  }, [index, paused, count, go]);
  if (!count) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="mx-auto max-w-[90rem] gutter pt-4 md:pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-[var(--ease-organic)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              className={cn(
                "relative grid w-full shrink-0 grid-cols-1 items-center gap-4 bg-gradient-to-br px-6 py-8 sm:px-10 md:min-h-[26rem] md:grid-cols-[1.1fr_1fr] md:px-14 md:py-10 lg:min-h-[30rem]",
                TINTS[i % TINTS.length],
                "dark:from-forest-800 dark:to-ink-800",
              )}
            >
              <div className="relative z-10 max-w-xl">
                {slide.eyebrow ? (
                  <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-wider text-emerald-600 dark:bg-ink-700 dark:text-leaf-200">
                    {slide.eyebrow}
                  </p>
                ) : null}
                <h2
                  className={cn(
                    "mt-4 font-extrabold leading-[1.05] tracking-tight text-cream-50",
                    i === 0
                      ? "text-[2.1rem] sm:text-5xl lg:text-[3.6rem]"
                      : "text-[1.9rem] sm:text-4xl lg:text-5xl",
                  )}
                >
                  {slide.title}
                </h2>
                {slide.subtitle ? (
                  <p className="mt-4 line-clamp-3 max-w-md text-[1rem] leading-relaxed text-cream-300 md:text-lg">
                    {slide.subtitle}
                  </p>
                ) : null}
                {slide.price ? (
                  <p className="mt-4 text-lg font-bold text-cream-50">
                    <span className="text-sm font-medium text-cream-400">From </span>
                    {formatPrice(slide.price)}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={slide.ctaHref}
                    tabIndex={i === index ? undefined : -1}
                    className="inline-flex h-12 items-center rounded-full bg-emerald-500 px-7 text-[0.92rem] font-bold text-on-accent shadow-sm transition-colors hover:bg-emerald-600"
                  >
                    {slide.ctaLabel}
                  </Link>
                  {slide.secondaryHref ? (
                    <Link
                      href={slide.secondaryHref}
                      tabIndex={i === index ? undefined : -1}
                      className="inline-flex h-12 items-center rounded-full border-2 border-cream-50/15 bg-white/60 px-6 text-[0.92rem] font-bold text-cream-50 transition-colors hover:border-emerald-500 hover:text-emerald-500 dark:bg-transparent"
                    >
                      {slide.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </div>

              {slide.image ? (
                <div className="relative mx-auto aspect-square w-full max-w-[17rem] sm:max-w-[20rem] md:max-w-[26rem]">
                  <div className="absolute inset-[8%] rounded-full bg-white/70 dark:bg-ink-700/60" aria-hidden />
                  <Image
                    src={slide.image}
                    alt={slide.imageAlt ?? ""}
                    fill
                    priority={i === 0}
                    sizes="(min-width: 768px) 420px, 280px"
                    className="object-contain p-[10%] mix-blend-multiply dark:mix-blend-normal"
                    unoptimized={slide.image.startsWith("/uploads/")}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-cream-50 shadow-md transition-transform hover:scale-105 md:grid dark:bg-ink-700"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-cream-50 shadow-md transition-transform hover:scale-105 md:grid dark:bg-ink-700"
            >
              <Chevron dir="right" />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-7 bg-emerald-500" : "w-2 bg-ink-600 hover:bg-cream-400",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
function Chevron({ dir }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M12.5 4 6.5 10l6 6" : "M7.5 4l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
