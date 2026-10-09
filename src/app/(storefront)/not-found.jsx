import Link from "next/link";
import { LostSeed } from "@/components/error/LostSeed";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/layout/Section";

export const metadata = {
  title: "Page not found — Miracle Tree",
  robots: { index: false, follow: true },
};

export default function StorefrontNotFound() {
  return (
    <div className="grain relative py-16 md:py-24 bg-ink min-h-[60vh] flex items-center">
      <Container>
        <div className="mx-auto grid w-full max-w-5xl items-center gap-14 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-6 text-gold-400">Error 404</p>
            <h1
              className="text-hero text-cream-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              This path didn&rsquo;t grow.
            </h1>
            <p className="mt-8 max-w-[44ch] leading-relaxed text-cream-300">
              The page you were looking for isn&rsquo;t here. It may have moved
              or the link may have a typo in it.
            </p>

            <div className="mt-11 flex flex-wrap gap-3">
              <LinkButton href="/" size="lg" magnetic>
                Return home
              </LinkButton>
              <LinkButton
                href="/shop"
                variant="secondary"
                size="lg"
                magnetic
                magneticStrength={0.18}
              >
                Explore the collection
              </LinkButton>
            </div>

            <nav
              aria-label="Suggested pages"
              className="mt-14 border-t border-border-subtle pt-7"
            >
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
      </Container>
    </div>
  );
}
