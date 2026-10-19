import Image from "next/image";
import Link from "next/link";
import { getReviewsOverview } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { formatDate, cn } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Stars } from "@/components/reviews/Stars";
import { StoreReviewPrompt } from "@/components/reviews/StoreReviewPrompt";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Customer Reviews",
  description:
    "What customers say about MiracleTree moringa — the overall rating, every product's rating, and every approved review.",
  path: "/reviews",
});
/**
 * Every review in one place: the store-wide rating with its star breakdown,
 * a rating card for each product (unreviewed ones invite the first review),
 * and the approved reviews themselves, filterable by product with ?product=.
 */
export default async function ReviewsPage({ searchParams }) {
  const { product: filter } = await searchParams;
  const { average, total, breakdown, products, reviews, storeCount, storeAverage } = await getReviewsOverview();
  const shown =
    filter === "store"
      ? reviews.filter((r) => !r.product)
      : filter
        ? reviews.filter((r) => r.product?.slug === filter)
        : reviews;
  const filtered =
    filter === "store"
      ? { name: "MiracleTree as a whole" }
      : filter
        ? products.find((p) => p.slug === filter)
        : null;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Reviews", path: "/reviews" },
  ];
  return (
    <>
      <JsonLd id="reviews-breadcrumb" data={breadcrumbSchema(crumbs)} />

      {/* Overall */}
      <Section spacing="none" className="pt-6 md:pt-8">
        <Container>
          <Breadcrumbs items={crumbs} />
          <div className="mt-10 grid gap-10 pb-12 md:pb-16 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow text-gold-400">Customer reviews</p>
              <h1 className="mt-5 text-display text-cream-50">What our customers say</h1>
              <p className="mt-6 max-w-[52ch] leading-relaxed text-cream-300">
                Every review here was written by a customer and approved by us — none are invented.
                Review MiracleTree as a whole here, or any product below.
              </p>
              <div className="mt-8">
                <StoreReviewPrompt />
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-border-subtle bg-ink-800 p-7 md:p-9">
              {average ? (
                <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
                  <div>
                    <p className="font-display text-[3.6rem] leading-none text-cream-50">{average.toFixed(1)}</p>
                    <Stars value={average} size={20} className="mt-3" />
                    <p className="mt-2 text-sm text-cream-400">
                      {total} review{total === 1 ? "" : "s"} · overall
                    </p>
                  </div>
                  <ul className="min-w-[12rem] flex-1 space-y-2">
                    {breakdown.map(({ stars, count }) => (
                      <li key={stars} className="flex items-center gap-3 text-sm text-cream-300">
                        <span className="w-6 tabular-nums">{stars}★</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-600/40">
                          <span
                            className="block h-full rounded-full bg-[#f5a623]"
                            style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                          />
                        </span>
                        <span className="w-8 text-right tabular-nums text-cream-400">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-cream-300">No reviews yet — be the first to review a product.</p>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Per product */}
      <Section tone="raised">
        <Container>
          <SectionHeading title="Reviews by product" lede="Every product we sell, with its own rating." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {storeCount ? (
              <li>
                <div
                  className={cn(
                    "flex h-full gap-4 rounded-2xl border bg-ink p-4",
                    filter === "store" ? "border-emerald-500" : "border-border-subtle",
                  )}
                >
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                    <Image src="/brand/miracletree-mark.webp" alt="" fill sizes="64px" className="object-contain p-2" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.92rem] font-medium leading-snug text-cream-50">MiracleTree — overall</p>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-cream-300">
                      <Stars value={storeAverage} size={14} />
                      {storeAverage.toFixed(1)}
                    </p>
                    <Link
                      href={filter === "store" ? "/reviews#all" : "/reviews?product=store#all"}
                      scroll={false}
                      className="mt-1 inline-block text-xs font-semibold text-emerald-500 underline underline-offset-4"
                    >
                      {filter === "store" ? "Show all reviews" : `Read ${storeCount} review${storeCount === 1 ? "" : "s"}`}
                    </Link>
                  </div>
                </div>
              </li>
            ) : null}
            {products.map((product) => {
              const image = product.images?.[0];
              const active = product.slug === filter;
              return (
                <li key={product.id}>
                  <div
                    className={cn(
                      "flex h-full gap-4 rounded-2xl border bg-ink p-4 transition-colors",
                      active ? "border-emerald-500" : "border-border-subtle",
                    )}
                  >
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={image.alt ?? product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized={image.url.startsWith("/uploads/")}
                        />
                      ) : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${product.slug}`} className="line-clamp-2 text-[0.92rem] font-medium leading-snug text-cream-50 hover:underline">
                        {product.name}
                      </Link>
                      {product.ratingCount ? (
                        <>
                          <p className="mt-1.5 flex items-center gap-2 text-sm text-cream-300">
                            <Stars value={product.ratingAverage} size={14} />
                            {product.ratingAverage.toFixed(1)}
                          </p>
                          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <Link
                              href={active ? "/reviews#all" : `/reviews?product=${product.slug}#all`}
                              scroll={false}
                              className="text-xs font-semibold text-emerald-500 underline underline-offset-4"
                            >
                              {active ? "Show all reviews" : `Read ${product.ratingCount} review${product.ratingCount === 1 ? "" : "s"}`}
                            </Link>
                            <Link
                              href={`/product/${product.slug}#write-review`}
                              className="text-xs font-semibold text-cream-300 underline underline-offset-4 hover:text-cream-50"
                            >
                              Write a review
                            </Link>
                          </span>
                        </>
                      ) : (
                        <Link
                          href={`/product/${product.slug}#write-review`}
                          className="mt-1.5 inline-block text-xs font-semibold text-emerald-500 underline underline-offset-4"
                        >
                          No reviews yet — write the first
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* All reviews */}
      <Section id="all" className="scroll-mt-[var(--header-offset)]">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              title={filtered ? `Reviews of ${filtered.name}` : "All reviews"}
              lede={`${shown.length} review${shown.length === 1 ? "" : "s"}, newest first.`}
            />
            {filtered ? (
              <Link href="/reviews#all" scroll={false} className="text-sm font-semibold text-emerald-500 underline underline-offset-4">
                Show all products
              </Link>
            ) : null}
          </div>
          {shown.length ? (
            <ul className="mt-10 columns-1 gap-5 md:columns-2 lg:columns-3">
              {shown.map((review) => (
                <li key={review.id} className="mb-5 break-inside-avoid rounded-2xl border border-border-subtle bg-ink-800 p-6">
                  <Stars value={review.rating} size={15} />
                  {review.title ? <h3 className="mt-3 font-medium text-cream-50">{review.title}</h3> : null}
                  <p className="mt-2 text-sm leading-relaxed text-cream-300">{review.body}</p>
                  <p className="mt-4 text-xs text-cream-400">
                    {review.authorName}
                    {review.isVerified ? " · Verified buyer" : ""} · {formatDate(review.createdAt)}
                  </p>
                  {review.product ? (
                    <Link href={`/product/${review.product.slug}`} className="mt-2 inline-block text-xs font-semibold text-emerald-500 hover:underline">
                      {review.product.name}
                    </Link>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-gold-400">MiracleTree — overall</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-cream-300">No reviews yet.</p>
          )}
        </Container>
      </Section>
    </>
  );
}
