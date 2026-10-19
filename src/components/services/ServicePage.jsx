import { breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
/**
 * The shared layout for the Company menu's service pages (farm consultancy,
 * third-party manufacturing): intro and figures, what the service covers,
 * the record behind it, how an engagement runs, and an enquiry block that
 * opens an email with the subject already filled in.
 */
export function ServicePage({
  slug,
  eyebrow,
  title,
  intro,
  figures,
  offeringsTitle,
  offeringsLede,
  offerings,
  recordTitle,
  record,
  steps,
  enquirySubject,
  enquiryBody,
}) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: eyebrow, path: `/${slug}` },
  ];
  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(enquirySubject)}`;
  const tel = `tel:${SITE.phone.replace(/\s+/g, "")}`;
  return (
    <>
      <JsonLd id={`${slug}-breadcrumb`} data={breadcrumbSchema(crumbs)} />

      <Section spacing="none" className="pt-6 md:pt-8">
        <Container>
          <Breadcrumbs items={crumbs} />

          <Reveal className="mt-10 max-w-[62ch]">
            <p className="eyebrow text-gold-400">{eyebrow}</p>
            <h1 className="mt-5 text-display text-cream-50">{title}</h1>
            <p className="mt-8 text-[1.15rem] leading-relaxed text-cream-300">{intro}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href={mailto}>Send an enquiry</LinkButton>
              <LinkButton href={tel} variant="secondary">
                Call {SITE.phone}
              </LinkButton>
            </div>
          </Reveal>

          <Reveal className="mt-16 pb-12 md:pb-16" stagger={0.06}>
            <dl className="grid gap-x-8 gap-y-10 border-t border-border-subtle pt-10 sm:grid-cols-2 lg:grid-cols-4">
              {figures.map((figure) => (
                <div key={figure.label} data-animate="fade-up">
                  <dd className="font-display text-[2.4rem] leading-none text-cream-50">{figure.value}</dd>
                  <dt className="mt-3 text-[0.95rem] text-cream-200">{figure.label}</dt>
                  {figure.note ? (
                    <p className="mt-1 text-sm leading-relaxed text-cream-400">{figure.note}</p>
                  ) : null}
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </Section>

      <Section tone="raised">
        <Container>
          <SectionHeading title={offeringsTitle} lede={offeringsLede} />
          <Reveal className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {offerings.map((item, index) => (
              <article
                key={item.title}
                data-animate="fade-up"
                className="rounded-[1.5rem] border border-border-subtle bg-ink p-7"
              >
                <span className="text-[0.66rem] tabular-nums tracking-[0.16em] text-gold-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[1.1rem] leading-snug text-cream-50">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream-400">{item.body}</p>
              </article>
            ))}
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading title={recordTitle} />
            <Reveal as="ul" className="divide-y divide-border-subtle border-y border-border-subtle" stagger={0.05}>
              {record.map((item) => (
                <li key={item.title} data-animate="fade-up" className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr] sm:gap-6">
                  <span className="text-sm tabular-nums text-gold-400">{item.when}</span>
                  <div>
                    <h3 className="text-[1.05rem] text-cream-50">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-cream-400">{item.body}</p>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="raised">
        <Container>
          <SectionHeading title="How an engagement runs" />
          <Reveal as="ol" className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
            {steps.map((step, index) => (
              <li key={step.title} data-animate="fade-up" className="border-t border-gold-500/50 pt-6">
                <span className="font-display text-[1.6rem] leading-none text-gold-400">{index + 1}</span>
                <h3 className="mt-4 text-[1.05rem] text-cream-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-400">{step.body}</p>
              </li>
            ))}
          </Reveal>
        </Container>
      </Section>

      <Section tone="forest">
        <Container>
          <div className="mx-auto max-w-[56ch] text-center">
            <h2 className="text-title text-cream-50">Start a conversation</h2>
            <p className="mt-5 leading-relaxed text-cream-300">{enquiryBody}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href={mailto}>Email {SITE.email}</LinkButton>
              <LinkButton href={tel} variant="secondary">
                Call {SITE.phone}
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-cream-400">{SITE.phoneHours}</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
