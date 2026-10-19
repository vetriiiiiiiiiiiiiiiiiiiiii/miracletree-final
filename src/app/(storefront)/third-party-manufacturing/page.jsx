import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import {
  DIFFERENCE,
  FACILITY,
  JOURNEY,
  MANUFACTURING_INTRO,
  PARTNERS,
  RANGES,
} from "@/lib/manufacturing";
export const metadata = buildMetadata({
  title: "Third Party Manufacturing",
  description:
    "Third-party and private-label food manufacturing from MiracleTree's 10,000+ sq ft licensed facility in Madurai: nutrimixes, milk mixes, nutri bars, vacuum-dried fruits and vegetables, masala powders, ready-to-use foods and powder packing from 10 g to 10 kg, under your brand.",
  path: "/third-party-manufacturing",
});
/**
 * Third-party / private-label manufacturing. The flow runs: what we do, why
 * ours is different, the ranges you can put your name on, who it is for,
 * how it runs, and the enquiry. Content lives in src/lib/manufacturing.js.
 */
export default function ThirdPartyManufacturingPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Third Party Manufacturing", path: "/third-party-manufacturing" },
  ];
  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent("Third party manufacturing enquiry")}`;
  const whatsapp = whatsappLink(
    SITE.whatsapp,
    "Hello MiracleTree, I would like to enquire about third party manufacturing.",
  );
  return (
    <>
      <JsonLd id="manufacturing-breadcrumb" data={breadcrumbSchema(crumbs)} />

      {/* Intro */}
      <Section spacing="none" className="pt-6 md:pt-8">
        <Container>
          <Breadcrumbs items={crumbs} />
          <div className="mt-10 grid gap-12 pb-12 md:pb-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal className="max-w-[62ch]">
              <p className="eyebrow text-gold-400">Third Party Manufacturing</p>
              <h1 className="mt-5 text-display text-cream-50">Your brand, our moringa</h1>
              <p className="mt-8 text-[1.1rem] leading-relaxed text-cream-300">{MANUFACTURING_INTRO}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <LinkButton href={whatsapp}>Send an enquiry</LinkButton>
                <LinkButton href="#ranges" variant="secondary">See the ranges</LinkButton>
              </div>
            </Reveal>
            <Reveal stagger={0.06}>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-border-subtle bg-border-subtle">
                {FACILITY.map((item) => (
                  <div key={item.label} data-animate="fade-up" className="bg-ink p-6">
                    <dd className="font-display text-[1.5rem] leading-tight text-cream-50">{item.value}</dd>
                    <dt className="mt-2 text-sm text-cream-200">{item.label}</dt>
                    <p className="mt-0.5 text-xs text-cream-400">{item.note}</p>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* The difference */}
      <Section tone="forest">
        <Container>
          <SectionHeading
            title="Made the MiracleTree way"
            lede="Most contract manufacturers buy moringa in. We grow it, dry it with our own technology, and make it — so the product carrying your name starts better."
          />
          <Reveal className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
            {DIFFERENCE.map((item) => (
              <article key={item.title} data-animate="fade-up" className="border-t border-gold-500/60 pt-6">
                <h3 className="text-[1.1rem] leading-snug text-cream-50">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream-300">{item.body}</p>
              </article>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* Ranges */}
      <Section id="ranges" className="scroll-mt-[var(--header-offset)]">
        <Container>
          <SectionHeading
            title="Premium ranges for your label"
            lede="Every product below can be made under your brand, in your pack size — from 10 g to 10 kg. Have something else in mind? We develop new formulations too."
          />
          <Reveal className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {RANGES.map((range) => (
              <article
                key={range.name}
                data-animate="fade-up"
                className="flex flex-col rounded-[1.5rem] border border-border-subtle bg-ink-800 p-7"
              >
                <h3 className="font-display text-[1.35rem] leading-tight text-cream-50">{range.name}</h3>
                <p className="mt-1.5 text-sm text-gold-400">{range.note}</p>
                {range.items.length ? (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {range.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-border-subtle bg-ink px-3 py-1.5 text-[0.8rem] text-cream-200"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-cream-400">Varieties on request — ask us for the list.</p>
                )}
              </article>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* Who it is for */}
      <Section tone="raised">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading title="Who we make for" lede="From a first product to a full store brand." />
            <Reveal as="ul" className="divide-y divide-border-subtle border-y border-border-subtle" stagger={0.05}>
              {PARTNERS.map((item) => (
                <li key={item.title} data-animate="fade-up" className="grid gap-1.5 py-6 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <h3 className="text-[1.05rem] text-cream-50">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-cream-400">{item.body}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Journey */}
      <Section>
        <Container>
          <SectionHeading title="From idea to shelf" />
          <Reveal as="ol" className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
            {JOURNEY.map((step, index) => (
              <li key={step.title} data-animate="fade-up" className="border-t border-gold-500/50 pt-6">
                <span className="font-display text-[1.6rem] leading-none text-gold-400">{index + 1}</span>
                <h3 className="mt-4 text-[1.05rem] text-cream-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-400">{step.body}</p>
              </li>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* Enquiry */}
      <Section tone="forest">
        <Container>
          <div className="mx-auto max-w-[56ch] text-center">
            <h2 className="text-title text-cream-50">Let&rsquo;s make it together</h2>
            <p className="mt-5 leading-relaxed text-cream-300">
              Tell us the product, the rough quantity and your timeline. We will reply with samples, minimums and pricing.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href={whatsapp}>WhatsApp {SITE.phone}</LinkButton>
              <LinkButton href={mailto} variant="secondary">Email {SITE.email}</LinkButton>
            </div>
            <p className="mt-4 text-sm text-cream-400">{SITE.phoneHours}</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
