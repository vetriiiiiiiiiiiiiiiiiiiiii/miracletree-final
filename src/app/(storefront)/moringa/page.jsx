import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TreeGrowth } from "@/components/home/TreeGrowth";
import { ProcessSection } from "@/components/home/ProcessSection";
import { IngredientExplorer } from "@/components/home/IngredientExplorer";
import { FaqSection } from "@/components/home/FaqSection";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBestSellers, getFaqs, getIngredients } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, faqSchema } from "@/lib/seo";
/**
 * The parts of the moringa tree, in the order the section's own lede names
 * them: leaf, seed, flower, gum and pod.
 */
const MORINGA_PARTS = [
  "moringa-leaf",
  "moringa-seed",
  "moringa-flower",
  "moringa-gum",
  "drumstick-pod",
];

export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Discover moringa",
  description:
    "What Moringa oleifera actually is, which parts are used, how it is grown around Madurai, and why drying temperature decides the quality.",
  path: "/moringa",
});
export default async function MoringaPage() {
  const [ingredients, faqs, products] = await Promise.all([
    getIngredients(),
    getFaqs("moringa"),
    getBestSellers(4),
  ]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Discover moringa", path: "/moringa" },
  ];
  return (
    <>
      <JsonLd id="moringa-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {faqs.length ? <JsonLd id="moringa-faq" data={faqSchema(faqs)} /> : null}

      {/* Intro */}
      <div className="grain bg-ink pb-20 pt-12 md:pt-16">
        <Container>
          <Breadcrumbs items={crumbs} />

          <header className="mt-8 max-w-4xl">
            <p className="eyebrow mb-6 text-gold-400">Moringa oleifera</p>
            <h1
              className="text-hero text-cream-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              The drumstick tree.
            </h1>
            <p className="mt-8 max-w-[56ch] text-[1.15rem] leading-relaxed text-cream-300">
              Known affectionately in Tamil Nadu as{" "}
              <em className="text-leaf-200">murungai</em>, Our Moringa is cultivated in
              meticulously enriched earth along the beautiful foothills of the Western
              Ghats and Sirumalai. A true testament to natural resilience, it thrives
              even with very little water easily surviving a failed monsoon and reaches a
              harvestable height in under a year. A miracle of nature, almost every part
              of this incredible tree is wonderfully edible.
            </p>
          </header>

          <Reveal
            className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.09}
          >
            {[
              { term: "Botanical name", detail: "Moringa oleifera" },
              { term: "Family", detail: "Moringaceae" },
              { term: "Tamil", detail: "Murungai (முருங்கை)" },
              { term: "Grown here", detail: "Madurai, Tamil Nadu" },
            ].map((item) => (
              <div
                key={item.term}
                data-animate="fade-up"
                className="border-t border-border-subtle pt-5"
              >
                <dt className="eyebrow text-cream-400">{item.term}</dt>
                <dd className="mt-3 text-[1.15rem] text-cream-50">{item.detail}</dd>
              </div>
            ))}
          </Reveal>
        </Container>
      </div>

      {/* The tree, grown by scrolling */}
      <TreeGrowth
        title="A full season, in one scroll."
        subtitle="Seed to harvest, the way the tree actually does it: fast, untidy, and useful at every stage."
      />

      {/* Parts of the tree.

          The five the heading names, in the order it names them. The explorer
          used to list every ingredient in the catalogue alphabetically, which
          put amla first — an Indian gooseberry heading a section about the
          parts of a moringa tree — and sprouted millets last, making seven
          entries under a heading that promises five. Both are real ingredients
          in real products and stay in the database; they are simply not parts
          of this tree. */}
      <IngredientExplorer
        title="Five parts, five products"
        subtitle="Leaf, seed, flower, gum and pod. Each is handled differently and ends up somewhere different in the range."
        ingredients={MORINGA_PARTS.map((slug) =>
          ingredients.find((i) => i.slug === slug),
        )
          .filter(Boolean)
          .map((i) => ({
            id: i.id,
            name: i.name,
            slug: i.slug,
            description: i.description,
            origin: i.origin,
            productCount: i._count.products,
          }))}
      />

      {/* How it's processed */}
      <ProcessSection
        title="Where quality is actually decided"
        subtitle="Seven steps between the field and your kitchen. One of them matters more than the rest."
      />

      {/* Why MiracleTree. Replaces the buyer's guide that stood here — the
          company supplied this copy and it is used verbatim, including its
          capitalisation and its arrows. */}
      <Section tone="default" spacing="default" className="grain">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <SectionHeading
              title="WHY MIRACLETREE?"
              lede="Anyone can sell you a green powder. Very few can show you the farm, the drying chamber and the years of hard-work standing behind it. Here is what lies between our leaf and your pack."
            />

            <ol className="grid gap-0">
              {[
                {
                  title: "DRYING THAT PROTECTS THE LEAF, NOT JUST PRESERVES IT",
                  body: "Fresh Moringa leaves are highly perishable, and inappropriate drying can adversely affect colour, sensory quality and nutritional characteristics. That is why, in 2014, we moved away from uncontrolled conventional drying and introduced ULTCD — Ultra Low Temperature Closed Chamber Drying: low temperature, controlled environment, hygienic closed-chamber processing — then advanced it again in 2019 with CLHPD — Controlled Low Heat Process Drying.",
                },
                {
                  title: "ONE CHAIN, CONTROLLED END TO END",
                  body: "Cultivation → Harvesting → Primary Processing → Drying → Milling → Formulation → Product Development → Packaging → Quality Systems. International quality cannot be created only inside a factory; it requires control across the chain — seed & cultivation, harvesting, hygiene, drying, processing, quality assurance, formulation, packaging, traceability. We control all of it.",
                },
                {
                  title: "THE WHOLE TREE, NOT JUST THE LEAF",
                  body: "“Don’t grow Moringa merely to harvest it. Create value from the tree.” Leaves, flowers, seeds and cold-pressed seed oil — powders, foods, beverages, supplements and skin-food personal care. That whole-tree philosophy now stands behind more than 60 Moringa formulations, from MOGO® and MOVITA® to Beauty Drops.",
                },
                {
                  title: "FIFTEEN YEARS OF PROOF, FROM THE FARM UP",
                  body: "Since 2009: four cultivation models, including high-density systems of up to 3,800 plants per acre; farming knowledge transferred to growers through SOPs; and products reaching more than 14 countries. Global Moringa competitiveness begins at the farm — and the farm is where we began.",
                },
              ].map((item, index) => (
                <li
                  key={item.title}
                  className="grid grid-cols-[3rem_1fr] gap-5 border-t border-border-subtle py-8 first:border-t-0 first:pt-0"
                >
                  <span className="text-[0.66rem] tabular-nums tracking-[0.16em] text-gold-400">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-[1.05rem] leading-snug tracking-[0.04em] text-cream-50">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-[54ch] leading-relaxed text-cream-400">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-14 text-[0.78rem] uppercase tracking-[0.2em] text-gold-400">
            From tree to technology. From farm to global nutrition.
          </p>
        </Container>
      </Section>

      {/* Compliance, stated plainly */}
      <Section tone="raised" spacing="tight" className="grain">
        <Container size="narrow">
          <h2 className="text-title text-cream-50">What we are not saying</h2>
          <p className="mt-5 leading-relaxed text-cream-300">
            You will find a great deal written online about what moringa does to the
            human body. We do not repeat it. These are food products, not medicines, and
            nothing here is intended to diagnose, treat, cure or prevent any disease.
          </p>
          <p className="mt-4 leading-relaxed text-cream-400">
            What we can tell you is how the plant grows, which part of it is in each
            pack, where it was grown, and how it was dried. If you are pregnant,
            nursing, taking prescribed medication or managing a health condition, speak
            to a qualified medical practitioner before adding any supplement to your
            diet.
          </p>
        </Container>
      </Section>

      {/* FAQ */}
      {faqs.length ? (
        <FaqSection
          title="About the plant"
          faqs={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
        />
      ) : null}

      {/* Products */}
      {products.length ? (
        <Section tone="default" spacing="default" className="grain">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                title="From the tree to your kitchen"
                className="max-w-xl"
              />
              <LinkButton href="/shop" variant="secondary" magnetic>
                View all products
              </LinkButton>
            </div>

            <ProductGrid
              products={products}
              listName="Moringa page"
              columns={4}
              className="mt-14"
            />

            <p className="mt-12 text-sm text-cream-400">
              Not sure which to start with?{" "}
              <Link
                href="/faq"
                className="underline underline-offset-4 hover:text-cream-100"
              >
                Read the FAQ
              </Link>{" "}
              or{" "}
              <Link
                href="/contact"
                className="underline underline-offset-4 hover:text-cream-100"
              >
                ask us
              </Link>
              .
            </p>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
