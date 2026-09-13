import Image from "next/image";
import { Container, Section } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

/**
 * The founder, on the homepage.
 *
 * A moringa shopper has a great many sellers to choose between and almost no
 * way to tell them apart. "The person who developed the drying process also
 * advises two governments on growing this crop" is the difference, and it was
 * previously buried two clicks away on /leadership.
 *
 * Kept to a quote, four numbers and a link. The full record is on its own page;
 * this is the hook, not the biography.
 */

const FIGURES = [
  { value: "2014 & 2019", label: "ULTCD and CLHPD drying, developed in-house" },
  { value: "2015", label: "World's first moringa-leaf energy bar" },
  { value: "1.7m", label: "Trees planned on the Oman project he leads" },
  { value: "2022–23", label: "Tamil Nadu Best Agriculturist" },
];

export function FounderBlock({
  name,
  role,
  quote,
  imageUrl,
}: {
  name: string;
  role: string;
  quote: string | null;
  imageUrl: string | null;
}) {
  return (
    <Section tone="forest" spacing="default" id="founder">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            {imageUrl ? (
              <div className="relative aspect-4/5 w-full overflow-hidden border border-border-subtle">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="grid aspect-4/5 w-full place-items-center border border-border-subtle bg-forest-800"
                role="img"
                aria-label={`${name} — portrait not yet supplied`}
              >
                <span className="font-display text-[3.5rem] text-emerald-400">
                  {name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
                </span>
              </div>
            )}
          </Reveal>

          <div>
            <Reveal>
              <p className="eyebrow text-gold-400">{role}</p>
              <h2 className="mt-5 text-display text-cream-50">{name}</h2>
              {quote ? (
                <blockquote className="mt-8 border-l-2 border-gold-500 pl-6 font-display text-[1.4rem] leading-snug text-cream-100 md:text-[1.6rem]">
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ) : null}
            </Reveal>

            <Reveal className="mt-12" stagger={0.06}>
              <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {FIGURES.map((figure) => (
                  <div key={figure.value} data-animate="fade-up">
                    <dd className="font-display text-[1.5rem] leading-none text-cream-50">
                      {figure.value}
                    </dd>
                    <dt className="mt-2.5 text-[0.88rem] leading-snug text-cream-300">
                      {figure.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal className="mt-12">
              <div className="flex flex-wrap gap-4">
                <LinkButton href="/leadership">His full record</LinkButton>
                <LinkButton href="/innovation" variant="secondary">
                  The innovations
                </LinkButton>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
