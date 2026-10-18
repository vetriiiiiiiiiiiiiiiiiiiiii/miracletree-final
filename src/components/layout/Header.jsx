"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { useWishlistCount } from "@/components/product/WishlistButton";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
/**
 * The storefront header.
 *
 * A deep green utility bar (rotating offers, quick links), then the main bar:
 * the logo with its "Life Science · Madurai" line, the primary links — Shop
 * opens a mega menu of category tiles — a search field, and account,
 * wishlist and bag. Once the page scrolls the bar turns to frosted glass and
 * slims down; it hides on a downward scroll past the fold and returns on the
 * way up, so long pages get their height back.
 */
export function Header({
  items,
  companyItems,
  categories = [],
  isAuthenticated,
  announcements = [],
}) {
  const pathname = usePathname();
  const { cart, open } = useCart();
  const saved = useWishlistCount();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 520 && y > lastY.current);
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
        className="sr-only z-[400] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-full focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* In normal flow, never conditional: it scrolls away while the header
          stays, and document height stays constant. */}
      <UtilityBar messages={announcements} />

      <header
        className={cn(
          "sticky top-0 z-[150] border-b transition-[transform,background-color,box-shadow,border-color] duration-300 ease-[var(--ease-organic)]",
          scrolled
            ? "border-border-subtle bg-ink/85 shadow-[0_8px_30px_-18px_rgba(17,32,22,0.35)] backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-ink",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[90rem] items-center gap-3 gutter transition-[height] duration-300 lg:gap-6",
            scrolled ? "h-16 md:h-[4.25rem]" : "h-16 md:h-[5.25rem]",
          )}
        >
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

          <Link href="/" aria-label="Miracle Tree — home" className="group flex shrink-0 items-center">
            <span className="flex flex-col">
              <Logo className={cn("w-auto text-cream-50 transition-[height] duration-300", scrolled ? "h-7 md:h-8" : "h-7 md:h-9")} priority />
              <span className="ml-[2.1rem] mt-0.5 hidden md:ml-[2.55rem] text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-cream-400 sm:block">
                Life Science · Madurai
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-1 xl:gap-3">
              {items.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.id}>
                    {item.href === "/shop" && categories.length ? (
                      <ShopMenu label={item.label} active={active} categories={categories} pathname={pathname} />
                    ) : (
                      <NavLink href={item.href} active={active}>
                        {item.label}
                      </NavLink>
                    )}
                  </li>
                );
              })}
              {companyItems.length ? (
                <li>
                  <Dropdown
                    label="Company"
                    active={companyItems.some((i) => pathname.startsWith(i.href.split("#")[0]))}
                    pathname={pathname}
                  >
                    <ul className="w-64 rounded-2xl border border-border-subtle bg-ink p-2 shadow-[var(--mt-shadow-drawer)]">
                      {companyItems.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between rounded-xl px-4 py-2.5 text-[0.9rem] font-medium transition-colors",
                              pathname === item.href
                                ? "bg-forest-900 text-emerald-600"
                                : "text-cream-200 hover:bg-forest-900 hover:text-emerald-600",
                            )}
                          >
                            {item.label}
                            <Arrow className="h-3.5 w-3.5 opacity-40" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Dropdown>
                </li>
              ) : null}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-0.5 md:gap-1.5 lg:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group hidden h-11 w-60 items-center gap-2.5 rounded-full border border-border-subtle bg-ink-900 pl-4 pr-2 text-left text-sm text-cream-400 transition-colors hover:border-emerald-500/50 hover:bg-ink md:flex xl:w-72"
            >
              <SearchIcon />
              <span className="flex-1 truncate">Search moringa, teas, oils…</span>
              <kbd className="hidden rounded-md border border-border-subtle bg-ink px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold text-cream-400 xl:inline">
                ⌘K
              </kbd>
            </button>
            <IconButton label="Search products, ingredients and articles" onClick={() => setSearchOpen(true)} className="md:hidden">
              <SearchIcon />
            </IconButton>

            <IconLink
              href={isAuthenticated ? "/account" : "/login"}
              label={isAuthenticated ? "Your account" : "Sign in"}
              className="hidden md:inline-flex"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3.8 17c.6-3.3 3.1-5.2 6.2-5.2s5.6 1.9 6.2 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </IconLink>

            <IconLink
              href={isAuthenticated ? "/account/wishlist" : "/login?next=/account/wishlist"}
              label={`Saved products${saved ? `, ${saved}` : ""}`}
              className="hidden sm:inline-flex"
              count={saved}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 20.5s-7.5-4.7-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.4-7.5 10.1-7.5 10.1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </IconLink>

            {/* Below md the theme switch lives in the mobile menu, labelled. */}
            <ThemeToggle className="hidden md:inline-flex" />

            <button
              type="button"
              onClick={open}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-ink-800"
              aria-label={`Open bag, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
            >
              <svg width="21" height="21" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4 6h12l-1 11H5L4 6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M7.4 6V4.8a2.6 2.6 0 0 1 5.2 0V6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {cart.itemCount > 0 ? <Badge>{cart.itemCount}</Badge> : null}
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
 * The deep green strip above the header: a truck and the current offer in
 * the middle (several rotate, pausing on hover or focus), quick links on the
 * right from md up.
 */
function UtilityBar({ messages }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (messages.length < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => window.clearInterval(id);
  }, [messages.length, paused]);
  return (
    <div
      className="relative z-40 bg-gradient-to-r from-[#0d3a22] via-[#14512f] to-[#0d3a22] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto grid h-9 max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-3 gutter">
        <span aria-hidden />
        {messages.length ? (
          <p
            key={index}
            className="flex animate-[offer-in_0.4s_ease-out] items-center justify-center gap-2 truncate text-[0.78rem] font-semibold tracking-wide"
            aria-live={paused ? "polite" : "off"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 opacity-90">
              <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="truncate">{messages[index % messages.length]}</span>
          </p>
        ) : (
          <span />
        )}
        <nav aria-label="Help" className="hidden justify-end text-[0.75rem] text-white/80 md:flex">
          <Link href="/track" className="px-2 transition-colors hover:text-white">
            Track order
          </Link>
          <span aria-hidden className="text-white/30">|</span>
          <Link href="/contact" className="px-2 transition-colors hover:text-white">
            Help
          </Link>
          <span aria-hidden className="text-white/30">|</span>
          <Link href="/faq" className="pl-2 transition-colors hover:text-white">
            FAQs
          </Link>
        </nav>
      </div>
    </div>
  );
}
/** A top-level link with a gold underline that draws in on hover. */
function NavLink({ href, active, children, ...rest }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1 px-3 py-2 text-[0.95rem] font-semibold transition-colors",
        active ? "text-emerald-600" : "text-cream-100 hover:text-emerald-600",
      )}
      {...rest}
    >
      {children}
      <Underline active={active} />
    </Link>
  );
}
function Underline({ active }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-x-3 -bottom-0.5 h-[2px] origin-left rounded-full bg-gradient-to-r from-[#c8a24a] to-[#e7cf86] transition-transform duration-300 ease-[var(--ease-organic)]",
        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
      )}
    />
  );
}
/**
 * A hover/click dropdown: opens on hover for a mouse and on click for
 * keyboard and touch, closes on Escape, a click outside, or navigation.
 */
function Dropdown({ label, active, pathname, align = "left", children }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
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
          "group relative inline-flex items-center gap-1 px-3 py-2 text-[0.95rem] font-semibold transition-colors",
          active || open ? "text-emerald-600" : "text-cream-100 hover:text-emerald-600",
        )}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className={cn("transition-transform duration-200", open && "rotate-180")}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <Underline active={active} />
      </button>
      <div
        className={cn(
          "absolute top-full z-50 pt-3 transition-all duration-200",
          align === "left" ? "left-0" : "left-1/2 -translate-x-1/2",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}
/** Shop: a mega menu of category tiles with a "shop all" card. */
function ShopMenu({ label, active, categories, pathname }) {
  return (
    <Dropdown label={label} active={active} pathname={pathname} align="center">
      <div className="w-[min(46rem,90vw)] rounded-3xl border border-border-subtle bg-ink p-5 shadow-[var(--mt-shadow-drawer)]">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="font-[family-name:var(--font-serif)] text-xl text-cream-50">Shop by category</p>
          <Link href="/shop" className="text-sm font-semibold text-emerald-600 hover:underline">
            View all products →
          </Link>
        </div>
        <ul className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/shop/${c.slug}`}
                className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-forest-900"
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#f1dca0] via-[#b98a3a] to-[#f4e3b0] p-[2px]">
                  <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#f8f1e3]">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1.5 mix-blend-multiply"
                        unoptimized={c.image.startsWith("/uploads/")}
                      />
                    ) : null}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.92rem] font-semibold leading-snug text-cream-50 group-hover:text-emerald-600">
                    {c.name}
                  </span>
                  <span className="block text-xs text-cream-400">
                    {c.count} {c.count === 1 ? "product" : "products"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/shop"
              className="flex h-full items-center gap-3 rounded-2xl bg-emerald-600 p-3 text-white transition-colors hover:bg-emerald-500"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <span className="block text-[0.92rem] font-bold">Shop all</span>
                <span className="block text-xs text-white/80">The complete range</span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </Dropdown>
  );
}
function IconButton({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-ink-800",
        className,
      )}
    >
      {children}
    </button>
  );
}
function IconLink({ href, label, className, count = 0, children }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-ink-800",
        className,
      )}
    >
      {children}
      {count > 0 ? <Badge>{count}</Badge> : null}
    </Link>
  );
}
function Badge({ children }) {
  return (
    <span className="absolute right-0.5 top-0.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-berry-500 px-1 text-[0.62rem] font-bold tabular-nums text-white ring-2 ring-ink">
      {children}
    </span>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function Arrow({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className}>
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
