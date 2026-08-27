import Image from "next/image";
import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/utils";

export type JournalItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
};

export function JournalRail({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  articles,
}: {
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  articles: JournalItem[];
}) {
  if (!articles.length) return null;

  return (
    <Section id="journal" tone="default" spacing="default" className="grain">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            index="10"
            eyebrow="Journal"
            title={title}
            lede={subtitle ?? undefined}
            className="max-w-2xl"
          />
          {ctaLabel && ctaHref ? (
            <LinkButton href={ctaHref} variant="secondary" magnetic>
              {ctaLabel}
            </LinkButton>
          ) : null}
        </div>

        <Reveal className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3" stagger={0.1}>
          {articles.map((article) => (
            <article key={article.id} data-animate="fade-up" className="group">
              <Link href={`/journal/${article.slug}`} className="block">
                <div className="relative aspect-16/10 overflow-hidden bg-ink-800">
                  {article.heroImageUrl ? (
                    <Image
                      src={article.heroImageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 90vw, 30vw"
                      className="object-cover transition-transform duration-[900ms] ease-[var(--ease-organic)] group-hover:scale-105"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(120% 90% at 30% 20%, rgba(28,90,58,0.35) 0%, rgba(6,9,7,1) 70%)",
                      }}
                    />
                  )}
                </div>

                <div className="mt-5 flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.14em] text-cream-400">
                  {article.category ? <span className="text-gold-400/90">{article.category.name}</span> : null}
                  {article.category ? <span aria-hidden className="text-white/15">/</span> : null}
                  <span>{article.readingMinutes} min read</span>
                </div>

                <h3 className="mt-3 text-[1.2rem] leading-snug text-cream-50 transition-colors group-hover:text-gold-200">
                  {article.title}
                </h3>

                {article.excerpt ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream-400">
                    {article.excerpt}
                  </p>
                ) : null}

                {article.publishedAt ? (
                  <time
                    dateTime={article.publishedAt.toISOString()}
                    className="mt-4 block text-xs text-cream-400/70"
                  >
                    {formatDate(article.publishedAt)}
                  </time>
                ) : null}
              </Link>
            </article>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
