import type { NextConfig } from "next";

/**
 * Security headers. CSP is deliberately strict about frames and objects while
 * allowing Razorpay's checkout iframe and the Shopify CDN that still serves the
 * migrated product photography.
 */
const isProduction = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  // next/script and the inlined theme bootstrap need 'unsafe-inline'; the
  // 'unsafe-eval' allowance is dev-only for React Refresh.
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://checkout.razorpay.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://cdn.shopify.com https://www.google-analytics.com",
  "media-src 'self' https://cdn.shopify.com blob:",
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only in production: on a local HTTP dev server this would force the browser
  // to upgrade every request to HTTPS and fail.
  isProduction ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@react-three/drei"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HSTS is production-only. Sent from a local HTTP server it pins
          // `localhost` to HTTPS in the browser's cache for two years, which
          // breaks every other local project on the machine too.
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        // Admin and account pages must never be cached by a shared proxy.
        source: "/(admin|account)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },

  async redirects() {
    return [
      // Legacy Shopify URL shapes, preserved so existing links and indexed
      // pages keep resolving after the migration.
      { source: "/collections/frontpage", destination: "/shop", permanent: true },
      { source: "/collections/:slug", destination: "/shop/:slug", permanent: true },
      { source: "/products/:slug", destination: "/product/:slug", permanent: true },
      { source: "/pages/about-us", destination: "/about", permanent: true },
      { source: "/pages/contact", destination: "/contact", permanent: true },
      { source: "/policies/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/policies/refund-policy", destination: "/returns", permanent: true },
      { source: "/policies/terms-of-service", destination: "/terms", permanent: true },
      { source: "/policies/shipping-policy", destination: "/shipping", permanent: true },
      { source: "/blogs/:path*", destination: "/journal", permanent: true },
      // The journal index is now a chapter of Our Story. Individual articles
      // keep their own URLs, so nothing already indexed breaks.
      { source: "/journal", destination: "/about#field-notes", permanent: false },
    ];
  },
};

export default nextConfig;
