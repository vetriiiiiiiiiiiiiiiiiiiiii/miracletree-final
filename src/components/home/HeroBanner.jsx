"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
/**
 * The homepage hero: full-bleed photographic slides, managed in
 * Admin → Hero banner.
 *
 * Each slide is a background photograph under a left-hand shade, with a serif
 * headline, a tagline, body copy, up to three feature icons and two buttons.
 * Without a photograph a slide falls back to a deep green ground with its
 * product's packshot, so it never renders as a hole.
 *
 * Slides cross-fade every seven seconds; hovering or focusing pauses them, a
 * swipe moves them on touch, and reduced motion stops the autoplay entirely.
 */
const DURATION = 7000;
const ICONS = {
  leaf: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  shield: "M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3zM9 12l2 2 4-4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
};
export function HeroBanner({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef(null);
  const count = slides.length;
  const go = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count],
  );
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const id = window.setTimeout(() => go(index + 1), DURATION);
    return () => window.clearTimeout(id);
  }, [index, paused, reduced, count, go]);
  if (!count) return null;
  const active = slides[index];
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative isolate overflow-hidden bg-[#0d2416] text-white"
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
      {/* Every slide stays mounted and cross-fades; the active one sets the
          section's height, the rest are layered behind it. */}
      <div className="grid">
        {slides.map((slide, i) => (
          <Slide
            key={slide.key}
            slide={slide}
            active={i === index}
            first={i === 0}
            position={`${i + 1} of ${count}`}
          />
        ))}
      </div>

      {/* Controls: dots and a progress line on the left, the video link on
          the right. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 gutter pb-5 md:pb-7">
          {count > 1 ? (
            <div className="pointer-events-auto flex flex-1 items-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === index
                      ? "w-6 bg-white"
                      : "w-2 border border-white/70 hover:bg-white/60",
                  )}
                />
              ))}
              <span className="relative ml-2 hidden h-px max-w-md flex-1 bg-white/25 sm:block" aria-hidden>
                {!reduced ? (
                  <span
                    key={index}
                    className="absolute inset-0 origin-left bg-white/80"
                    style={{
                      animation: `hero-progress ${DURATION}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                ) : null}
              </span>
            </div>
          ) : (
            <span />
          )}

          {active.videoUrl ? (
            <a
              href={active.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto group flex shrink-0 items-center gap-3 text-sm font-semibold text-white"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#0d2416] shadow-lg transition-transform group-hover:scale-105">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="currentColor">
                  <path d="M3 1.5v11l9-5.5z" />
                </svg>
              </span>
              <span className="hidden sm:inline">{active.videoLabel || "Watch our story"}</span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
function Slide({ slide, active, first, position }) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={position}
      aria-hidden={!active}
      inert={!active}
      className={cn(
        "relative col-start-1 row-start-1 flex min-h-[40rem] items-center transition-opacity duration-700 ease-[var(--ease-organic)] md:min-h-[36rem] lg:min-h-[clamp(36rem,74vh,46rem)]",
        active ? "z-10 opacity-100" : "z-0 opacity-0",
      )}
    >
      {/* Background */}
      {slide.image ? (
        <Image
          src={slide.image}
          alt=""
          fill
          priority={first}
          sizes="100vw"
          // Anchored a little right of centre: the subject sits right of
          // middle (the copy covers the left), and at this anchor it stays in
          // the right half from a tablet up to a wide desktop. Anchoring
          // fully right slid it under the copy on mid-width screens.
          className="-z-10 object-cover object-[60%_center] xl:object-[50%_center]"
          unoptimized={slide.image.startsWith("/uploads/")}
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_78%_45%,#2c6b43_0%,#14351f_55%,#0b1d12_100%)]">
          {slide.packshot ? (
            // Packshots are photographed on white, so they sit on a round
            // cream plate where that white disappears, not on the green.
            <div className="absolute right-[6%] top-1/2 hidden aspect-square w-[min(36vw,30rem)] -translate-y-1/2 md:block">
              <div className="absolute -inset-6 rounded-full bg-[#efe1b4]/10 blur-2xl" aria-hidden />
              <div className="absolute inset-0 overflow-hidden rounded-full bg-[#fbf8f0] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
                <Image
                  src={slide.packshot}
                  alt=""
                  fill
                  priority={first}
                  sizes="30rem"
                  className="object-contain p-[14%] mix-blend-multiply"
                  unoptimized={slide.packshot.startsWith("/uploads/")}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
      {/* The shade that keeps the copy legible over any photograph. */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/65 to-black/50 md:bg-gradient-to-r md:from-black/70 md:via-black/35 md:to-transparent"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-[90rem] gutter pb-24 pt-12 md:py-16">
        <div className="max-w-[38rem]">
          {/* On a phone the packshot sits above the copy rather than beside it. */}
          {!slide.image && slide.packshot ? (
            <div className="relative mb-6 h-28 w-28 overflow-hidden rounded-full bg-[#fbf8f0] shadow-xl md:hidden">
              <Image
                src={slide.packshot}
                alt=""
                fill
                sizes="112px"
                className="object-contain p-3 mix-blend-multiply"
                unoptimized={slide.packshot.startsWith("/uploads/")}
              />
            </div>
          ) : null}
          {slide.eyebrow ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/85 md:text-[0.74rem]">
              {slide.eyebrow.split("·").map((part, i) => (
                <span key={i} className="flex items-center gap-3">
                  {i > 0 ? <span aria-hidden className="h-1 w-1 rounded-full bg-white/70" /> : null}
                  {part.trim()}
                </span>
              ))}
            </p>
          ) : null}

          <h2 className="mt-5 font-[family-name:var(--font-serif)] font-semibold tracking-normal">
            <span className="block text-[3.2rem] leading-[0.95] text-white sm:text-[4.2rem] lg:text-[5.4rem]">
              {slide.title}
            </span>
            {slide.subtitle ? (
              <span className="mt-1 block text-[2.1rem] font-medium leading-[1.05] text-[#efe1b4] sm:text-[2.8rem] lg:text-[3.5rem]">
                {slide.subtitle}
              </span>
            ) : null}
          </h2>

          {slide.tagline ? (
            <p className="mt-4 font-[family-name:var(--font-serif)] text-[1.35rem] leading-snug text-white sm:text-[1.7rem]">
              {slide.tagline}
            </p>
          ) : null}
          {slide.body ? (
            <p className="mt-3 max-w-[30rem] text-[0.95rem] leading-relaxed text-white/85 md:text-[1rem]">
              {slide.body}
            </p>
          ) : null}

          {slide.features.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-4">
              {slide.features.map((f) => (
                <li key={f.text} className="flex max-w-[10rem] items-center gap-2.5 text-[0.82rem] leading-tight text-white/90">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-white">
                    <path d={ICONS[f.icon] ?? ICONS.leaf} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f.text}
                </li>
              ))}
            </ul>
          ) : null}

          {slide.ctaHref || slide.secondaryHref ? (
            <>
              <div className="mt-6 h-px max-w-[32rem] bg-white/25" aria-hidden />
              <div className="mt-6 flex flex-wrap gap-3">
                {slide.ctaHref ? (
                  <Link
                    href={slide.ctaHref}
                    className="inline-flex h-12 items-center gap-3 rounded-full bg-emerald-500 px-7 text-[0.92rem] font-bold text-white shadow-lg transition-colors hover:bg-emerald-400"
                  >
                    {slide.ctaLabel || "Shop now"} <Arrow />
                  </Link>
                ) : null}
                {slide.secondaryHref ? (
                  <Link
                    href={slide.secondaryHref}
                    className="inline-flex h-12 items-center gap-3 rounded-full border border-white/70 px-7 text-[0.92rem] font-semibold text-white transition-colors hover:bg-white hover:text-[#0d2416]"
                  >
                    {slide.secondaryLabel || "Know more"} <Arrow />
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>

    </div>
  );
}
function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
