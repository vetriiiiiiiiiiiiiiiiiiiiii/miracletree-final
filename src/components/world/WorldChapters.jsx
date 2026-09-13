"use client";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { MoringaWorld } from "@/components/world/MoringaWorld";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
/**
 * The copy that rides on the world.
 *
 * Text lives in the DOM, not in the 3D scene: it is selectable, translatable,
 * indexable, and readable by a screen reader that will never see a shader.
 * Every chapter is in the server-rendered HTML from the first byte — the canvas
 * only changes which one is *visible*.
 */
export function WorldChapters({
  chapters,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  poster,
}) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const lastIndex = useRef(0);
  // The scene reports every frame. Re-rendering React 60 times a second to move
  // a progress bar would cost more than the 3D scene itself, so state is only
  // touched when the displayed value actually changes: once per whole percent,
  // and once per chapter.
  const lastPercent = useRef(-1);
  const onChapter = useCallback((state) => {
    const percent = Math.round(state.global * 100);
    if (percent !== lastPercent.current) {
      lastPercent.current = percent;
      setProgress(state.global);
    }
    if (state.index !== lastIndex.current) {
      lastIndex.current = state.index;
      setActive(state.index);
    }
  }, []);
  const isFinal = active >= chapters.length - 1;
  // Matches the scene's particle morph (0.78 → 0.96), so the photograph arrives
  // exactly as the cloud finishes assembling rather than crossing it.
  const productReveal = Math.max(0, Math.min(1, (progress - 0.9) / 0.09));
  return (
    <section className="relative" aria-label="From seed to product">
      <MoringaWorld onChapter={onChapter} poster={poster} className="relative">
        {/* Overlay rides above the sticky canvas — and is contained by it. */}
        {/* Copy sits low on phones so the 3D subject has the upper half to
            itself; centred from `md` up, where the layout is two columns. */}
        {/* A scrim under the copy.
            The chapter text sits directly on the WebGL canvas, and on paper the
            canopy behind it is bright and busy enough to swallow body copy
            entirely. No DOM-contrast check can catch this, because the thing
            behind the text is a canvas rather than a background colour — so the
            copy gets its own ground, weighted to the side it occupies and fading
            out before it reaches the middle of the frame. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            // A soft pool of ground under the copy, not a half-screen panel.
            // The linear version ended at a fixed percentage of the width, which
            // put a dead-straight vertical seam down the middle of the frame —
            // very visible once the scene behind it was bright. An ellipse has no
            // edge to notice, and it stops darkening the half of the picture that
            // has no text on it.
            background:
              "radial-gradient(ellipse 60% 74% at 22% 47%," +
              " color-mix(in srgb, var(--color-ink) 86%, transparent) 0%," +
              " color-mix(in srgb, var(--color-ink) 50%, transparent) 45%," +
              " transparent 74%)",
          }}
        />

        <div className="pointer-events-none absolute inset-0 z-20 flex items-end pb-24 md:items-center md:pb-0">
          <div className="mx-auto w-full max-w-[100rem] gutter">
            <div className="max-w-xl">
              {chapters.map((chapter, index) => (
                <article
                  key={chapter.index}
                  aria-hidden={index !== active}
                  className={cn(
                    "transition-all duration-[900ms] ease-[var(--ease-organic)]",
                    index === active
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none absolute translate-y-6 opacity-0",
                  )}
                >
                  <p className="eyebrow mb-6 flex items-center gap-3 text-gold-400">
                    <span className="tabular-nums">{chapter.index}</span>
                    <span className="h-px w-10 bg-gold-400/40" aria-hidden />
                    <span className="text-cream-400">{chapter.eyebrow}</span>
                  </p>

                  {/* The first chapter carries the page's only h1. The homepage
                previously had none at all — every chapter title was an h2 —
                which leaves the document with no top-level heading for
                search engines or a screen reader to anchor on. */}
                  {index === 0 ? (
                    <h1
                      className="text-display text-cream-50"
                      style={{
                        fontFamily: "var(--font-display)",
                        textShadow: "0 2px 40px rgba(5,7,10,0.9)",
                      }}
                    >
                      {chapter.title}
                    </h1>
                  ) : (
                    <h2
                      className="text-display text-cream-50"
                      style={{
                        fontFamily: "var(--font-display)",
                        textShadow: "0 2px 40px rgba(5,7,10,0.9)",
                      }}
                    >
                      {chapter.title}
                    </h2>
                  )}

                  <p className="mt-6 max-w-[44ch] text-[1.05rem] leading-relaxed text-cream-200/90">
                    {chapter.body}
                  </p>

                  {index === 0 ? (
                    <div className="pointer-events-auto mt-10 flex flex-wrap items-center gap-4">
                      <LinkButton
                        href={ctaHref}
                        size="lg"
                        magnetic
                        onClick={() => analytics.ctaClick(ctaLabel, "world-hero")}
                      >
                        {ctaLabel}
                      </LinkButton>
                      {secondaryLabel && secondaryHref ? (
                        <LinkButton
                          href={secondaryHref}
                          variant="secondary"
                          size="lg"
                          magnetic
                          magneticStrength={0.18}
                        >
                          {secondaryLabel}
                        </LinkButton>
                      ) : null}
                    </div>
                  ) : null}

                  {isFinal && index === active ? (
                    <div className="pointer-events-auto mt-10">
                      <LinkButton
                        href={ctaHref}
                        size="lg"
                        magnetic
                        onClick={() =>
                          analytics.ctaClick("Shop the collection", "world-final")
                        }
                      >
                        Shop the collection
                      </LinkButton>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* The payoff. The whole journey is "a seed becomes this", so the last
            chapter has to actually show the product — the particle cloud gathers
            into its silhouette and the real photograph resolves on top of it. */}
        {poster ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            style={{
              opacity: productReveal,
              transform: `scale(${0.92 + productReveal * 0.08})`,
              transition: "opacity 240ms linear, transform 240ms linear",
            }}
          >
            <div className="relative h-[62%] w-[62%] max-w-[30rem]">
              <Image
                src={poster.url}
                alt=""
                fill
                sizes="30rem"
                className="object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.75)]"
              />
            </div>
          </div>
        ) : null}

        {/* Chapter rail — where you are, and how far is left. */}
        <nav
          aria-label="Journey chapters"
          className="pointer-events-none absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
        >
          <ol className="grid gap-4">
            {chapters.map((chapter, index) => (
              <li key={chapter.index} className="flex items-center justify-end gap-3">
                <span
                  className={cn(
                    "text-[0.6rem] uppercase tracking-[0.14em] transition-all duration-500",
                    index === active
                      ? "text-cream-100 opacity-100"
                      : "translate-x-2 text-cream-400 opacity-0",
                  )}
                >
                  {chapter.eyebrow}
                </span>
                <span
                  className={cn(
                    "block h-px transition-all duration-500 ease-[var(--ease-organic)]",
                    index === active ? "w-8 bg-gold-400" : "w-4 bg-border-strong",
                  )}
                  aria-hidden
                />
              </li>
            ))}
          </ol>
        </nav>

        {/* Progress + scroll cue */}
        <div
          aria-hidden
          // Hidden on phones: it collides with the calls to action, and nobody
          // needs to be told to scroll on a touch device.
          className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        >
          <span className="text-[0.58rem] uppercase tracking-[0.24em] text-cream-400">
            {progress < 0.02 ? "Scroll to begin" : `${Math.round(progress * 100)}%`}
          </span>
          <span className="block h-14 w-px overflow-hidden bg-border-subtle">
            <span
              className="block w-px bg-gold-400 transition-[height] duration-300"
              style={{ height: `${Math.max(4, progress * 100)}%` }}
            />
          </span>
        </div>
      </MoringaWorld>
    </section>
  );
}
