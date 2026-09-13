"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { initMotion, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
const STEPS = [
  {
    id: "seed",
    label: "Seed",
    body: "Winged seeds are sown at the field edge before the north-east monsoon.",
  },
  {
    id: "cultivation",
    label: "Cultivation",
    body: "No irrigation infrastructure and no shade house. The tree wants poor, well-drained soil.",
  },
  {
    id: "harvest",
    label: "Harvest",
    body: "Leaflets are stripped by hand at first light, when the leaf still holds its moisture.",
  },
  {
    id: "drying",
    label: "Drying",
    body: "Into shade within the hour, then dried below 40°C. This is the step that decides the colour.",
  },
  {
    id: "processing",
    label: "Processing",
    body: "Milled, sieved to grade, and tested before anything is blended or pressed.",
  },
  {
    id: "packaging",
    label: "Packaging",
    body: "Sealed in small batches, so a pack is rarely more than a few weeks old.",
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
                <p className="mt-4 max-w-[48ch] leading-relaxed text-cream-400">
                  {step.body}
                </p>

                {step.id === "drying" ? (
                  <p className="mt-6 max-w-[44ch] border-l border-gold-500/40 pl-5 text-sm leading-relaxed text-cream-300">
                    Sun-drying is faster and cheaper, and it is why most moringa powder
                    is olive rather than green. It is the one corner we do not cut.
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
