import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductHero } from "@/components/product/ProductHero";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/motion/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { prisma } from "@/lib/prisma";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import {
  breadcrumbSchema,
  buildMetadata,
  faqSchema,
  productSchema,
} from "@/lib/seo";
import { stripHtml, truncate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return buildMetadata({
      title: "Product not found",
      description: "",
      path: `/product/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description:
      product.seoDescription ??
      product.shortDescription ??
      stripHtml(product.description ?? product.name),
    path: `/product/${product.slug}`,
    image: product.ogImageUrl ?? product.images[0]?.url ?? null,
    type: "product",
    keywords: product.seoKeywords,
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId, 4);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    ...(product.category
      ? [{ name: product.category.name, path: `/shop/${product.category.slug}` }]
      : []),
    { name: product.name, path: `/product/${product.slug}` },
  ];

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    imageUrl: variant.imageUrl,
    tracked: variant.inventory?.trackInventory ?? false,
    available: variant.inventory
      ? Math.max(0, variant.inventory.onHand - variant.inventory.reserved)
      : 0,
  }));

  const badges = [
    product.isBestSeller ? "Bestseller" : null,
    product.isNew ? "New" : null,
    product.isOnSale ? "On offer" : null,
  ].filter((b): b is string => Boolean(b));

  return (
    <>
      <JsonLd id="product" data={productSchema({ ...product, inStock: product.inStock })} />
      <JsonLd id="product-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {product.faqs.length ? (
        <JsonLd id="product-faq" data={faqSchema(product.faqs)} />
      ) : null}

      <RecentlyViewed
        productId={product.id}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images[0]?.url ?? null,
        }}
      />

      {/* PRODUCT HERO */}
      <div className="grain bg-ink pb-20 pt-12 md:pt-16">
        <Container>
          <Breadcrumbs items={crumbs} className="mb-10" />
          <ProductHero
            productId={product.id}
            productName={product.name}
            shortDescription={product.shortDescription}
            categoryName={product.category?.name ?? null}
            categorySlug={product.category?.slug ?? null}
            images={product.images}
            variants={variants}
            ratingAverage={product.ratingAverage}
            ratingCount={product.ratingCount}
            badges={badges}
          />
        </Container>
      </div>

      {/* PRODUCT STORY */}
      {product.description || product.story ? (
        <Section tone="raised" spacing="default" className="grain">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <SectionHeading title="Why this exists" />
              <div
                className="prose-botanical max-w-[62ch]"
                // Sanitised on write in the admin action and again here, so
                // rows imported from the old store cannot carry a payload.
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(product.story ?? product.description),
                }}
              />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* BENEFITS */}
      {product.benefits.length ? (
        <Section tone="default" spacing="default" className="grain">
          <Container>
            <SectionHeading
              title="In the brand's own words"
              lede="Taken directly from the product's own description — we don't add claims of our own."
            />
            <Reveal className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {product.benefits.map((benefit, index) => (
                <article
                  key={benefit.id}
                  data-animate="fade-up"
                  className="border-t border-border-subtle pt-6"
                >
                  <span className="text-[0.66rem] tabular-nums tracking-[0.16em] text-gold-400">
                    0{index + 1}
                  </span>
                  <h3 className="mt-4 text-[1.05rem] leading-snug text-cream-50">
                    {benefit.title}
                  </h3>
                  {benefit.body ? (
                    <p className="mt-3 text-sm leading-relaxed text-cream-400">
                      {benefit.body}
                    </p>
                  ) : null}
                </article>
              ))}
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* INGREDIENTS */}
      {product.ingredients.length ? (
        <Section tone="forest" spacing="default" className="grain">
          <Container>
            <SectionHeading
              title="From the tree"
              lede="The parts of the moringa this product is made from."
            />
            <Reveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
              {product.ingredients.map((entry) => (
                <article
                  key={entry.ingredientId}
                  data-animate="fade-up"
                  className="flex h-full flex-col border border-border-subtle bg-ink/40 p-6"
                >
                  <h3
                    className="text-[1.15rem] text-cream-50"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {entry.ingredient.name}
                  </h3>
                  {entry.amount ? (
                    <p className="mt-1 text-xs text-gold-300">{entry.amount}</p>
                  ) : null}
                  {entry.ingredient.origin ? (
                    <p className="eyebrow mt-3 text-cream-400">
                      {entry.ingredient.origin}
                    </p>
                  ) : null}
                  {entry.ingredient.description ? (
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-cream-400">
                      {entry.ingredient.description}
                    </p>
                  ) : null}
                  <Link
                    href={`/shop?ingredient=${entry.ingredient.slug}`}
                    className="mt-5 inline-block py-1.5 text-[0.66rem] uppercase tracking-[0.14em] text-cream-300 underline underline-offset-4 hover:text-gold-300"
                  >
                    Shop this part
                  </Link>
                </article>
              ))}
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* HOW TO USE */}
      {product.usageSteps.length ? (
        <Section tone="default" spacing="default" className="grain">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <SectionHeading
                title="Three steps"
                lede="Follow the serving on the pack. If you are pregnant, nursing or on prescribed medication, speak to your doctor first."
              />

              <ol className="grid gap-0">
                {product.usageSteps.map((step) => (
                  <li
                    key={step.id}
                    className="grid grid-cols-[3rem_1fr] gap-5 border-t border-border-subtle py-8 first:border-t-0 first:pt-0"
                  >
                    <span className="text-[0.66rem] tabular-nums tracking-[0.16em] text-gold-400">
                      0{step.step}
                    </span>
                    <div>
                      <h3 className="text-[1.25rem] text-cream-50">{step.title}</h3>
                      {step.body ? (
                        <p className="mt-2 max-w-[48ch] leading-relaxed text-cream-400">
                          {step.body}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* FARM TO PACK */}
      <Section tone="raised" spacing="default" className="grain">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeading title="Where this came from" />
            <div className="max-w-[58ch]">
              <p className="leading-relaxed text-cream-300">
                Grown on smallholdings around Madurai in Tamil Nadu, picked by hand at
                first light, and into shade within the hour. Drying happens below 40°C,
                which is slower and more expensive than sun-drying and is the reason the
                leaf still looks like a leaf when it reaches the mill.
              </p>
              <p className="mt-5 leading-relaxed text-cream-400">
                Everything is milled and packed in small batches, so what arrives is
                rarely more than a few weeks old.
              </p>
              <Link
                href="/moringa"
                className="mt-8 inline-block py-1.5 text-[0.72rem] uppercase tracking-[0.16em] text-gold-300 underline underline-offset-4"
              >
                The whole process
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* REVIEWS */}
      <Section id="reviews" tone="default" spacing="default" className="grain">
        <Container>
          <SectionHeading title="What people say" className="mb-14" />
          <ProductReviews
            productId={product.id}
            productName={product.name}
            reviews={product.reviews}
            average={product.ratingAverage}
            count={product.ratingCount}
            breakdown={product.ratingBreakdown}
          />
        </Container>
      </Section>

      {/* PRODUCT FAQ */}
      {product.faqs.length ? (
        <Section tone="raised" spacing="default" className="grain">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <SectionHeading title={`About ${product.name}`} />
              <Accordion
                items={product.faqs.map((faq) => ({
                  id: faq.id,
                  question: faq.question,
                  answer: <p>{faq.answer}</p>,
                }))}
              />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* RELATED */}
      {related.length ? (
        <Section tone="default" spacing="default" className="grain">
          <Container>
            <SectionHeading
              title="From the same tree"
              lede={
                product.category
                  ? `More from ${product.category.name.toLowerCase()}.`
                  : undefined
              }
            />
            <ProductGrid
              products={related}
              listName={`Related to ${product.name}`}
              columns={4}
              className="mt-14"
            />
          </Container>
        </Section>
      ) : null}

      {/* Compliance note — stated once, plainly, on every product page. */}
      <div className="border-t border-border-subtle bg-ink py-10">
        <Container>
          <p className="max-w-[76ch] text-xs leading-relaxed text-cream-400">
            {truncate(
              "These are food products, not medicines. They are not intended to diagnose, treat, cure or prevent any disease. If you are pregnant, nursing, taking prescribed medication or managing a health condition, talk to a qualified medical practitioner before adding any supplement to your diet.",
              400,
            )}
          </p>
        </Container>
      </div>
    </>
  );
}
