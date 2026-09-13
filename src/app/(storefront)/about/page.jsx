import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getArticles } from "@/lib/queries";
import { SITE } from "@/lib/constants";
import { breadcrumbSchema, buildMetadata, siteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { BotanicalPlate, Underlined } from "@/components/story/Drawn";
import {
  Accolades,
  Credits,
  FieldNotes,
  Timeline,
} from "@/components/story/StorySections";
import { StoryFlightLazy } from "@/components/story/flight/StoryFlightLazy";
export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Our story",
  description:
    "Miracletree Life Science began in 2009 with Sujatha Rajendran's idea and a research farm near Madurai. The history, the certifications, the people, and the field notes.",
  path: "/about",
});
/**
 * Our Story, drawn as a field notebook.
 *
 * Three decisions worth stating:
 *
 *  1. **It is on paper.** Every other page on this site is near-black. A
 *     notebook is not, and the contrast is deliberate — this reads as an object
 *     that was kept rather than a page that was designed.
 *  2. **The journal lives here now.** Field notes were a separate section
 *     competing with the story for the same visitor; folded in, they are the
 *     evidence behind it. Article URLs are untouched.
 *  3. **Every claim is cited.** History, awards and certifications are
 *     researched from published sources and carry a link. On a food brand an
 *     unverifiable certification is a legal exposure, not a copy problem.
 */
export default async function AboutPage() {
  const [milestones, accolades, credits, notes] = await Promise.all([
    prisma.milestone.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    }),
    prisma.accolade.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    }),
    prisma.credit.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
    getArticles({ take: 3 }),
  ]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Our story", path: "/about" },
  ];
  return (
    <>
      <JsonLd id="about-breadcrumb" data={breadcrumbSchema(crumbs)} />
      <JsonLd
        id="about-org"
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": siteUrl("/#organization"),
          name: SITE.legalName,
          foundingDate: "2009",
          founders: credits
            .filter((c) => c.group === "team")
            .map((c) => ({ "@type": "Person", name: c.name, jobTitle: c.role })),
          award: accolades.filter((a) => a.kind === "award").map((a) => a.title),
        }}
      />

      <article className="paper">
        {/* ---------------------------------------------------------- cover */}
        <div className="paper-ruled relative overflow-hidden border-b border-[#c9c0a8]">
          <Container className="relative py-16 md:py-24">
            <Breadcrumbs items={crumbs} className="[&_*]:!text-[#6f6440]" />

            <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
              <div>
                <p className="margin-note mb-5 text-[1.35rem]">
                  Miracletree Life Science · Madurai
                </p>

                <h1 className="text-hero text-[#23301f]">
                  <Underlined>Our story</Underlined>
                </h1>

                <p className="mt-10 max-w-[46ch] text-[1.2rem] leading-relaxed text-[#3f4b39]">
                  Moringa grows in half the backyards in Tamil Nadu. Almost none of it
                  is dried properly. That gap is the company.
                </p>

                <p className="mt-5 max-w-[52ch] leading-relaxed text-[#55614e]">
                  A six-acre research farm kept since 2007, eighty-seven acres in
                  production near the Vempakottai dam, and around three hundred more
                  under contract across south Tamil Nadu. What follows is the history,
                  the certifications, the people, and the notes we have kept along the
                  way.
                </p>

                <nav
                  aria-label="Sections of this story"
                  className="mt-10 flex flex-wrap gap-x-6 gap-y-2"
                >
                  {[
                    ["#origin", "The beginning"],
                    ["#timeline", "Timeline"],
                    ["#recognition", "Awards"],
                    ["#field-notes", "Field notes"],
                    ["#credits", "Credits"],
                  ].map(([href, label]) => (
                    <a
                      key={href}
                      href={href}
                      className="inline-block py-1 text-[1.15rem] text-[#7a5c1f] underline decoration-[#c2a038]/50 underline-offset-4 hover:decoration-[#7a5c1f]"
                      style={{ fontFamily: "var(--font-hand)" }}
                    >
                      {label}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="mx-auto w-full max-w-xs lg:max-w-none">
                <BotanicalPlate
                  subject="leaf"
                  className="h-[22rem] w-full"
                  label="Moringa oleifera — compound leaf, opposite leaflets"
                />
              </div>
            </div>
          </Container>
        </div>

        {/* --------------------------------------------------------- origin */}
        <section id="origin" className="border-b border-[#c9c0a8]">
          <Container className="py-20 md:py-28">
            <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="margin-note mb-3">where it came from</p>
                <h2 className="text-title text-[#23301f]">
                  <Underlined tone="leaf">Two people, one tree</Underlined>
                </h2>

                <div className="mt-8 hidden lg:block">
                  <BotanicalPlate
                    subject="flower"
                    className="h-56 w-40"
                    label="blossom — also eaten"
                  />
                </div>
              </div>

              <div className="prose-paper max-w-[62ch]">
                <p>
                  In 2009 <strong>Sujatha Rajendran</strong> started turning moringa
                  into food instead of supplements, with nothing chemical added. The
                  product line was hers.
                </p>
                <p>
                  <strong>Saravanakumaran Rajendran</strong>, an engineer-agriculturist,
                  came in to build the processing side: drying, milling and handling the
                  leaf at a scale that could run every week without overheating it. He
                  holds patents in moringa processing and has advised on growing the
                  tree in arid conditions abroad.
                </p>
                <p>
                  There are three farms. The original six-acre research farm has been
                  run as sustainable organic ground since 2007 and is where the planting
                  trials were done. Production is eighty-seven acres near the
                  Vempakottai dam at Sattur. Beyond that, roughly three hundred and
                  twelve acres are farmed under contract across south Tamil Nadu. The
                  farm and its processes are certified organic under the Tamil Nadu
                  Organic Certification Programme.
                </p>
                <p>
                  More than forty farming families now grow for the company. Several
                  have moved from ₹30,000–40,000 a year to about ₹1 lakh within three
                  years of supplying us.
                </p>

                <p className="!mt-8 text-[0.7rem] uppercase tracking-[0.12em] !text-[#6f6440]">
                  Sourced from{" "}
                  <a
                    href="https://www.gotn.in/miracletree-marketing-the-moringa/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Government of Tamil Nadu
                  </a>{" "}
                  and the company&rsquo;s published trade profile.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ------------------------------------------------------- timeline */}
        {/* The history is flown through rather than scrolled past: each entry
            approaches out of the haze, holds, and passes overhead. The paper
            timeline below is not a duplicate for its own sake — it is what
            renders when the flight cannot (reduced motion, no WebGL), and it is
            what a printer and a screen reader get. */}
        <section id="flight" aria-hidden className="border-b border-[#c9c0a8]">
          <StoryFlightLazy milestones={milestones} />
        </section>

        <section className="border-b border-[#c9c0a8]">
          <Container className="py-20 md:py-28">
            <Timeline milestones={milestones} />
          </Container>
        </section>

        {/* ---------------------------------------------------- recognition */}
        <section className="border-b border-[#c9c0a8]">
          <Container className="py-20 md:py-28">
            <Accolades accolades={accolades} />
          </Container>
        </section>

        {/* ---------------------------------------------------- field notes */}
        <section className="border-b border-[#c9c0a8]">
          <Container className="py-20 md:py-28">
            <FieldNotes notes={notes} />
          </Container>
        </section>

        {/* -------------------------------------------------------- credits */}
        <section className="border-b border-[#c9c0a8]">
          <Container className="py-20 md:py-28">
            <Credits credits={credits} />
          </Container>
        </section>

        {/* --------------------------------------------------------- close */}
        <section className="paper-ruled">
          <Container className="py-20 text-center md:py-28">
            <BotanicalPlate subject="pod" className="mx-auto h-40 w-28" />

            <h2 className="mt-8 text-title text-[#23301f]">
              <Underlined tone="gold">From the tree to your kitchen</Underlined>
            </h2>

            <p className="mx-auto mt-8 max-w-[46ch] leading-relaxed text-[#55614e]">
              Twenty-seven products, all from the same plant. Leaf, pod, flower, seed
              and gum.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <LinkButton
                href="/shop"
                size="lg"
                magnetic
                className="!bg-[#2c4a2f] !text-[#f4f1e8] hover:!bg-[#23301f]"
              >
                Explore the collection
              </LinkButton>
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 text-[1.15rem] text-[#7a5c1f] underline decoration-[#c2a038]/50 underline-offset-4"
                style={{ fontFamily: "var(--font-hand)" }}
              >
                or write to us
              </Link>
            </div>
          </Container>
        </section>
      </article>
    </>
  );
}
