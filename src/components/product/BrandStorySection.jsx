import { Container, Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";

/**
 * The sub-brand's story, on the page where its product is sold.
 *
 * Set as an essay rather than as marketing blocks: a measure that stays near
 * sixty characters, a lede at display size, and the company's own closing line
 * pulled out as a quotation. These stories are the argument for why the
 * product exists at all, so they are given room instead of being compressed
 * into three feature cards with icons.
 */
export function BrandStorySection({ story }) {
  if (!story) return null;

  return (
    <Section id="brand-story" tone="forest" spacing="default" className="grain">
      <Container>
        <div className="mx-auto max-w-[46rem]">
          <Reveal>
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-400">
              {story.brand} · {story.tagline}
            </p>

            <p className="mt-6 font-display text-[clamp(1.5rem,3.2vw,2.35rem)] leading-[1.25] text-cream-50">
              {story.lede}
            </p>

            <div className="mt-8 space-y-5">
              {story.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="max-w-[62ch] text-[1.02rem] leading-[1.75] text-cream-300"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <blockquote className="mt-10 border-l-2 border-gold-400/60 pl-6">
              <p
                className="text-[clamp(1.05rem,2vw,1.35rem)] leading-snug text-cream-100"
                style={{ fontFamily: "var(--font-display)" }}
              >
                &ldquo;{story.line}&rdquo;
              </p>
              <footer className="mt-3 text-[0.72rem] uppercase tracking-[0.16em] text-cream-400">
                MiracleTree Life Science
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
