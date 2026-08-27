import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Rating } from "@/components/ui/Rating";
import { formatDate } from "@/lib/utils";

export type ProofItem = {
  id: string;
  authorName: string;
  location?: string | null;
  rating: number;
  body: string;
  isVerified?: boolean;
  createdAt?: Date | null;
  product?: { name: string; slug: string } | null;
};

/**
 * Social proof, drawn entirely from real submissions. Nothing is seeded or
 * synthesised — if there are no approved reviews and no testimonials, the
 * section renders an honest invitation instead of filler.
 */
export function SocialProof({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string | null;
  items: ProofItem[];
}) {
  return (
    <Section id="reviews" tone="default" spacing="default" className="grain">
      <Container>
        <SectionHeading
          index="08"
          eyebrow="In their words"
          title={title}
          lede={subtitle ?? undefined}
        />

        {items.length === 0 ? (
          <div className="mt-14 max-w-[52ch] border-l border-gold-500/40 pl-6">
            <p className="leading-relaxed text-cream-300/80">
              We are rebuilding this section around verified reviews only. If you have
              bought from us before, your review will appear here once it is approved.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block text-[0.72rem] uppercase tracking-[0.16em] text-gold-300 underline underline-offset-4"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <Reveal
            className="mt-16 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
            stagger={0.09}
          >
            {items.map((item) => (
              <figure
                key={item.id}
                data-animate="fade-up"
                className="flex h-full flex-col border-t border-white/12 pt-6"
              >
                <Rating value={item.rating} count={1} showCount={false} size="sm" />

                <blockquote
                  className="mt-5 flex-1 text-[1.05rem] leading-relaxed text-cream-100"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  “{item.body}”
                </blockquote>

                <figcaption className="mt-6 text-sm text-cream-400">
                  <span className="text-cream-200">{item.authorName}</span>
                  {item.location ? <span> · {item.location}</span> : null}
                  {item.isVerified ? (
                    <span className="ml-2 border border-emerald-400/30 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-leaf-300">
                      Verified
                    </span>
                  ) : null}

                  {item.product ? (
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="mt-2 block text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
                    >
                      on {item.product.name}
                    </Link>
                  ) : null}

                  {item.createdAt ? (
                    <span className="mt-1 block text-xs text-cream-400/70">
                      {formatDate(item.createdAt, { day: undefined })}
                    </span>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
