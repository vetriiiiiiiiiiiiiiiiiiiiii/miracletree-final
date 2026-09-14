import { SITE } from "./constants";
import { stripHtml, truncate } from "./utils";
export function siteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
/**
 * One place that builds page metadata, so canonical, OG and Twitter tags can
 * never drift apart between routes.
 */
export function buildMetadata(input) {
  const url = siteUrl(input.path);
  const image = input.image ?? siteUrl("/og-default.png");
  const description = truncate(stripHtml(input.description), 155);
  return {
    title: input.title,
    description,
    keywords: input.keywords ?? undefined,
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      title: input.title,
      description,
      url,
      siteName: SITE.name,
      locale: "en_IN",
      type: input.type === "product" ? "website" : (input.type ?? "website"),
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
    },
  };
}
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": siteUrl("/#organization"),
    name: SITE.legalName,
    alternateName: SITE.name,
    url: siteUrl("/"),
    logo: siteUrl("/logo.png"),
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${SITE.address.line1}, ${SITE.address.line2}`,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.postalCode,
      addressCountry: "IN",
    },
    sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.youtube],
  };
}
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteUrl("/#website"),
    url: siteUrl("/"),
    name: SITE.name,
    publisher: { "@id": siteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: siteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}
export function breadcrumbSchema(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: siteUrl(c.path),
    })),
  };
}
export function productSchema(product) {
  const prices = product.variants.map((v) => v.price / 100);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: truncate(
      stripHtml(product.shortDescription ?? product.description ?? product.name),
      300,
    ),
    sku: product.sku ?? product.variants[0]?.sku ?? undefined,
    image: product.images.slice(0, 5).map((i) => i.url),
    brand: { "@type": "Brand", name: SITE.name },
    url: siteUrl(`/product/${product.slug}`),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: product.variants.length,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: siteUrl(`/product/${product.slug}`),
      seller: { "@id": siteUrl("/#organization") },
    },
  };
  // Only emit ratings that actually exist — never a placeholder aggregate.
  if (product.ratingAverage !== null && product.ratingCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratingAverage,
      reviewCount: product.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return schema;
}
export function faqSchema(faqs) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: stripHtml(f.answer) },
    })),
  };
}
export function articleSchema(article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.heroImageUrl ?? undefined,
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@id": siteUrl("/#organization") },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    mainEntityOfPage: siteUrl(`/journal/${article.slug}`),
  };
}
export function itemListSchema(items, pathPrefix = "/product") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: siteUrl(`${pathPrefix}/${item.slug}`),
      name: item.name,
    })),
  };
}
