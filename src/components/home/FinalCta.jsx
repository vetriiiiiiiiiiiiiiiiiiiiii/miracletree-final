"use client";
import { useEffect, useRef } from "react";
import { LinkButton } from "@/components/ui/Button";
import { BotanicalSeed } from "@/components/hero/BotanicalSeed";
import { FloatingParticles } from "@/components/motion/FloatingParticles";
import { initMotion, parallax } from "@/lib/motion";
import { analytics } from "@/lib/analytics";
/**
 * The closing frame returns to the seed the page opened on — the same drawing,
 * at the other end of the story.
 */
export function FinalCta({ title, subtitle, ctaLabel, ctaHref }) {
  const seedRef = useRef(null);
  const sectionRef = useRef(null);
  useEffect(() => {
    initMotion();
    const seed = seedRef.current;
    const section = sectionRef.current;
    if (!seed || !section) return;
    const trigger = parallax(seed, { amount: 10, trigger: section });
    return () => trigger?.kill();
  }, []);
  return (
    <section
      ref={sectionRef}
      className="grain relative flex min-h-[85svh] items-center overflow-hidden bg-ink py-28"
      aria-label={title}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 100%, rgba(28,90,58,0.28) 0%, rgba(6,9,7,0) 70%)",
        }}
      />

      {/* Ambient drift over the ground, under the seed and the copy. */}
      <FloatingParticles />

      <div
        ref={seedRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.16]"
      >
        <BotanicalSeed className="h-[80%] w-auto" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl gutter text-center">
        {subtitle ? <p className="eyebrow mb-8 text-gold-400">{subtitle}</p> : null}

        <h2
          className="text-hero text-cream-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <LinkButton
            href={ctaHref}
            size="lg"
            magnetic
            onClick={() => analytics.ctaClick(ctaLabel, "final-cta")}
          >
            {ctaLabel}
          </LinkButton>
          <LinkButton
            href="/moringa"
            variant="secondary"
            size="lg"
            magnetic
            magneticStrength={0.18}
          >
            Discover moringa
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
