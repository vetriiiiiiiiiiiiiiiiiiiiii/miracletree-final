"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Saved products" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Your details" },
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto border-b border-white/10 pb-1 lg:grid lg:gap-0 lg:overflow-visible lg:border-b-0 lg:pb-0">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap px-4 py-3 text-sm transition-colors lg:border-l lg:px-5",
                  active
                    ? "text-cream-50 lg:border-gold-400"
                    : "text-cream-400 hover:text-cream-100 lg:border-white/10",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}

        {isAdmin ? (
          <li className="shrink-0">
            <Link
              href="/admin"
              className="block whitespace-nowrap px-4 py-3 text-sm text-gold-300 transition-colors hover:text-gold-200 lg:border-l lg:border-white/10 lg:px-5"
            >
              Admin dashboard
            </Link>
          </li>
        ) : null}
      </ul>

      <form action={logoutAction} className="mt-6 hidden lg:block">
        <button
          type="submit"
          className="px-5 text-sm text-cream-400 underline underline-offset-4 transition-colors hover:text-cream-100"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
