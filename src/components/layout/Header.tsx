"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/search/SearchOverlay";

export type NavItem = { id: string; label: string; href: string };

/**
 * The header is transparent while the hero is on screen and becomes a blurred
 * dark bar once the page scrolls — glass is used here and in the cart, not
 * across the whole site. It also hides on downward scroll past the fold and
 * returns on upward scroll, which gives long product pages their full height
 * back without ever putting navigation more than one gesture away.
 */
export function Header({
  items,
  categories,
  isAuthenticated,
  announcement,
}: {
  items: NavItem[];
  categories: { name: string; slug: string; count: number }[];
  isAuthenticated: boolean;
  announcement: string | null;
}) {
  const pathname = usePathname();
  const { cart, open } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastY = useRef(0);

  // Only the homepage has a full-bleed hero for the header to sit over.
  const overlayHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 480 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const solid = scrolled || !overlayHero || menuOpen;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[400] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:text-cream-50"
      >
        Skip to content
      </a>

      {announcement && !scrolled ? (
        <div className="relative z-40 bg-forest-800 py-2 text-center text-[0.7rem] uppercase tracking-[0.18em] text-leaf-200">
          {announcement}
        </div>
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-[150] transition-all duration-500 ease-[var(--ease-organic)]",
          solid
            ? "border-b border-white/10 bg-ink-900/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gutter md:h-20">
          <div className="flex items-center gap-10">
            <Link href="/" aria-label="Miracle Tree — home" className="shrink-0">
              <Logo className="h-7 w-auto text-cream-50 md:h-8" />
            </Link>

            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-8">
                {items.map((item) => (
                  <li key={item.id}>
                    <HeaderLink
                      href={item.href}
                      active={
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href)
                      }
                    >
                      {item.label}
                    </HeaderLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <IconButton
              label="Search products, ingredients and articles"
              onClick={() => setSearchOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </IconButton>

            <Link
              href={isAuthenticated ? "/account" : "/login"}
              aria-label={isAuthenticated ? "Your account" : "Sign in"}
              className="hidden h-10 w-10 items-center justify-center text-cream-200 transition-colors hover:text-cream-50 md:inline-flex"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M3.8 17c.6-3.3 3.1-5.2 6.2-5.2s5.6 1.9 6.2 5.2"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
            </Link>

            <button
              type="button"
              onClick={open}
              className="relative inline-flex h-10 items-center gap-2 px-2 text-cream-200 transition-colors hover:text-cream-50"
              aria-label={`Open bag, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M4 6h12l-1 11H5L4 6z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path d="M7.4 6V4.8a2.6 2.6 0 0 1 5.2 0V6" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span
                className={cn(
                  "min-w-[1.1rem] text-[0.7rem] tabular-nums transition-colors",
                  cart.itemCount > 0 ? "text-gold-400" : "text-cream-400",
                )}
              >
                {cart.itemCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center text-cream-200 transition-colors hover:text-cream-50 lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="flex flex-col gap-[5px]" aria-hidden>
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={items}
        categories={categories}
        isAuthenticated={isAuthenticated}
        onSearch={() => {
          setMenuOpen(false);
          setSearchOpen(true);
        }}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function HeaderLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative py-1 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
        active ? "text-cream-50" : "text-cream-300 hover:text-cream-50",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-0.5 left-0 h-px bg-gold-400 transition-all duration-500 ease-[var(--ease-organic)]",
          active ? "w-full" : "w-0 group-hover:w-full",
        )}
        aria-hidden
      />
    </Link>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center text-cream-200 transition-colors hover:text-cream-50"
    >
      {children}
    </button>
  );
}
