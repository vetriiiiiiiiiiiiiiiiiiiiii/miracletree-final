import { siteUrl } from "@/lib/seo";
export default function robots() {
  // A staging or preview deployment must never be indexed. Production is
  // identified by NEXT_PUBLIC_SITE_URL pointing at the real domain.
  const isProduction =
    process.env.NODE_ENV === "production" &&
    !/localhost|vercel\.app|\.local/i.test(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (!isProduction) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/order/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          // Filtered and sorted permutations of the shop are duplicates of the
          // canonical listing pages.
          "/shop?*",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/").replace(/\/$/, ""),
  };
}
