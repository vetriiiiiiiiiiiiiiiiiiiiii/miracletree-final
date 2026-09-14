import Link from "next/link";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { INNOVATIONS, STAGES, FIGURES, CERTIFICATIONS } from "@/lib/innovation";
export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Innovation",
  description:
    "ULTCD and CLHPD controlled low-temperature drying, the world's first moringa-leaf energy bar, and whole-tree processing — the technologies Miracletree Life Science developed in Madurai.",
  path: "/innovation",
});
/**
 * What the company invented.
 *
 * Built as a problem/solution sequence rather than a feature list, because the
 * innovations only mean anything once you know what they were up against —
 * "controlled low-temperature drying" is a phrase, whereas "most moringa powder
 * is olive rather than green because sun-drying is free" is an argument.
 */
export default function InnovationPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Innovation", path: "/innovation" },
  ];
  return (
    <>
      <JsonLd id="innovation-breadcrumb" data={breadcrumbSchema(crumbs)} />

      <Section spacing="none" className="pt-32 md:pt-40">
        <Container>
          <Breadcrumbs items={crumbs} />

          <Reveal className="mt-10 max-w-[60ch]">
            <p className="eyebrow text-gold-400">Innovation</p>
            <h1 className="mt-5 text-display text-cream-50">What we developed</h1>
            <p className="mt-8 text-[1.15rem] leading-relaxed text-cream-300">
              Miracletree has worked on moringa since 2009. In that time the company has
              developed two drying technologies, produced the first moringa-leaf energy
              bar, and built products from the leaf, flower, seed and seed oil.
            </p>
          </Reveal>

          <Reveal className="mt-16" stagger={0.06}>
            <dl className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {FIGURES.map((figure) => (
                <div key={figure.label} data-animate="fade-up">
                  <dd className="font-display text-[2.6rem] leading-none text-cream-50">
                    {figure.value}
                  </dd>
                  <dt className="mt-3 text-[0.95rem] text-cream-200">{figure.label}</dt>
                  <p className="mt-1.5 text-[0.85rem] leading-relaxed text-cream-400">
                    {figure.note}
                  </p>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </Section>

      {/* ----------------------------------------------- the innovations */}
      <Section spacing="default" id="technologies">
        <Container>
          <Reveal>
            <SectionHeading
              title="Four developments"
              lede="Each one solved a specific problem in growing, drying or selling moringa."
            />
          </Reveal>

          <div className="mt-16 grid gap-px border border-border-subtle bg-border-subtle">
            {INNOVATIONS.map((item, i) => (
              <Reveal key={item.slug}>
                <article
                  id={item.slug}
                  className="grid gap-8 bg-ink p-8 md:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16"
                >
                  <div>
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-[2.4rem] leading-none text-gold-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[0.72rem] uppercase tracking-[0.16em] text-cream-400">
                        {item.year}
                      </span>
                    </div>

                    <h3 className="mt-6 font-display text-[1.9rem] leading-tight text-cream-50">
                      {item.name}
                    </h3>
                    {item.expansion ? (
                      <p className="mt-2 text-[0.92rem] leading-relaxed text-cream-400">
                        {item.expansion}
                      </p>
                    ) : null}
                    <p className="mt-5 text-[1.1rem] leading-snug text-cream-200">
                      {item.headline}
                    </p>
                  </div>

                  <div className="lg:border-l lg:border-border-subtle lg:pl-16">
                    <p className="eyebrow text-cream-400">The problem</p>
                    <p className="mt-3 leading-relaxed text-cream-300">
                      {item.problem}
                    </p>

                    <p className="eyebrow mt-8 text-cream-400">What they did</p>
                    <p className="mt-3 leading-relaxed text-cream-300">{item.body}</p>

                    <p className="mt-8 border-t border-border-subtle pt-6 text-[0.95rem] leading-relaxed text-leaf-300">
                      {item.outcome}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------ the arc */}
      <Section tone="forest" spacing="default">
        <Container>
          <Reveal>
            <SectionHeading
              title="How the company grew"
              lede="Five stages, in the order they happened."
            />
          </Reveal>

          <Reveal className="mt-16" stagger={0.07}>
            <ol className="grid gap-px border border-border-subtle bg-border-subtle md:grid-cols-5">
              {STAGES.map((stage) => (
                <li
                  key={stage.stage}
                  data-animate="fade-up"
                  className="bg-forest-900 p-7"
                >
                  <span className="font-display text-[1.4rem] text-gold-400">
                    {stage.stage}
                  </span>
                  <h3 className="mt-4 text-[1.15rem] text-cream-50">{stage.title}</h3>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-cream-300">
                    {stage.body}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </Section>

      {/* ----------------------------------------------- certifications */}
      <Section spacing="default" id="certifications">
        <Container>
          <Reveal>
            <SectionHeading
              title="Certifications"
              lede="Each certificate number can be checked with the body that issued it."
            />
          </Reveal>

          <Reveal className="mt-14" stagger={0.05}>
            <ul className="grid gap-px border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
              {CERTIFICATIONS.map((cert) => (
                <li key={cert.mark} data-animate="fade-up" className="bg-ink p-7">
                  <p className="font-display text-[1.25rem] text-cream-50">
                    {cert.mark}
                  </p>
                  <p className="mt-2 text-[0.85rem] tabular-nums leading-relaxed text-cream-400">
                    {cert.detail}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-10">
            <p className="max-w-[58ch] text-[0.9rem] leading-relaxed text-cream-400">
              The full certification list, with issuers and validity dates, is on{" "}
              <Link
                href="/about#accolades"
                className="text-cream-200 underline decoration-gold-500 underline-offset-4 hover:text-cream-50"
              >
                the story page
              </Link>
              .
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section tone="raised" spacing="tight">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-title text-cream-50">Who built it</h2>
            <p className="mt-4 max-w-[48ch] text-cream-300">
              R. Saravanakumaran developed both drying technologies and leads the
              company&rsquo;s projects in Saudi Arabia and Oman.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/leadership">Meet the founder</LinkButton>
            <LinkButton href="/shop" variant="secondary">
              Shop the range
            </LinkButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
