"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { LinkButton } from "@/components/ui/Button";
import { BotanicalSeed } from "@/components/hero/BotanicalSeed";
import { heroTimeline, initMotion, parallax } from "@/lib/motion";
import { analytics } from "@/lib/analytics";

// WebGL is atmosphere, not content — it loads after the hero is already readable.
const HeroCanvas = dynamic(
  () => import("@/components/hero/HeroCanvas").then((m) => m.HeroCanvas),
  { ssr: false },
);

export type HeroContent = {
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string | null;
  secondaryHref: string | null;
  /** Product photograph the seed sequence resolves into. */
  image: { url: string; alt: string } | null;
};

/**
 * "The moringa awakens."
 *
 * The sequence is: near-black stage → drawn seed germinating → headline lines
 * rising → the real product resolving beside it. It runs once, in about three
 * seconds, and never blocks scrolling — the page is usable from the first frame
 * and the animation simply plays over it.
 */
export function Hero({ content }: { content: HeroContent }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initMotion();

    const stage = stageRef.current;
    const headline = headlineRef.current;
    if (!stage || !headline) return;

    let tl: gsap.core.Timeline | undefined;
    let trigger: ReturnType<typeof parallax>;
    let cancelled = false;

    // Splitting before webfonts settle puts the line masks in the wrong places.
    document.fonts.ready.then(() => {
      if (cancelled) return;
      tl = heroTimeline({
        stage,
        seed: seedRef.current,
        headline,
        sub: subRef.current,
        actions: actionsRef.current,
        scrollCue: cueRef.current,
      });
      if (productRef.current) {
        trigger = parallax(productRef.current, { amount: 6, trigger: stage });
      }
    });

    return () => {
      cancelled = true;
      tl?.kill();
      trigger?.kill();
    };
  }, []);

  return (
    <section
      ref={stageRef}
      className="relative grain flex min-h-[100svh] items-center overflow-hidden bg-ink pt-20 pb-24 md:pt-0 md:pb-0"
      aria-label="From the Miracle Tree"
    >
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <HeroCanvas className="h-full w-full opacity-70" />
      </div>

      {/* A low forest glow so the black never reads as an empty viewport */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[60%]"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 100%, rgba(28,90,58,0.30) 0%, rgba(6,9,7,0) 70%)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[100rem] items-center gap-14 gutter md:grid-cols-[1.15fr_0.85fr] md:gap-10">
        {/* Copy */}
        <div className="max-w-[46rem]">
          <p className="eyebrow mb-8 flex items-center gap-3 text-gold-400">
            <span className="h-px w-10 bg-gold-400/50" aria-hidden />
            Moringa oleifera · Madurai
          </p>

          <h1
            ref={headlineRef}
            className="text-hero text-cream-50 opacity-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {content.title}
          </h1>

          {content.subtitle ? (
            <p
              ref={subRef}
              className="mt-8 max-w-[46ch] text-[1.05rem] leading-relaxed text-cream-300/85 opacity-0 md:text-[1.15rem]"
              style={{ transform: "translateY(18px)" }}
            >
              {content.subtitle}
            </p>
          ) : null}

          <div
            ref={actionsRef}
            className="mt-11 flex flex-wrap items-center gap-4 opacity-0"
            style={{ transform: "translateY(18px)" }}
          >
            <LinkButton
              href={content.ctaHref}
              size="lg"
              magnetic
              onClick={() => analytics.ctaClick(content.ctaLabel, "hero")}
            >
              {content.ctaLabel}
            </LinkButton>

            {content.secondaryLabel && content.secondaryHref ? (
              <LinkButton
                href={content.secondaryHref}
                variant="secondary"
                size="lg"
                magnetic
                magneticStrength={0.18}
                onClick={() => analytics.ctaClick(content.secondaryLabel!, "hero")}
              >
                {content.secondaryLabel}
              </LinkButton>
            ) : null}
          </div>

          <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-[0.7rem] uppercase tracking-[0.14em] text-cream-400">
            <li>Shade-dried below 40°C</li>
            <li aria-hidden className="text-white/15">/</li>
            <li>Grown in Tamil Nadu</li>
            <li aria-hidden className="text-white/15">/</li>
            <li>Free shipping over ₹699</li>
          </ul>
        </div>

        {/* Seed resolving into the product */}
        <div className="relative mx-auto flex aspect-square w-full max-w-[26rem] items-center justify-center md:max-w-none">
          <div
            ref={seedRef}
            className="absolute inset-0 flex items-center justify-center opacity-0"
          >
            <BotanicalSeed className="h-[85%] w-auto" />
          </div>

          {content.image ? (
            <div ref={productRef} className="relative h-full w-full">
              <Image
                src={content.image.url}
                alt={content.image.alt}
                fill
                priority
                sizes="(max-width: 768px) 80vw, 40vw"
                className="object-contain p-8 drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Scroll cue */}
      <div
        ref={cueRef}
        className="absolute inset-x-0 bottom-7 z-10 flex justify-center opacity-0"
        aria-hidden
      >
        <span className="flex flex-col items-center gap-3 text-[0.6rem] uppercase tracking-[0.24em] text-cream-400">
          Scroll
          <span className="relative block h-10 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-x-0 top-0 h-4 animate-[scrollCue_2.2s_var(--ease-organic)_infinite] bg-gold-400" />
          </span>
        </span>
      </div>

      <style>{`
        @keyframes scrollCue {
          0% { transform: translateY(-100%); }
          60%, 100% { transform: translateY(280%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="scrollCue"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
