"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
/**
 * The header is transparent while the hero is on screen and becomes a blurred
 * dark bar once the page scrolls — glass is used here and in the cart, not
 * across the whole site. It also hides on downward scroll past the fold and
 * returns on upward scroll, which gives long product pages their full height
 * back without ever putting navigation more than one gesture away.
 */
export function Header({
  items,
  companyItems,
  categories,
  isAuthenticated,
  announcement,
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
    const onKey = (event) => {
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

      {/* Always in flow, never conditional.
       *
       * This used to unmount once the page scrolled past 24px, and because it
       * sits in normal flow above a sticky header, mounting it added 33px of
       * document height and moved the scroll position with it. Near the
       * threshold that fed back on itself — the bar appeared, the shift pushed
       * the page back over 24px, the bar vanished, and so on — which is the
       * flicker anyone saw scrolling back to the top.
       *
       * No condition is needed: the bar is relative, not sticky, so it simply
       * scrolls out of view while the header stays. Document height is now
       * constant, so there is nothing to feed back. */}
      {announcement ? (
        <div className="relative z-40 bg-forest-800 py-2 text-center text-[0.7rem] uppercase tracking-[0.18em] text-leaf-200">
          {announcement}
        </div>
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-[150] transition-all duration-500 ease-[var(--ease-organic)]",
          solid
            ? "border-b border-border-subtle bg-ink-900/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gutter md:h-20">
          <div className="flex items-center gap-6 xl:gap-10">
            <Link href="/" aria-label="Miracle Tree — home" className="shrink-0">
              <Logo className="h-6 w-auto text-cream-50 sm:h-7 md:h-8" />
            </Link>

            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-5 xl:gap-8">
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

                {companyItems.length ? (
                  <li>
                    <CompanyMenu items={companyItems} pathname={pathname} />
                  </li>
                ) : null}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-1 md:gap-1.5 xl:gap-2">
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
                <circle
                  cx="10"
                  cy="6.5"
                  r="3.2"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M3.8 17c.6-3.3 3.1-5.2 6.2-5.2s5.6 1.9 6.2 5.2"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
            </Link>

            {/* Hidden below md. At 390px the logo plus five controls overflow
            the header's content box by about 24px, which gave every page a
            sideways scroll on a phone. The theme control is not lost — the
            mobile menu carries the full Light/Dark/System switch, labelled,
            which is a better control than an unlabelled icon anyway. */}
            <ThemeToggle className="hidden md:inline-flex" />

            <button
              type="button"
              onClick={open}
              className="relative inline-flex h-10 items-center gap-1.5 px-1 text-cream-200 transition-colors hover:text-cream-50 sm:gap-2 sm:px-2"
              aria-label={`Open bag, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M4 6h12l-1 11H5L4 6z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.4 6V4.8a2.6 2.6 0 0 1 5.2 0V6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
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
              className="inline-flex h-10 w-9 items-center justify-center text-cream-200 transition-colors hover:text-cream-50 sm:w-10 lg:hidden"
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
        companyItems={companyItems}
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
/**
 * The "Company" menu.
 *
 * Opens on hover for a mouse and on click for everything else, and closes on
 * Escape or a click outside. Hover alone would make it unreachable by keyboard
 * and unusable on touch, and click alone feels broken against every other site
 * with a desktop nav — so it answers to both.
 */
function CompanyMenu({ items, pathname }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const active = items.some((item) => pathname.startsWith(item.href.split("#")[0]));
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);
  // A route change must close it, or it hangs over the page it just opened.
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div
      ref={wrapper}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "group relative flex items-center gap-1.5 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
          active || open ? "text-cream-50" : "text-cream-300 hover:text-cream-50",
        )}
      >
        Company
        <svg
          width="9"
          height="9"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          className={cn("transition-transform duration-300", open && "rotate-180")}
        >
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <span
          className={cn(
            "absolute -bottom-0.5 left-0 h-px bg-gold-400 transition-all duration-500 ease-[var(--ease-organic)]",
            active ? "w-full" : "w-0 group-hover:w-full",
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "absolute left-0 top-full z-50 w-56 pt-4 transition-all duration-200",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <ul className="border border-border-subtle bg-ink-900 py-2 shadow-[var(--mt-shadow-drawer)]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "block px-5 py-2.5 text-[0.78rem] transition-colors",
                  pathname === item.href
                    ? "text-cream-50"
                    : "text-cream-300 hover:bg-ink-800 hover:text-cream-50",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
function HeaderLink({ href, active, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
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
function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-9 items-center justify-center text-cream-200 transition-colors hover:text-cream-50 sm:w-10"
    >
      {children}
    </button>
  );
}
