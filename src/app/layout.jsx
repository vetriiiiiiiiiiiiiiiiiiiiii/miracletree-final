import { SITE } from "@/lib/constants";
import { organizationSchema, siteUrl, websiteSchema } from "@/lib/seo";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/theme/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Analytics } from "@/components/analytics/Analytics";
import { Preloader } from "@/components/motion/Preloader";
import localFont from "next/font/local";
import "./globals.css";
// Variable fonts shipped from npm (@fontsource-variable/*) and bundled by
// next/font at build time. They used to come from next/font/google, which
// downloads from Google during the build — and a bad response from Google
// failed a production deploy outright. Nothing is fetched now, and no
// request goes to Google at runtime either.
const jakarta = localFont({
  src: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
});
// The hero's display serif — headline only, everything else stays sans.
const playfair = localFont({
  src: "../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2",
  weight: "400 900",
  variable: "--font-playfair",
  display: "swap",
});
export const metadata = {
  metadataBase: new URL(siteUrl("/")),
  title: {
    default: `${SITE.name} — Moringa superfoods from Madurai`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: siteUrl("/") },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE.name,
    url: siteUrl("/"),
  },
  twitter: { card: "summary_large_image" },
  icons: {
    // Generated from public/brand/miracletree-mark.webp. There was no
    // favicon.svg (nor any of these files), so every tab showed a blank globe.
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};
export const viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({ children }) {
  return (
    <html
      lang="en-IN"
      // Server-rendered as the brand default; the theme script in <head>
      // corrects it before paint from the visitor's stored choice.
      data-theme="light"
      className={`${jakarta.variable} ${playfair.variable}`}
      // The inline script below adds a `js` class before React hydrates, and
      // Lenis adds its own afterwards. Both are deliberate mutations of an
      // element React also renders, so the class mismatch is expected here.
      suppressHydrationWarning
    >
      <head>
        {/* Marks the document as script-capable before paint, so elements that
            JS will animate in can start hidden without ever hiding them from
            users whose JS fails to load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
        {/* Resolves the stored theme setting (including "system") onto the
            root element before the first paint. Inlined rather than imported
            because a network round-trip here is a black flash on paper. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <JsonLd id="org" data={organizationSchema()} />
          <JsonLd id="website" data={websiteSchema()} />
          {children}
          <Preloader />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
