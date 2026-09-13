import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { ThemeSegmented } from "@/components/theme/ThemeToggle";
import { SITE } from "@/lib/constants";

type Column = { id: string; label: string; href: string };

export function Footer({
  shop,
  company,
  support,
}: {
  shop: Column[];
  company: Column[];
  support: Column[];
}) {
  return (
    <footer className="border-t border-border-subtle bg-ink-900">
      <div className="mx-auto max-w-[100rem] gutter">
        {/* Newsletter */}
        <div className="grid gap-10 border-b border-border-subtle py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-20">
          <div>
            <h2 className="max-w-[16ch] text-display text-cream-50">
              Field notes from the tree.
            </h2>
            <p className="mt-5 max-w-[46ch] text-cream-300">
              Harvest updates, growing notes and the occasional recipe. Roughly once a
              month, never more.
            </p>
          </div>
          <div className="lg:pt-4">
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo className="h-9 w-auto" />
            <p className="mt-6 text-sm leading-relaxed text-cream-400">
              {SITE.legalName} has worked with moringa growers around Madurai for more
              than twenty years. Leaf, pod, flower, seed and gum — one tree, grown and
              processed close to where it stands.
            </p>

            <address className="mt-6 not-italic text-sm leading-relaxed text-cream-400">
              {SITE.address.line1}, {SITE.address.line2}
              <br />
              {SITE.address.city}, {SITE.address.state} {SITE.address.postalCode}
            </address>

            <div className="mt-5 grid gap-1 text-sm">
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="inline-block py-1 text-cream-200 transition-colors hover:text-gold-300"
              >
                {SITE.phone}
              </a>
              <span className="text-xs text-cream-400">{SITE.phoneHours}</span>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-1 inline-block py-1 text-cream-200 transition-colors hover:text-gold-300"
              >
                {SITE.email}
              </a>
            </div>
          </div>

          <FooterColumn title="Shop" items={shop} />
          <FooterColumn title="Company" items={company} />
          <FooterColumn title="Support" items={support} />
        </div>

        {/* Base */}
        <div className="flex flex-col gap-6 border-t border-border-subtle py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-xs text-cream-400">
              © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
            </p>
            {/* The full three-way control lives here and in the mobile menu;
                the header keeps the one-tap toggle. */}
            <ThemeSegmented />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <ul className="flex flex-wrap items-center gap-5">
              <SocialLink href={SITE.social.instagram} label="Instagram">
                <path d="M5 2h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" />
                <circle cx="10" cy="10" r="3.4" />
                <circle cx="14.8" cy="5.2" r="0.9" fill="currentColor" stroke="none" />
              </SocialLink>
              <SocialLink href={SITE.social.facebook} label="Facebook">
                <path d="M11.5 18v-7h2.3l.4-2.7h-2.7V6.6c0-.8.2-1.3 1.4-1.3h1.4V2.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2H6.6V11h2.3v7h2.6z" />
              </SocialLink>
              <SocialLink href={SITE.social.youtube} label="YouTube">
                <path d="M18 6.2a2.1 2.1 0 0 0-1.5-1.5C15.2 4.4 10 4.4 10 4.4s-5.2 0-6.5.3A2.1 2.1 0 0 0 2 6.2C1.7 7.5 1.7 10 1.7 10s0 2.5.3 3.8a2.1 2.1 0 0 0 1.5 1.5c1.3.3 6.5.3 6.5.3s5.2 0 6.5-.3a2.1 2.1 0 0 0 1.5-1.5c.3-1.3.3-3.8.3-3.8s0-2.5-.3-3.8z" />
                <path d="M8.4 12.5v-5l4.2 2.5-4.2 2.5z" fill="currentColor" stroke="none" />
              </SocialLink>
            </ul>

            {/* Payment marks are described, not faked as brand logos. */}
            {/* Wraps. Six chips in a non-wrapping row are 9px wider than a
                390px phone, which put a sideways scroll on every page of the
                site — the footer is on all of them. */}
            <ul className="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
              {["UPI", "Visa", "Mastercard", "RuPay", "Net banking", "COD"].map((method) => (
                <li
                  key={method}
                  className="border border-border-subtle px-2 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-cream-400"
                >
                  {method}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: Column[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label={title}>
      <h3 className="eyebrow mb-5 text-gold-400">{title}</h3>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="inline-block py-1 text-sm text-cream-300 transition-colors hover:text-cream-50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="block p-1 text-cream-400 transition-colors hover:text-cream-50"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden
        >
          {children}
        </svg>
      </a>
    </li>
  );
}
