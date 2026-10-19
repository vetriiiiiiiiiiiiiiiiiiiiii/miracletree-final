import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { cn, whatsappLink } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/layout/Section";
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

/** Line icons for the gold medallions, keyed by range and strength. */
const ICONS = {
  bowl: "M4 11h16a8 8 0 0 1-16 0zM8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3",
  cup: "M5 8h11v6a5 5 0 0 1-10 0V8zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4c0 1 1 1.5 1 2.5M12 4c0 1 1 1.5 1 2.5",
  bar: "M3 9l12-5 6 3-12 5zM3 9v6l6 3 12-5V7M9 12v6",
  fruit: "M12 7c-4-2-8 1-7 6 1 4 4 7 7 6 3 1 6-2 7-6 1-5-3-8-7-6zM12 7c0-2 1-3 3-4",
  leaf: "M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l9-9",
  spice: "M7 21h10M9 21l-2-9h10l-2 9M12 12V8M10 5c1 1 3 1 4 0",
  grain: "M12 21V9M12 9c-3 0-4-3-4-5 2 0 4 1 4 5zM12 9c3 0 4-3 4-5-2 0-4 1-4 5zM12 14c-3 0-4-3-4-5 2 0 4 1 4 5zM12 14c3 0 4-3 4-5-2 0-4 1-4 5z",
  crisp: "M4 14c3-6 13-6 16 0-3 3-13 3-16 0zM8 12l1 2M12 11v3M16 12l-1 2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  plate: "M3 13h18M5 13a7 7 0 0 0 14 0M12 6v2M9 9h6",
  gourd: "M12 4c0 2 2 3 2 5 3 1 4 4 4 6a6 6 0 0 1-12 0c0-2 1-5 4-6 0-2 2-3 2-5z",
  box: "M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9",
  scale: "M12 3v18M5 21h14M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0zM6 7h12",
  truck: "M2 6h12v10H2zM14 10h4l3 3v3h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};
const RANGE_ICONS = ["bowl", "cup", "bar", "fruit", "leaf", "spice", "grain", "crisp", "clock", "plate", "gourd", "box"];
const DIFFERENCE_ICONS = ["sun", "flask", "scale", "truck"];

function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d={ICONS[name] ?? ICONS.leaf} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A gold-ringed medallion holding a line icon. */
function Medallion({ icon, dark }) {
  return (
    <span className="inline-block shrink-0 rounded-full bg-gradient-to-br from-[#f1dca0] via-[#b98a3a] to-[#f4e3b0] p-[2px] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]">
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          dark ? "bg-[#12301f] text-[#e7cf86]" : "bg-[#fffaf0] text-[#8a6d2c] dark:bg-ink dark:text-gold-300",
        )}
      >
        <Icon name={icon} className="size-6" />
      </span>
    </span>
  );
}

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
              Every product below can be made under your brand, in your pack size — from 10 g to 10 kg.
              Have something else in mind? We develop new formulations too.
            </p>
          </div>
          <Reveal className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
            {RANGES.map((range, index) => {
              // A checkerboard on three columns; alternating on two.
              const dark = index % 2 === 1;
              return (
                <article
                  key={range.name}
                  data-animate="fade-up"
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-[1.75rem] p-7 shadow-[0_24px_60px_-36px_rgba(40,30,10,0.55)] transition-transform duration-500 ease-[var(--ease-organic)] hover:-translate-y-1 md:p-8",
                    dark ? cn(FOREST, FOREST_GLOW) : "bg-[#f6efe2] dark:bg-ink-800",
                  )}
                >
                  <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[1.4rem] border border-[#c8a24a]/35" />
                  <div className="relative flex items-start justify-between gap-4">
                    <Medallion icon={RANGE_ICONS[index]} dark={dark} />
                    <span className={cn(SERIF, "text-[2.2rem] leading-none", dark ? "text-[#c8a24a]/45" : "text-[#c8a24a]/60")}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className={cn(SERIF, "relative mt-5 text-[1.45rem] font-medium leading-tight")}>{range.name}</h3>
                  <p className={cn("relative mt-1.5 text-sm italic", dark ? "text-[#d9bc6a]" : "text-[#8a6d2c] dark:text-gold-300")}>
                    {range.note}
                  </p>
                  <span aria-hidden className={cn("relative mt-5 h-px w-12", dark ? "bg-[#c8a24a]/60" : "bg-[#c8a24a]")} />
                  {range.items.length ? (
                    <ul className="relative mt-5 flex flex-wrap gap-2">
                      {range.items.map((item) => (
                        <li
                          key={item}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[0.8rem]",
                            dark
                              ? "border border-[#c8a24a]/35 bg-white/[0.04] text-[#f3ead6]"
                              : "border border-[#e3d3a8] bg-white/80 text-[#173f29] dark:border-border-subtle dark:bg-ink dark:text-cream-200",
                          )}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={cn("relative mt-5 text-sm", dark ? "text-[#f3ead6]/70" : "text-[#3d4a40] dark:text-cream-400")}>
                      Varieties on request — ask us for the list.
                    </p>
                  )}
                </article>
              );
            })}
          </Reveal>
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
