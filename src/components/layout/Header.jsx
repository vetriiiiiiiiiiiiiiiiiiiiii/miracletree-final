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
 * The storefront header, in the D2C pattern: a rotating offer bar on top, then
 * a solid sticky bar with the logo, the primary links, a search field and the
 * account/bag controls. It hides on a downward scroll past the fold and comes
 * back on the way up, so long pages get their height back without navigation
 * ever being more than one gesture away.
 */
export function Header({
  items,
  companyItems,
  categories,
  isAuthenticated,
  announcements = [],
}) {
  const pathname = usePathname();
  const { cart, open } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
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
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[400] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-full focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:text-on-accent"
      >
        Skip to content
      </a>

      {/* In normal flow, never conditional: it scrolls away while the header
          stays, and document height stays constant (mounting it on scroll
          used to shift the page and flicker). */}
      <OfferBar messages={announcements} />

      <header
        className={cn(
          "sticky top-0 z-[150] border-b bg-ink transition-[transform,box-shadow] duration-300 ease-[var(--ease-organic)]",
          scrolled
            ? "border-border-subtle shadow-[var(--mt-shadow-card)]"
            : "border-border-subtle",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 gutter md:h-[4.5rem] lg:gap-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-ink-800 lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M3 6h14M3 10h14M3 14h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" aria-label="Miracle Tree — home" className="shrink-0">
            <Logo className="h-7 w-auto text-cream-50 md:h-8" />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1 xl:gap-2">
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

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            {/* A field-shaped button on wide screens, as on most D2C shops;
                it opens the full search overlay with instant results. */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 w-56 items-center gap-2.5 rounded-full border border-border-subtle bg-ink-900 px-4 text-left text-sm text-cream-400 transition-colors hover:border-border-strong md:flex xl:w-72"
            >
              <SearchIcon />
              <span className="truncate">Search moringa, teas, oils…</span>
            </button>
            <IconButton
              label="Search products, ingredients and articles"
              onClick={() => setSearchOpen(true)}
              className="md:hidden"
            >
              <SearchIcon />
            </IconButton>

            <Link
              href={isAuthenticated ? "/account" : "/login"}
              aria-label={isAuthenticated ? "Your account" : "Sign in"}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-ink-800 md:inline-flex"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3.8 17c.6-3.3 3.1-5.2 6.2-5.2s5.6 1.9 6.2 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>

            {/* Below md the theme switch lives in the mobile menu, labelled;
                five controls plus the logo overflow a 390px phone. */}
            <ThemeToggle className="hidden md:inline-flex" />

            <button
              type="button"
              onClick={open}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-ink-800"
              aria-label={`Open bag, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4 6h12l-1 11H5L4 6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M7.4 6V4.8a2.6 2.6 0 0 1 5.2 0V6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {cart.itemCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-berry-500 px-1 text-[0.62rem] font-bold tabular-nums text-white">
                  {cart.itemCount}
                </span>
              ) : null}
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
 * The offer strip. One message sits still; several rotate every few seconds,
 * pausing while hovered or focused so a shopper can actually read a code.
 */
function OfferBar({ messages }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (messages.length < 2 || paused) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      4000,
    );
    return () => window.clearInterval(id);
  }, [messages.length, paused]);
  if (!messages.length) return null;
  return (
    <div
      className="relative z-40 bg-emerald-600 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex h-9 max-w-[90rem] items-center justify-center gap-3 gutter">
        {messages.length > 1 ? (
          <button
            type="button"
            aria-label="Previous offer"
            onClick={() => setIndex((i) => (i - 1 + messages.length) % messages.length)}
            className="hidden opacity-70 transition-opacity hover:opacity-100 sm:block"
          >
            <Chevron dir="left" />
          </button>
        ) : null}
        <p
          key={index}
          className="animate-[offer-in_0.4s_ease-out] truncate text-center text-[0.78rem] font-semibold tracking-wide"
          aria-live={paused ? "polite" : "off"}
        >
          {messages[index % messages.length]}
        </p>
        {messages.length > 1 ? (
          <button
            type="button"
            aria-label="Next offer"
            onClick={() => setIndex((i) => (i + 1) % messages.length)}
            className="hidden opacity-70 transition-opacity hover:opacity-100 sm:block"
          >
            <Chevron dir="right" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
/**
 * The "Company" menu. Opens on hover for a mouse and on click for everything
 * else, and closes on Escape or a click outside, so it works by keyboard and
 * touch as well as with a pointer.
 */
function CompanyMenu({ items, pathname }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const active = items.some((item) =>
    pathname.startsWith(item.href.split("#")[0]),
  );
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
          "flex items-center gap-1 rounded-full px-3 py-2 text-[0.9rem] font-semibold transition-colors",
          active || open
            ? "text-emerald-500"
            : "text-cream-100 hover:bg-ink-800",
        )}
      >
        Company
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          className={cn("transition-transform duration-200", open && "rotate-180")}
        >
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className={cn(
          "absolute left-0 top-full z-50 w-60 pt-2 transition-all duration-200",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
        )}
      >
        <ul className="overflow-hidden rounded-2xl border border-border-subtle bg-ink p-2 shadow-[var(--mt-shadow-drawer)]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-xl px-4 py-2.5 text-[0.88rem] font-medium transition-colors",
                  pathname === item.href
                    ? "bg-forest-900 text-emerald-500"
                    : "text-cream-200 hover:bg-ink-800 hover:text-cream-50",
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
        "rounded-full px-3 py-2 text-[0.9rem] font-semibold transition-colors",
        active ? "text-emerald-500" : "text-cream-100 hover:bg-ink-800",
      )}
    >
      {children}
    </Link>
  );
}
function IconButton({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-ink-800",
        className,
      )}
    >
      {children}
    </button>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function Chevron({ dir }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M12.5 4 6.5 10l6 6" : "M7.5 4l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
