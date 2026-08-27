import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

/**
 * The sitemap covers everything that should be indexed and nothing that
 * shouldn't: no account pages, no cart, no checkout, no filtered shop URLs.
 * `lastModified` comes from the row's own updatedAt, so a re-crawl is only
 * requested when the content genuinely changed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, articles] = await Promise.all([
    prisma.product.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.article.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/moringa"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: siteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/journal"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: siteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: siteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: siteUrl("/shipping"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl("/returns"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: siteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticRoutes,
    ...categories.map((category) => ({
      url: siteUrl(`/shop/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: siteUrl(`/product/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...articles.map((article) => ({
      url: siteUrl(`/journal/${article.slug}`),
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
