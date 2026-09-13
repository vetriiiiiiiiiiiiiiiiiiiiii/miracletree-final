import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { INNOVATIONS } from "@/lib/innovation";
/**
 * What the company invented, on the homepage.
 *
 * The homepage previously explained moringa at length and never said what
 * Miracletree had done with it. A visitor could read the whole page and not
 * learn that the drying technology is the company's own, or that the energy bar
 * was the first of its kind — which is the entire reason to buy here rather
 * than from any other moringa seller.
 */
export function InnovationStrip() {
  return (
    <Section tone="raised" spacing="default" id="innovation">
      <Container>
        <Reveal>
          <SectionHeading
            title="What we developed"
            lede="Two drying technologies, the first moringa-leaf energy bar, and cold-pressed seed oil. Built between 2014 and 2019."
          />
        </Reveal>

        <Reveal className="mt-16" stagger={0.07}>
          <ul className="grid gap-px border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
            {INNOVATIONS.map((item) => (
              <li key={item.slug} data-animate="fade-up">
                <Link
                  href={`/innovation#${item.slug}`}
                  className="group flex h-full flex-col bg-ink-800 p-7 transition-colors hover:bg-ink-700"
                >
                  <span className="text-[0.72rem] tabular-nums tracking-[0.16em] text-gold-400">
                    {item.year}
                  </span>
                  <h3 className="mt-4 font-display text-[1.45rem] leading-tight text-cream-50">
                    {item.name}
                  </h3>
                  {item.expansion ? (
                    <p className="mt-2 text-[0.78rem] leading-snug text-cream-400">
                      {item.expansion}
                    </p>
                  ) : null}
                  <p className="mt-5 flex-1 text-[0.95rem] leading-relaxed text-cream-300">
                    {item.headline}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-cream-400 transition-colors group-hover:text-cream-100">
                    More
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-12">
          <LinkButton href="/innovation" variant="secondary">
            All four in detail
          </LinkButton>
        </Reveal>
      </Container>
    </Section>
  );
}
