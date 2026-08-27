"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import { logoutAction } from "@/app/actions/auth";
import { CommandPalette, type Command } from "@/components/admin/CommandPalette";

type NavSection = {
  title: string;
  items: { href: string; label: string; icon: IconName; exact?: boolean }[];
};

type IconName =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "reviews"
  | "content"
  | "journal"
  | "story"
  | "promotions"
  | "media"
  | "settings";

const NAVIGATION: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", exact: true }],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
      { href: "/admin/promotions", label: "Promotions", icon: "promotions" },
      { href: "/admin/reviews", label: "Reviews", icon: "reviews" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content", label: "Homepage", icon: "content" },
      { href: "/admin/journal", label: "Journal", icon: "journal" },
      { href: "/admin/story", label: "Our Story", icon: "story" },
      { href: "/admin/media", label: "Media", icon: "media" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
];

export function AdminShell({
  children,
  user,
  pendingCounts,
}: {
  children: ReactNode;
  user: { name: string; email: string; role: string };
  pendingCounts: { orders: number; reviews: number; lowStock: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const badge = (href: string) => {
    if (href === "/admin/orders" && pendingCounts.orders > 0) return pendingCounts.orders;
    if (href === "/admin/reviews" && pendingCounts.reviews > 0) return pendingCounts.reviews;
    if (href === "/admin/inventory" && pendingCounts.lowStock > 0) return pendingCounts.lowStock;
    return null;
  };

  const commands = useMemo<Command[]>(
    () => [
      ...NAVIGATION.flatMap((section) =>
        section.items.map((item) => ({
          id: item.href,
          label: item.label,
          group: section.title,
          run: () => router.push(item.href),
        })),
      ),
      {
        id: "new-product",
        label: "New product",
        group: "Create",
        run: () => router.push("/admin/products/new"),
      },
      {
        id: "new-article",
        label: "New journal article",
        group: "Create",
        run: () => router.push("/admin/journal/new"),
      },
      {
        id: "new-coupon",
        label: "New discount code",
        group: "Create",
        run: () => router.push("/admin/promotions?new=1"),
      },
      {
        id: "view-store",
        label: "Open the storefront",
        group: "Links",
        run: () => window.open("/", "_blank", "noopener"),
      },
    ],
    [router],
  );

  return (
    <div className="min-h-[100svh] bg-ink text-cream-100">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[500] focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[160] flex w-64 flex-col border-r border-white/10 bg-ink-900",
          "transition-transform duration-300 ease-[var(--ease-swift)] lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 text-cream-400 hover:text-cream-50 lg:hidden"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {NAVIGATION.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="mb-2 px-3 text-[0.58rem] uppercase tracking-[0.18em] text-cream-400/60">
                {section.title}
              </p>
              <ul className="grid gap-0.5">
                {section.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const count = badge(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-white/[0.06] text-cream-50"
                            : "text-cream-300 hover:bg-white/[0.03] hover:text-cream-50",
                        )}
                      >
                        <Icon name={item.icon} active={active} />
                        <span className="flex-1">{item.label}</span>
                        {count ? (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-400 px-1.5 text-[0.62rem] tabular-nums text-ink">
                            {count > 99 ? "99+" : count}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <p className="truncate text-sm text-cream-100">{user.name}</p>
          <p className="mt-0.5 truncate text-xs text-cream-400">{user.email}</p>
          <p className="mt-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-gold-400">
            {user.role}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <Link href="/" className="text-xs text-cream-400 hover:text-cream-100">
              View store
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-cream-400 transition-colors hover:text-cream-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-[150] bg-ink/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-[140] flex h-16 items-center gap-4 border-b border-white/10 bg-ink-900/85 px-5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 text-cream-300 hover:text-cream-50 lg:hidden"
            aria-label="Open navigation"
          >
            <span className="flex flex-col gap-[5px]" aria-hidden>
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex flex-1 items-center gap-3 border border-white/12 bg-white/[0.02] px-3.5 py-2 text-left text-sm text-cream-400 transition-colors hover:border-white/25 md:max-w-md"
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span className="flex-1">Search or jump to…</span>
            <kbd className="hidden shrink-0 border border-white/15 px-1.5 py-0.5 text-[0.6rem] text-cream-400 md:block">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/admin/products/new"
            className="hidden shrink-0 items-center gap-2 bg-emerald-500 px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cream-50 transition-colors hover:bg-emerald-400 sm:inline-flex"
          >
            New product
          </Link>
        </header>

        <main id="admin-main" className="px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}

function Icon({ name, active }: { name: IconName; active: boolean }) {
  const paths: Record<IconName, string> = {
    dashboard: "M2.5 2.5h6v6h-6zM11.5 2.5h6v4h-6zM11.5 8.5h6v9h-6zM2.5 11.5h6v6h-6z",
    products: "M4 6l6-3 6 3v8l-6 3-6-3V6zM4 6l6 3 6-3M10 9v8",
    orders: "M4 6h12l-1 11H5L4 6zM7.4 6V4.8a2.6 2.6 0 0 1 5.2 0V6",
    customers: "M10 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.8 17c.6-3.3 3.1-5.2 6.2-5.2s5.6 1.9 6.2 5.2",
    inventory: "M3 7l7-3.5L17 7v6l-7 3.5L3 13V7zM3 7l7 3.5L17 7M10 10.5V17",
    reviews: "M10 3l2 4.3 4.7.5-3.5 3.2.9 4.6L10 13.4 5.9 15.6l.9-4.6L3.3 7.8 8 7.3 10 3z",
    content: "M3 3h14v5H3zM3 10h6v7H3zM11 10h6v7h-6z",
    journal: "M4 3h12v14H4zM7 7h6M7 10h6M7 13h4",
    story: "M6 3v14M6 4.5h8l-1.6 2.4L14 9.3H6",
    promotions: "M3 8l7-5 7 5v9H3V8zM7.5 10.5l5 5M12.5 10.5l-5 5",
    media: "M3 4h14v12H3zM3 12l4-4 3 3 3-3 4 4M7.5 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    settings:
      "M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7",
  };

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0 transition-colors", active ? "text-gold-400" : "text-cream-400")}
    >
      <path d={paths[name]} />
    </svg>
  );
}
