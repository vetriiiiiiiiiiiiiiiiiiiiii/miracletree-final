import { Caveat, Fraunces, Inter } from "next/font/google";
import { SITE } from "@/lib/constants";
import { organizationSchema, siteUrl, websiteSchema } from "@/lib/seo";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Analytics } from "@/components/analytics/Analytics";
import { Preloader } from "@/components/motion/Preloader";
import "./globals.css";
/**
 * Fraunces carries the botanical, slightly organic display voice; Inter does the
 * interface work. Both are self-hosted by next/font, so there is no render-
 * blocking request to a font CDN and no layout shift on swap.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  // Variable axes and a fixed weight list are mutually exclusive in next/font.
  // The variable face is the right choice here: optical sizing keeps the hero
  // and body headings from needing two separate cuts.
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});
/**
 * The hand for Our Story. That page is drawn as a field notebook, and marginalia
 * in a geometric sans reads as a caption rather than as someone's handwriting.
 */
const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hand",
  weight: ["400", "600"],
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};
export const viewport = {
  themeColor: "#060907",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({ children }) {
  return (
    <html
      lang="en-IN"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable}`}
      // Server-rendered as the brand default; the theme script in <head>
      // corrects it before paint from the visitor's stored choice.
      data-theme="dark"
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
