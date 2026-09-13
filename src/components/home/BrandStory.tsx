"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Container, Section } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { RevealText } from "@/components/motion/Reveal";
import { imageReveal, initMotion } from "@/lib/motion";

export function BrandStory({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  image,
}: {
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  image: { url: string; alt: string } | null;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initMotion();
    const frame = frameRef.current;
    const inner = imageRef.current;
    if (!frame || !inner) return;

    const trigger = imageReveal(frame, inner);
    return () => trigger?.kill();
  }, []);

  return (
    <Section id="story" tone="raised" spacing="default" className="grain">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-3 text-gold-400">
              <span className="tabular-nums">09</span>
              <span className="h-px w-8 bg-gold-400/40" aria-hidden />
              <span className="text-cream-400">Our story</span>
            </p>

            <RevealText as="h2" className="max-w-[15ch] text-display text-cream-50">
              {title}
            </RevealText>

            {subtitle ? (
              <p className="mt-8 max-w-[48ch] text-[1.05rem] leading-relaxed text-cream-300">
                {subtitle}
              </p>
            ) : null}

            <p className="mt-6 max-w-[48ch] leading-relaxed text-cream-400">
              The work has not changed much in that time: find growers who treat the tree
              properly, get the leaf into shade quickly, and dry it slowly enough that it
              still looks like a leaf when it reaches the mill.
            </p>

            {ctaLabel && ctaHref ? (
              <LinkButton href={ctaHref} variant="secondary" className="mt-10" magnetic>
                {ctaLabel}
              </LinkButton>
            ) : null}
          </div>

          <div
            ref={frameRef}
            className="relative aspect-4/5 overflow-hidden bg-ink"
            style={{ clipPath: "inset(0% 0% 100% 0%)" }}
          >
            <div ref={imageRef} className="absolute inset-0">
              {image ? (
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-contain p-10"
                />
              ) : (
                <div className="grid h-full place-items-center text-cream-400">
                  <span className="eyebrow">Miracletree Life Science · Madurai</span>
                </div>
              )}
            </div>

            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-6 text-xs text-cream-400">
              Madurai, Tamil Nadu — where the leaf is grown, dried and milled.
            </figcaption>
          </div>
        </div>
      </Container>
    </Section>
  );
}
