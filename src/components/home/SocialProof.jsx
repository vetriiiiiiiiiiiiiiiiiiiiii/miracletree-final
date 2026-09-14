import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { TestimonialCarousel } from "@/components/home/TestimonialCarousel";
/**
 * Social proof, drawn entirely from real submissions. Nothing is seeded or
 * synthesised — if there are no approved reviews and no testimonials, the
 * section renders an honest invitation instead of filler.
 */
export function SocialProof({ title, subtitle, items }) {
  return (
    <Section id="reviews" tone="default" spacing="default" className="grain">
      <Container>
        <SectionHeading title={title} lede={subtitle ?? undefined} />

        {items.length === 0 ? (
          <div className="mt-14 max-w-[52ch] border-l border-gold-500/40 pl-6">
            <p className="leading-relaxed text-cream-300">
              We are rebuilding this section around verified reviews only. If you have
              bought from us before, your review will appear here once it is approved.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block text-[0.72rem] uppercase tracking-[0.16em] text-gold-300 underline underline-offset-4"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <TestimonialCarousel items={items} />
        )}
      </Container>
    </Section>
  );
}
