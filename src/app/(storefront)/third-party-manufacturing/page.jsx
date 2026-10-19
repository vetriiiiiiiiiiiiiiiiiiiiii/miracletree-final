import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { cn, whatsappLink } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { DIFFERENCE_ICONS, Medallion } from "@/components/services/ManufacturingIcons";
import { RangeShowcase } from "@/components/services/RangeShowcase";
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
 * Third-party / private-label manufacturing, in the house's luxury register:
 * deep forest and warm ivory grounds, gold hairlines and small-caps eyebrows,
 * serif headlines. The flow runs: what we do, why us, the ranges you can put
 * your name on, who it is for, how it runs, and the enquiry. Content lives in
 * src/lib/manufacturing.js.
 */
const SERIF = "font-[family-name:var(--font-serif)]";
const FOREST = "bg-[#0f2a1b] text-[#f3ead6]";
const FOREST_GLOW =
  "bg-[radial-gradient(80%_120%_at_85%_0%,rgba(200,162,74,0.20)_0%,transparent_55%),linear-gradient(160deg,#0f2a1b_0%,#173f29_100%)]";
const IVORY = "bg-[#f6efe2] text-[#173f29] dark:bg-ink-800 dark:text-cream-50";

/** Small-caps gold eyebrow between two hairlines. */
function Eyebrow({ children, center, className }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em]",
        center && "justify-center",
        className,
      )}
    >
      <span className="h-px w-8 bg-current opacity-60" aria-hidden />
      {children}
      {center ? <span className="h-px w-8 bg-current opacity-60" aria-hidden /> : null}
    </p>
  );
}

const GOLD_BUTTON =
  "!bg-[#c8a24a] !text-[#0f2a1b] hover:!bg-[#d9bc6a] shadow-[0_12px_30px_-14px_rgba(200,162,74,0.8)]";
const GOLD_OUTLINE = "!border !border-[#c8a24a] !text-[#e7cf86] hover:!bg-[#c8a24a] hover:!text-[#0f2a1b]";

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

      {/* Intro — forest ground, gold frame */}
      <section className={cn("relative overflow-hidden", FOREST, FOREST_GLOW)}>
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[2rem] border border-[#c8a24a]/30 md:inset-5" />
        <Container className="relative pb-14 pt-8 md:pb-20 md:pt-10">
          <div className="[&_a]:text-[#f3ead6]/70 [&_a:hover]:text-[#f3ead6] [&_li]:text-[#e7cf86]">
            <Breadcrumbs items={crumbs} />
          </div>
          <div className="mt-10 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <Reveal className="max-w-[62ch]">
              <Eyebrow className="text-[#d9bc6a]">Private label · Contract manufacturing</Eyebrow>
              <h1 className={cn(SERIF, "mt-6 text-[2.6rem] font-medium leading-[1.05] md:text-[4rem]")}>
                Your brand,
                <br />
                <em className="text-[#e7cf86]">made by us.</em>
              </h1>
              <p className="mt-7 text-[1.05rem] leading-relaxed text-[#f3ead6]/80">{MANUFACTURING_INTRO}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <LinkButton href={whatsapp} className={GOLD_BUTTON}>
                  Send an enquiry
                </LinkButton>
                <LinkButton href="#ranges" variant="secondary" className={GOLD_OUTLINE}>
                  See the ranges
                </LinkButton>
              </div>
            </Reveal>
            <Reveal stagger={0.06}>
              <dl className="grid grid-cols-2 gap-3">
                {FACILITY.map((item) => (
                  <div
                    key={item.label}
                    data-animate="fade-up"
                    className="rounded-2xl border border-[#c8a24a]/30 bg-white/[0.04] p-5 backdrop-blur-sm"
                  >
                    <dd className={cn(SERIF, "text-[1.6rem] leading-tight text-[#e7cf86]")}>{item.value}</dd>
                    <dt className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f3ead6]">
                      {item.label}
                    </dt>
                    <p className="mt-1 text-xs text-[#f3ead6]/60">{item.note}</p>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Why us — ivory ground, gold medallions */}
      <section className={cn(IVORY, "py-14 md:py-20")}>
        <Container>
          <div className="mx-auto max-w-[56ch] text-center">
            <Eyebrow center className="text-[#8a6d2c] dark:text-gold-300">The difference</Eyebrow>
            <h2 className={cn(SERIF, "mt-4 text-[2rem] font-medium leading-tight md:text-[2.6rem]")}>
              Why make it with MiracleTree
            </h2>
            <p className="mt-4 leading-relaxed text-[#3d4a40] dark:text-cream-300">
              We are food makers first — with our own drying technology, our own recipes and our own
              facility behind every product that carries your name.
            </p>
          </div>
          <Reveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
            {DIFFERENCE.map((item, index) => (
              <article
                key={item.title}
                data-animate="fade-up"
                className="relative rounded-[1.75rem] bg-white/70 p-7 shadow-[0_24px_50px_-36px_rgba(40,30,10,0.5)] dark:bg-ink"
              >
                <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[1.4rem] border border-[#c8a24a]/30" />
                <Medallion icon={DIFFERENCE_ICONS[index]} />
                <h3 className={cn(SERIF, "mt-5 text-[1.3rem] leading-snug")}>{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#3d4a40] dark:text-cream-300">{item.body}</p>
              </article>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Ranges — alternating forest and ivory cards */}
      <section
        id="ranges"
        className="scroll-mt-[var(--header-offset)] bg-[#fbf8f1] bg-[radial-gradient(60%_40%_at_50%_0%,rgba(200,162,74,0.12)_0%,transparent_70%)] py-14 text-[#173f29] md:py-20 dark:bg-ink dark:text-cream-50"
      >
        <Container>
          <div className="mx-auto max-w-[60ch] text-center">
            <Eyebrow center className="text-[#8a6d2c] dark:text-gold-300">Private label</Eyebrow>
            <h2 className={cn(SERIF, "mt-4 text-[2rem] font-medium leading-tight md:text-[2.6rem]")}>
              Premium ranges for your label
            </h2>
            <p className="mt-4 leading-relaxed text-[#3d4a40] dark:text-cream-300">
              Pick a range to see its products. Every one can be made under your brand, in your pack size — from 10 g to 10 kg.
              Have something else in mind? We develop new formulations too.
            </p>
          </div>
          <RangeShowcase ranges={RANGES} whatsapp={SITE.whatsapp} />
        </Container>
      </section>

      {/* Who it is for — forest ground */}
      <section className={cn(FOREST, FOREST_GLOW, "py-14 md:py-20")}>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Eyebrow className="text-[#d9bc6a]">Partners</Eyebrow>
              <h2 className={cn(SERIF, "mt-4 text-[2rem] font-medium leading-tight md:text-[2.6rem]")}>Who we make for</h2>
              <p className="mt-4 text-[#f3ead6]/75">From a first product to a full store brand.</p>
            </div>
            <Reveal as="ul" className="divide-y divide-[#c8a24a]/25 border-y border-[#c8a24a]/25" stagger={0.05}>
              {PARTNERS.map((item) => (
                <li key={item.title} data-animate="fade-up" className="grid gap-1.5 py-6 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <h3 className={cn(SERIF, "text-[1.2rem] text-[#e7cf86]")}>{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#f3ead6]/75">{item.body}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Journey — ivory ground, numbered gold rings */}
      <section className={cn(IVORY, "py-14 md:py-20")}>
        <Container>
          <div className="mx-auto max-w-[56ch] text-center">
            <Eyebrow center className="text-[#8a6d2c] dark:text-gold-300">How it works</Eyebrow>
            <h2 className={cn(SERIF, "mt-4 text-[2rem] font-medium leading-tight md:text-[2.6rem]")}>From idea to shelf</h2>
          </div>
          <Reveal as="ol" className="relative mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
            <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-transparent via-[#c8a24a]/70 to-transparent lg:block" />
            {JOURNEY.map((step, index) => (
              <li key={step.title} data-animate="fade-up" className="relative text-center">
                <span className="mx-auto inline-block rounded-full bg-gradient-to-br from-[#f1dca0] via-[#b98a3a] to-[#f4e3b0] p-[2px]">
                  <span className={cn(SERIF, "flex size-14 items-center justify-center rounded-full bg-[#0f2a1b] text-[1.4rem] text-[#e7cf86]")}>
                    {index + 1}
                  </span>
                </span>
                <h3 className={cn(SERIF, "mt-5 text-[1.25rem]")}>{step.title}</h3>
                <p className="mx-auto mt-2 max-w-[28ch] text-sm leading-relaxed text-[#3d4a40] dark:text-cream-300">{step.body}</p>
              </li>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Enquiry — forest ground, gold frame */}
      <section className={cn("relative overflow-hidden py-16 md:py-24", FOREST, FOREST_GLOW)}>
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[2rem] border border-[#c8a24a]/30 md:inset-5" />
        <Container className="relative">
          <div className="mx-auto max-w-[56ch] text-center">
            <Eyebrow center className="text-[#d9bc6a]">Enquiries</Eyebrow>
            <h2 className={cn(SERIF, "mt-4 text-[2.2rem] font-medium leading-tight md:text-[3rem]")}>
              Let&rsquo;s make it <em className="text-[#e7cf86]">together</em>
            </h2>
            <p className="mt-5 leading-relaxed text-[#f3ead6]/80">
              Tell us the product, the rough quantity and your timeline. We will reply with samples, minimums and pricing.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href={whatsapp} className={GOLD_BUTTON}>
                WhatsApp {SITE.phone}
              </LinkButton>
              <LinkButton href={mailto} variant="secondary" className={GOLD_OUTLINE}>
                Email {SITE.email}
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-[#f3ead6]/60">{SITE.phoneHours}</p>
          </div>
        </Container>
      </section>
    </>
  );
}
