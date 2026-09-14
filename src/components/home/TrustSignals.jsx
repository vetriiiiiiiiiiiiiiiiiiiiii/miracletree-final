import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Floating } from "@/components/motion/Floating";
/**
 * Scientific and institutional figures the company records as having come to
 * Milakaranai or met the team, with the affiliation it supplied for each.
 */
const VISITORS = [
  {
    name: "Dr Anandharamakrishnan",
    role: "Director, IICPT and CSIR — food technology, R&D and innovation",
  },
  { name: "Dr Alagusundaram", role: "Chairman, TNAPEX, with Dr Singaravelan" },
  { name: "Dr Natrajan IAS", role: "Agriculture, Chennai" },
  { name: "Mr Anand", role: "Chief General Manager, NABARD" },
  { name: "EDII Periyakulam", role: "Horticulture Dean, with PhD scholar" },
  { name: "Ms Sobana", role: "Chairman, TVS" },
];
export function TrustSignals({ accolades }) {
  // Certificates first: they carry numbers and expiry dates, which is the
  // strongest kind of claim on the page.
  const certified = accolades.filter((a) =>
    /NPOP|FSSAI|ISO|Manufacturing|HACCP/i.test(a.title),
  );
  const recognised = accolades.filter((a) => !certified.includes(a)).slice(0, 4);
  if (!certified.length && !recognised.length) return null;
  return (
    <Section id="trust" tone="raised" spacing="default">
      <Container>
        <SectionHeading
          title="What we can prove"
          lede="Licence numbers, issuing bodies and dates — not adjectives. Every certificate below can be checked with the authority that granted it."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-cream-400">
              Certification
            </h3>
            <ul className="mt-5 grid gap-px border border-border-subtle bg-border-subtle">
              {certified.map((a) => (
                <li
                  key={a.title}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-ink-800 px-5 py-4"
                >
                  <span className="text-[0.95rem] text-cream-100">{a.title}</span>
                  <span className="text-[0.78rem] text-cream-400">
                    {[a.issuer, a.year].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>

            {recognised.length ? (
              <>
                <h3 className="mt-10 text-[0.7rem] uppercase tracking-[0.2em] text-cream-400">
                  Recognition
                </h3>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {recognised.map((a) => (
                    <li key={a.title} className="border-l-2 border-gold-400/60 pl-4">
                      <p className="text-[0.95rem] leading-snug text-cream-100">
                        {a.title}
                      </p>
                      {a.issuer ? (
                        <p className="mt-1 text-[0.78rem] text-cream-400">{a.issuer}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <Floating>
            <div className="border border-border-subtle bg-ink-800/60 p-7">
              <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-cream-400">
                Who has visited
              </h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-cream-300">
                Agricultural bodies, research institutes and food-technology scientists
                who have been to the Milakaranai site or met the team.
              </p>

              <ul className="mt-6 grid gap-4">
                {VISITORS.map((v) => (
                  <li key={v.name} className="border-t border-border-subtle pt-3.5">
                    <p className="text-[0.92rem] text-cream-100">{v.name}</p>
                    <p className="mt-0.5 text-[0.78rem] leading-snug text-cream-400">
                      {v.role}
                    </p>
                  </li>
                ))}
              </ul>

              <Link
                href="/gallery#visitors"
                className="mt-6 inline-flex min-h-[1.5rem] items-center text-[0.74rem] uppercase tracking-[0.16em] text-cream-200 underline-offset-4 hover:text-cream-50 hover:underline"
              >
                See the photographs
              </Link>
            </div>
          </Floating>
        </div>
      </Container>
    </Section>
  );
}
