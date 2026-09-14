import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Floating } from "@/components/motion/Floating";
import { Reveal } from "@/components/motion/Reveal";
import { COUNTRIES_REACHED, MARKETS, PROJECTS } from "@/lib/export-markets";

/**
 * The export record, given room.
 *
 * "14+ countries" as a single figure in the hero is a statistic; the countries
 * themselves are the thing worth reading, and there are nine on record by
 * name. They are set at display size rather than as a list of tags, because a
 * buyer in Madurai shipping to Canada and Germany is the claim, and a row of
 * small grey chips does not make it.
 *
 * Saudi Arabia and Oman appear twice on purpose — once as destinations, once
 * as projects — because they are two different facts. Product ships to nine
 * countries; in two of them the company built the operation.
 */
export function ExportReach() {
  return (
    <Section id="reach" tone="default" spacing="default" className="grain">
      <Container>
        <SectionHeading
          title="From Madurai to fourteen countries"
          lede="Moringa grown, dried and milled in one district in Tamil Nadu, shipped to nine countries on record by name — and in two of them, built from the ground up."
        />

        <ul className="mt-14 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {MARKETS.map((market, i) => (
            <li
              key={market.country}
              className="flex items-baseline gap-4 border-b border-border-subtle pb-4"
            >
              <span className="font-display text-[0.85rem] tabular-nums text-gold-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-[clamp(1.15rem,2vw,1.6rem)] leading-tight text-cream-50">
                {market.country}
              </span>
            </li>
          ))}
        </ul>

        {/* The count is larger than the list, and says so rather than being
            quietly padded out to match. */}
        <p className="mt-6 text-[0.85rem] text-cream-400">
          {COUNTRIES_REACHED} countries reached in total; these nine are the ones
          recorded by name.
        </p>

        <div className="mt-16 grid gap-4 lg:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <Floating key={project.country} amount={i === 1 ? 2 : 0}>
              <article className="panel-lit h-full border border-border-subtle bg-ink-800/60 p-7 xl:p-9">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-gold-400">
                    {project.partner}
                  </p>
                  <p className="flex items-center gap-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-cream-400">
                    <span
                      aria-hidden
                      className={
                        project.status === "In progress"
                          ? "block h-1.5 w-1.5 rounded-full bg-emerald-400"
                          : "block h-1.5 w-1.5 rounded-full bg-cream-400/50"
                      }
                    />
                    {project.status} · {project.years}
                  </p>
                </div>

                <h3 className="mt-4 font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-cream-50">
                  {project.country}
                </h3>

                <p className="mt-4 max-w-[46ch] leading-relaxed text-cream-300">
                  {project.body}
                </p>
              </article>
            </Floating>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-[0.8rem] text-cream-400">
            Source: MiracleTree company records.
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
