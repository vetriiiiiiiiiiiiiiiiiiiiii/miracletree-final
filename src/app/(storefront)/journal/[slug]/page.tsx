import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";
import { getArticleBySlug, getArticles, getBestSellers } from "@/lib/queries";
import { articleSchema, breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatDate, stripHtml } from "@/lib/utils";

export const revalidate = 600;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return buildMetadata({
      title: "Article not found",
      description: "",
      path: `/journal/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt ?? stripHtml(article.content),
    path: `/journal/${article.slug}`,
    image: article.heroImageUrl,
    type: "article",
    publishedTime: article.publishedAt?.toISOString(),
  });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [more, products] = await Promise.all([
    getArticles({ take: 4 }),
    getBestSellers(3),
  ]);

  const related = more.filter((a) => a.slug !== article.slug).slice(0, 3);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Journal", path: "/journal" },
    { name: article.title, path: `/journal/${article.slug}` },
  ];

  return (
    <>
      <JsonLd id="article" data={articleSchema(article)} />
      <JsonLd id="article-breadcrumb" data={breadcrumbSchema(crumbs)} />

      <article className="grain bg-ink pb-24 pt-12 md:pt-16">
        <Container>
          <Breadcrumbs items={crumbs} />

          <header className="mx-auto mt-10 max-w-3xl">
            <p className="flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.14em] text-cream-400">
              {article.category ? (
                <Link
                  href={`/journal?category=${article.category.slug}`}
                  className="text-gold-400/90 hover:text-gold-300"
                >
                  {article.category.name}
                </Link>
              ) : null}
              <span aria-hidden className="text-white/15">/</span>
              <span>{article.readingMinutes} min read</span>
            </p>

            <h1 className="mt-6 text-display text-cream-50">{article.title}</h1>

            {article.excerpt ? (
              <p className="mt-6 text-[1.15rem] leading-relaxed text-cream-300/85">
                {article.excerpt}
              </p>
            ) : null}

            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-cream-400">
              <span>{article.authorName}</span>
              {article.publishedAt ? (
                <>
                  <span aria-hidden className="text-white/15">/</span>
                  <time dateTime={article.publishedAt.toISOString()}>
                    {formatDate(article.publishedAt)}
                  </time>
                </>
              ) : null}
            </div>
          </header>

          {article.heroImageUrl ? (
            <div className="relative mx-auto mt-12 aspect-16/9 max-w-5xl overflow-hidden bg-ink-800">
              <Image
                src={article.heroImageUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 64rem"
                className="object-cover"
              />
            </div>
          ) : null}

          <div
            className="prose-botanical mx-auto mt-14 max-w-[68ch]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />

          {article.tags ? (
            <ul className="mx-auto mt-12 flex max-w-[68ch] flex-wrap gap-2">
              {article.tags.split(",").map((tag) => (
                <li
                  key={tag}
                  className="border border-white/12 px-3 py-1.5 text-xs text-cream-400"
                >
                  {tag.trim()}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Newsletter */}
          <div className="mx-auto mt-20 max-w-[68ch] border-y border-white/10 py-10">
            <h2 className="text-title text-cream-50">Get the next one</h2>
            <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-cream-400">
              Roughly monthly. Harvest notes, growing notes and the occasional recipe.
            </p>
            <div className="mt-6 max-w-md">
              <NewsletterForm source="journal" />
            </div>
          </div>
        </Container>
      </article>

      {/* Products */}
      {products.length ? (
        <Section tone="raised" spacing="default" className="grain">
          <Container>
            <h2 className="text-title text-cream-50">From the collection</h2>
            <ProductGrid
              products={products}
              listName="Journal recommendations"
              columns={3}
              className="mt-10"
            />
          </Container>
        </Section>
      ) : null}

      {/* More reading */}
      {related.length ? (
        <Section tone="default" spacing="default" className="grain">
          <Container>
            <h2 className="text-title text-cream-50">More from the journal</h2>
            <ul className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.id} className="group">
                  <Link href={`/journal/${item.slug}`}>
                    <div className="relative aspect-16/10 overflow-hidden bg-ink-800">
                      {item.heroImageUrl ? (
                        <Image
                          src={item.heroImageUrl}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 90vw, 30vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(120% 90% at 30% 20%, rgba(28,90,58,0.3) 0%, rgba(6,9,7,1) 70%)",
                          }}
                        />
                      )}
                    </div>
                    <h3 className="mt-4 text-[1.1rem] leading-snug text-cream-50 transition-colors group-hover:text-gold-200">
                      {item.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
