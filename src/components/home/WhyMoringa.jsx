import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { UnderlineLink } from "@/components/ui/Button";
/**
 * What makes the tree unusual, stated as horticulture and process rather than
 * as health claims. Everything here is verifiable about how the plant grows and
 * how the brand handles it — nothing about what it does to a body.
 */
const FACTS = [
  {
    figure: "< 12",
    unit: "months",
    title: "Seed to first harvest",
    body: "Moringa is tall enough to harvest within a year of sowing, so growers plant it along field edges and bunds.",
  },
  {
    figure: "5",
    unit: "usable parts",
    title: "Leaf, pod, flower, seed, gum",
    body: "Each part is processed differently and ends up in a different product. Very little of the tree is thrown away.",
  },
  {
    // Supplied as a figure, a unit and one paragraph, with no heading line —
    // so this card has none, rather than carrying a title written here.
    figure: "40+",
    unit: "grower families",
    title: null,
    body: "A network of over forty farming families around Madurai grows with the company, and the planting trials and SOPs were shared with them, not kept.",
  },
];
export function WhyMoringa({ title, subtitle }) {
  return (
    <Section id="why-moringa" tone="default" spacing="default" className="grain">
      <Container>
        <SectionHeading title={title} lede={subtitle ?? undefined} />

        <Reveal
          className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.1}
        >
          {FACTS.map((fact) => (
            <article
              key={fact.figure}
              data-animate="fade-up"
              className="border-t border-border-subtle pt-6"
            >
              <p className="flex items-baseline gap-2">
                <span
                  className="text-[2.75rem] leading-none text-cream-50"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {fact.figure}
                </span>
                <span className="text-[0.7rem] uppercase tracking-[0.14em] text-gold-400">
                  {fact.unit}
                </span>
              </p>
              {fact.title ? (
                <h3 className="mt-5 text-[1.05rem] leading-snug text-cream-100">
                  {fact.title}
                </h3>
              ) : null}
              <p
                className={`text-sm leading-relaxed text-cream-400 ${fact.title ? "mt-3" : "mt-5"}`}
              >
                {fact.body}
              </p>
            </article>
          ))}
        </Reveal>

        <p className="mt-14 max-w-[58ch] text-sm leading-relaxed text-cream-400">
          We describe how the plant is grown and handled, not what it will do for you.
          Moringa is a food, and our products are foods — if you are pregnant, nursing,
          on prescribed medication or managing a condition, talk to your doctor before
          adding any supplement.{" "}
          <UnderlineLink href="/moringa" className="text-cream-200">
            More about the plant
          </UnderlineLink>
        </p>
      </Container>
    </Section>
  );
}
