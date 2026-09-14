import { SITE } from "@/lib/constants";
import { organizationSchema, siteUrl, websiteSchema } from "@/lib/seo";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Analytics } from "@/components/analytics/Analytics";
import { Preloader } from "@/components/motion/Preloader";
import "./globals.css";
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
