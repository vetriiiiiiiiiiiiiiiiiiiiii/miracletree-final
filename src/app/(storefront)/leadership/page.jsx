import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";
import { breadcrumbSchema, buildMetadata, siteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
/**
 * The international projects, from the company's history document.
 *
 * Given their own section rather than folded into the founder's highlight
 * grid: they are the largest thing the company has done, and a distributor or
 * partner reading this page is weighing exactly this kind of evidence.
 */
const INTERNATIONAL = [
  {
    years: "2021 – 2023",
    place: "Saudi Arabia",
    partner: "NADEC — National Agricultural Development Company",
    body: "Moringa cultivation and value-addition methods transferred to NADEC, one of the region's largest agricultural companies, for use in arid conditions at scale.",
    figures: [
      { label: "Role", value: "Knowledge partner" },
      { label: "Scope", value: "Cultivation & value addition" },
    ],
  },
  {
    years: "2025 – 2026",
    place: "Thumrait, Oman",
    partner: "Integrated moringa farming and processing campus, Dhofar",
    body: "Technology partner for the whole development: cultivation planning, nursery systems, desert irrigation, farm SOPs, and a processing plant sized to the farm's output.",
    figures: [
      { label: "Phase one", value: "580 acres" },
      { label: "Trees planned", value: "~1.7 million" },
      { label: "Leaf processing", value: "44 t/day" },
      { label: "Cold storage", value: "2,000 t" },
    ],
  },
];
/**
 * Named from the captions the company supplied with its photographs. Titles
 * only — the photographs themselves, and the names attached to them, are on
 * /gallery where they can be checked against the picture.
 */
const VISITORS = [
  "Former Agriculture Minister, Rajasthan",
  "NABARD, Chief General Manager",
  "Dr Natrajan IAS, Agriculture, Chennai",
  "Dr Alagusundaram, Chairman, TNAPEX",
  "Dr Anandharamakrishnan, Director, IICPT and CSIR",
  "EDII Periyakulam Horticulture Dean",
  "MABIF Chairman",
  "Rajasthan FPO Chairman",
  "TVS Chairman",
];
/** The four numbers that establish his standing, shown under his name. */
const FOUNDER_FIGURES = [
  { value: "15+", label: "Years on moringa" },
  { value: "2", label: "Drying technologies developed" },
  { value: "60+", label: "Products formulated" },
  { value: "2", label: "Countries advised" },
];
export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Leadership",
  description:
    "The people behind Miracletree Life Science: R. Saravanakumaran, the engineer-agriculturist behind the ULTCD and CLHPD drying technologies and the company's moringa projects in Saudi Arabia and Oman; co-founder Sujatha Rajendran; and the medical advisors to the range.",
  path: "/leadership",
});
/**
 * Leadership.
 *
 * Deliberately *not* built as the notebook that /about is. The story page is an
 * object that was kept; this is a record that can be checked — a fact sheet, a
 * dated list of achievements, and a citation on every claim. A buyer deciding
 * whether to trust a food brand, and a distributor deciding whether to carry
 * it, are both here for the same thing: evidence.
 *
 * The founder's profile is one long column rather than a grid of cards. His
 * record is the substance of the page, and breaking it into tiles would trade
 * the part that reads as a person for the part that reads as a brochure.
 *
 * Every row is DB-backed and editable in admin, because the person who knows
 * whether an award year is right is not the person who deploys.
 */
export default async function LeadershipPage() {
  const leaders = await prisma.leader.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    include: { highlights: { orderBy: { position: "asc" } } },
  });
  // Only the featured founder is shown. The company asked for the team grid to
  // come down: the profiles it carried are the ones the old site presented as
  // "trusted by doctors", a claim the business does not stand behind. The rows
  // stay in the database, so the page can be restored from the admin.
  const founder = leaders.find((l) => l.isFounder) ?? leaders[0];
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Leadership", path: "/leadership" },
  ];
  if (!founder) {
    return (
      <Section spacing="loose">
        <Container>
          <h1 className="text-display text-cream-50">Leadership</h1>
          <p className="mt-6 max-w-[52ch] text-cream-300">
            We are still writing these. The company history is on the story page in the
            meantime.
          </p>
          <LinkButton href="/about" className="mt-10">
            Our story
          </LinkButton>
        </Container>
      </Section>
    );
  }
  return (
    <>
      <JsonLd id="leadership-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {/* Person schema for the founder — this is the page search engines should
            associate with his name, not the company page. */}
      <JsonLd
        id="leadership-person"
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: founder.name,
          jobTitle: founder.role,
          description: founder.bio ?? undefined,
          url: siteUrl("/leadership"),
          worksFor: { "@type": "Organization", name: SITE.name, url: siteUrl("/") },
          award: founder.highlights
            .filter((h) => h.kind === "award")
            .map((h) => h.title),
        }}
      />

      {/* The founder opens the page rather than sitting below a generic
            introduction. He is why a distributor is on this page, and the
            portrait, the record and the biography read as one block instead of
            being split by a heading nobody needed. */}
      <Section spacing="none" className="pt-28 md:pt-36">
        <Container>
          <Breadcrumbs items={crumbs} />
        </Container>
      </Section>

      <Section spacing="default" id="founder">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <FounderPortrait name={founder.name} imageUrl={founder.imageUrl} />
            </Reveal>

            <div>
              <Reveal>
                <p className="eyebrow text-gold-400">{founder.role}</p>
                <h1 className="mt-5 text-display text-cream-50">{founder.name}</h1>
                {founder.credential ? (
                  <p className="mt-4 text-[1.1rem] text-cream-400">
                    {founder.credential}
                  </p>
                ) : null}
                {founder.bio ? (
                  <p className="mt-8 text-[1.15rem] leading-relaxed text-cream-200">
                    {founder.bio}
                  </p>
                ) : null}
              </Reveal>

              {/* The headline numbers, immediately under his name. */}
              <Reveal className="mt-12" stagger={0.06}>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-8 border-y border-border-subtle py-8 sm:grid-cols-4">
                  {FOUNDER_FIGURES.map((figure) => (
                    <div key={figure.label} data-animate="fade-up">
                      <dd className="font-display text-[1.9rem] leading-none text-cream-50">
                        {figure.value}
                      </dd>
                      <dt className="mt-2.5 text-[0.78rem] leading-snug text-cream-400">
                        {figure.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </Reveal>

              {founder.quote ? (
                <Reveal className="mt-12">
                  <blockquote className="border-l-2 border-gold-500 pl-6 font-display text-[1.45rem] leading-snug text-cream-50 md:text-[1.7rem]">
                    &ldquo;{founder.quote}&rdquo;
                  </blockquote>
                </Reveal>
              ) : null}

              {founder.longBio ? (
                <Reveal className="mt-12" stagger={0.08}>
                  {founder.longBio.split(/\n\s*\n/).map((para, i) => (
                    <p
                      key={i}
                      data-animate="fade-up"
                      className="mt-6 text-[1.05rem] leading-[1.8] text-cream-300 first:mt-0"
                    >
                      {para}
                    </p>
                  ))}
                </Reveal>
              ) : null}

              {founder.sourceUrl ? (
                <Citation
                  source={founder.source}
                  url={founder.sourceUrl}
                  className="mt-8"
                />
              ) : null}

              {founder.highlights.length ? (
                <div className="mt-20">
                  <Reveal>
                    <h2 className="eyebrow text-gold-400">Qualifications and awards</h2>
                  </Reveal>
                  <Reveal className="mt-8" stagger={0.06}>
                    <ul className="grid gap-px border border-border-subtle bg-border-subtle sm:grid-cols-2">
                      {founder.highlights.map((h) => (
                        <li key={h.id} data-animate="fade-up" className="bg-ink p-6">
                          <div className="flex items-center gap-3">
                            <HighlightIcon kind={h.kind} />
                            {h.year ? (
                              <span className="text-[0.7rem] tabular-nums tracking-[0.14em] text-gold-400">
                                {h.year}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-4 font-display text-[1.15rem] leading-snug text-cream-50">
                            {h.title}
                          </p>
                          {h.body ? (
                            <p className="mt-3 text-[0.92rem] leading-relaxed text-cream-400">
                              {h.body}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------- international scale */}
      <Section spacing="default" id="international">
        <Container>
          <Reveal>
            <SectionHeading
              title="International projects"
              lede="Since 2021 Miracletree has worked as a technology partner on moringa projects abroad, transferring its cultivation and processing methods."
            />
          </Reveal>

          <Reveal className="mt-16" stagger={0.1}>
            <div className="grid gap-px border border-border-subtle bg-border-subtle lg:grid-cols-2">
              {INTERNATIONAL.map((project) => (
                <article
                  key={project.place}
                  data-animate="fade-up"
                  className="bg-ink p-8 md:p-12"
                >
                  <p className="eyebrow text-gold-400">{project.years}</p>
                  <h3 className="mt-4 font-display text-[1.9rem] leading-tight text-cream-50">
                    {project.place}
                  </h3>
                  <p className="mt-2 text-cream-400">{project.partner}</p>
                  <p className="mt-6 leading-relaxed text-cream-300">{project.body}</p>

                  <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border-subtle pt-8">
                    {project.figures.map((figure) => (
                      <div key={figure.label}>
                        <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-cream-400">
                          {figure.label}
                        </dt>
                        <dd className="mt-2 font-display text-[1.5rem] leading-none text-cream-50">
                          {figure.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ------------------------------------------------- who has visited */}
      <Section tone="raised" spacing="default" id="standing">
        <Container>
          <Reveal>
            <SectionHeading
              title="Visitors to the farm and factory"
              lede="Agricultural bodies, research institutes and industry figures who have visited Madurai."
            />
          </Reveal>

          <Reveal className="mt-14" stagger={0.06}>
            <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {VISITORS.map((visitor) => (
                <li
                  key={visitor}
                  data-animate="fade-up"
                  className="flex gap-3 border-t border-border-subtle pt-4 text-[0.95rem] leading-relaxed text-cream-200"
                >
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-400"
                  />
                  {visitor}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14">
            <LinkButton href="/gallery#visitors" variant="secondary">
              See the photographs
            </LinkButton>
          </Reveal>
        </Container>
      </Section>


      <Section tone="raised" spacing="tight">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-title text-cream-50">Company history</h2>
            <p className="mt-4 max-w-[46ch] text-cream-300">
              The full timeline, our certifications and the field notes are on the story
              page.
            </p>
          </div>
          <LinkButton href="/about" variant="secondary">
            Read our story
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
/**
 * The portrait, or a monogram plate when there is no photograph yet.
 *
 * A named fallback rather than an empty box: the profile is the point of the
 * page, and a missing image should not make the page look broken while the
 * business is finding one to send.
 */
function FounderPortrait({ name, imageUrl }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  if (imageUrl) {
    return (
      <div className="relative aspect-4/5 w-full overflow-hidden bg-gradient-to-b from-photo-from to-photo-to">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(min-width: 1024px) 34vw, 100vw"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="relative grid aspect-4/5 w-full place-items-center border border-border-subtle bg-forest-900"
      role="img"
      aria-label={`${name} — portrait not yet supplied`}
    >
      <span className="font-display text-[4rem] text-emerald-400">{initials}</span>
      <span className="absolute bottom-5 left-0 right-0 text-center text-[0.65rem] uppercase tracking-[0.18em] text-cream-400">
        Photo to follow
      </span>
    </div>
  );
}
function HighlightIcon({ kind }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const paths = {
    award: (
      <>
        <circle cx="10" cy="7.5" r="4.5" />
        <path d="M7 11.5 6 18l4-2 4 2-1-6.5" />
      </>
    ),
    patent: (
      <>
        <path d="M4 3h8l4 4v10H4z" />
        <path d="M12 3v4h4" />
        <path d="M7 12h6M7 14.5h4" />
      </>
    ),
    role: (
      <>
        <circle cx="10" cy="6.5" r="3" />
        <path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      </>
    ),
    recognition: (
      <>
        <path d="M10 2.5 12.2 7l5 .7-3.6 3.5.9 5-4.5-2.4L5.5 16.2l.9-5L2.8 7.7 7.8 7z" />
      </>
    ),
  };
  return (
    <svg {...common} className="shrink-0 text-emerald-400">
      {paths[kind] ?? paths.recognition}
    </svg>
  );
}
/** Where a claim comes from. Shown, not hidden — that is the whole point. */
function Citation({ source, url, className }) {
  return (
    <p className={className}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-block py-1.5 text-[0.72rem] uppercase tracking-[0.14em] text-cream-400 underline decoration-gold-500 underline-offset-4 transition-colors hover:text-cream-100"
      >
        Source: {source ?? "published record"}
      </a>
    </p>
  );
}
