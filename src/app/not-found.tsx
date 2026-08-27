import Link from "next/link";
import type { Metadata } from "next";
import { LostSeed } from "@/components/error/LostSeed";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "This path didn't grow",
  robots: { index: false, follow: true },
};

/**
 * 404. A seed that landed somewhere nothing grows — the page states plainly that
 * the URL is wrong and offers the four routes people actually want.
 */
export default function NotFound() {
  return (
    <div className="grain relative flex min-h-[100svh] flex-col bg-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 85%, rgba(28,90,58,0.18) 0%, rgba(6,9,7,0) 70%)",
        }}
      />

      <header className="relative z-10 gutter py-8">
        <Link href="/" aria-label="Miracle Tree — home">
          <Logo className="h-7 w-auto" />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center gutter">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-14 py-16 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-6 text-gold-400">Error 404</p>
            <h1
              className="text-hero text-cream-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              This path didn&rsquo;t grow.
            </h1>
            <p className="mt-8 max-w-[44ch] leading-relaxed text-cream-300/85">
              The page you were looking for isn&rsquo;t here. It may have moved when we
              rebuilt the store, or the link may have a typo in it.
            </p>

            <div className="mt-11 flex flex-wrap gap-3">
              <LinkButton href="/" size="lg" magnetic>
                Return home
              </LinkButton>
              <LinkButton href="/shop" variant="secondary" size="lg" magnetic magneticStrength={0.18}>
                Explore the collection
              </LinkButton>
            </div>

            <nav aria-label="Suggested pages" className="mt-14 border-t border-white/10 pt-7">
              <p className="eyebrow mb-4 text-cream-400">Or try</p>
              <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
                {[
                  { href: "/shop", label: "All products" },
                  { href: "/moringa", label: "Discover moringa" },
                  { href: "/journal", label: "The journal" },
                  { href: "/faq", label: "FAQ" },
                  { href: "/contact", label: "Contact" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-cream-300 underline-offset-4 transition-colors hover:text-cream-50 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-sm md:max-w-none">
            <LostSeed />
          </div>
        </div>
      </main>
    </div>
  );
}
