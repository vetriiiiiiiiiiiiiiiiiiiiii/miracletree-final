"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { initMotion, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
const STEPS = [
  {
    id: "seed",
    label: "Seed",
    body: "Quality control starts before the plant reaches the field. Seeds enter documented nursery protocols — germination protocols, grow-bag systems, soil-media modification and young-plant hardening — so every tree begins from a verified, healthy start.",
  },
  {
    id: "cultivation",
    label: "Cultivation",
    body: "Grown under one of four documented planting models — 12×12 ft, 8×8 ft, 4×4 ft or high density up to 3,800 plants an acre — matched to the crop's purpose: leaf, biomass or tree development. Every practice follows SOPs developed and demonstrated on our own farm.",
  },
  {
    id: "harvest",
    label: "Harvest",
    body: "Harvesting is planned around what happens next: post-harvest handling and drying requirements decide how and when leaf is picked. Careful harvesting is the first quality step after cultivation — and harvesting practices are among the SOPs we developed on our farm and transferred to farmers.",
  },
  {
    id: "drying",
    label: "Drying",
    // The step's own line was removed on instruction; the supplied CLHPD
    // paragraph below carries this step.
    body: null,
  },
  {
    id: "processing",
    label: "Processing",
    body: "Dried leaf enters a controlled chain — milling, sieving and quality control — before anything is formulated, blended or pressed. It is the same chain MiracleTree® now designs into full processing facilities: receiving, cleaning, de-stemming, controlled drying, milling, sieving, quality control, packing.",
  },
  {
    id: "packaging",
    label: "Packaging",
    body: "Packaging is a quality step, not an afterthought. It sits inside the controlled chain — formulation → packaging → traceability — so what reaches your kitchen can be traced back through processing to the farm.",
  },
  {
    id: "home",
    label: "Your home",
    body: "Shipped across India. Free above ₹699.",
  },
];
/**
 * Farm to pack.
 *
 * A sticky rail on desktop: the step list stays put while the description
 * changes with scroll. On small screens it degrades to a plain ordered list,
 * because a sticky two-column layout on a phone is just a shorter list that
 * fights the thumb.
 */
export function ProcessSection({ title, subtitle }) {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    initMotion();
    if (prefersReducedMotion()) return;
    const section = sectionRef.current;
    if (!section) return;
    const rows = [...section.querySelectorAll("[data-step]")];
    const triggers = rows.map((row, index) =>
      ScrollTrigger.create({
        trigger: row,
        start: "top 62%",
        end: "bottom 62%",
        onToggle: (self) => {
          if (self.isActive) setActive(index);
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);
  return (
    <Section
      ref={sectionRef}
      id="farm-to-pack"
      tone="raised"
      spacing="default"
      className="grain"
    >
      <Container>
        <SectionHeading title={title} lede={subtitle ?? undefined} />

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Sticky index */}
          <div className="hidden lg:block">
            <ol className="sticky top-32 grid gap-0">
              {STEPS.map((step, index) => (
                <li
                  key={step.id}
                  className={cn(
                    "grid grid-cols-[2.5rem_1fr] items-center gap-4 border-l py-3.5 pl-5 transition-all duration-500",
                    index === active
                      ? "border-gold-400 text-cream-50"
                      : "border-border-subtle text-cream-400",
                  )}
                >
                  <span className="text-[0.66rem] tabular-nums tracking-[0.16em]">
                    0{index + 1}
                  </span>
                  <span className="text-[1.05rem]">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Steps */}
          <ol className="grid gap-0">
            {STEPS.map((step, index) => (
              <li
                key={step.id}
                data-step
                className="border-t border-border-subtle py-10 first:border-t-0 first:pt-0 lg:py-16"
              >
                <p className="eyebrow mb-4 flex items-center gap-3 text-gold-400 lg:hidden">
                  <span className="tabular-nums">0{index + 1}</span>
                  <span className="h-px w-6 bg-gold-400/40" aria-hidden />
                </p>

                <h3
                  className={cn(
                    "text-title transition-colors duration-700",
                    index === active ? "text-cream-50" : "text-cream-200",
                  )}
                >
                  {step.label}
                </h3>
                {step.body ? (
                  <p className="mt-4 max-w-[48ch] leading-relaxed text-cream-400">
                    {step.body}
                  </p>
                ) : null}

                {step.id === "drying" ? (
                  <p className="mt-6 max-w-[48ch] text-sm leading-relaxed text-cream-300">
                    Building on years of low-temperature expertise, CLHPD represents the
                    next stage in MiracleTree&rsquo;s controlled dehydration journey.
                    Developed specifically for premium Moringa and herbal materials, it
                    safeguards the nutrients and integrity often lost to conventional
                    drying.
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
