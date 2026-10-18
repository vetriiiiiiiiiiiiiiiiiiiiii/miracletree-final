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
      setHidden(y > 560 && y > lastY.current);
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
  // The links split either side of the centred logo: the first half left,
  // the rest (and Company) right.
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);
  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const renderItem = (item) => (
    <li key={item.id}>
      {item.href === "/shop" && categories.length ? (
        <ShopMenu
          label={item.label}
          active={isActive(item.href)}
          categories={categories}
          pathname={pathname}
        />
      ) : (
        <NavLink href={item.href} active={isActive(item.href)}>
          {item.label}
        </NavLink>
      )}
    </li>
  );
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
          "sticky top-0 z-[150] transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-organic)]",
          scrolled
            ? "bg-[#fbf8f1]/88 shadow-[0_10px_40px_-24px_rgba(40,30,10,0.45)] backdrop-blur-xl backdrop-saturate-150 dark:bg-ink/85"
            : "bg-[#fbf8f1] dark:bg-ink",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <div
          className={cn(
            "mx-auto grid max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-4 gutter transition-[height] duration-500 ease-[var(--ease-organic)]",
            scrolled ? "h-16 lg:h-[4.5rem]" : "h-[4.5rem] lg:h-[6.75rem]",
          )}
        >
          {/* Left: menu button on small screens, links on large ones */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-black/5 lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M3 7h16M3 11h16M3 15h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-2 xl:gap-5">{left.map(renderItem)}</ul>
            </nav>
          </div>

          {/* Centre: the logo, given the room it deserves */}
          <Link href="/" aria-label="Miracle Tree — home" className="group flex flex-col items-center">
            <Logo
              priority
              className={cn(
                "w-auto transition-[height] duration-500 ease-[var(--ease-organic)]",
                scrolled ? "h-8 lg:h-9" : "h-9 lg:h-[3.25rem]",
              )}
            />
            <span
              className={cn(
                "hidden items-center gap-2.5 overflow-hidden whitespace-nowrap text-[0.56rem] sm:flex font-semibold uppercase tracking-[0.34em] text-[#8a6d2c] transition-all duration-500 ease-[var(--ease-organic)] dark:text-gold-300 lg:text-[0.6rem]",
                scrolled ? "mt-0 max-h-0 opacity-0" : "mt-1.5 max-h-4 opacity-100",
              )}
              aria-hidden
            >
              <span className="h-px w-5 bg-gradient-to-r from-transparent to-[#c8a24a] lg:w-8" />
              Life Science · Madurai
              <span className="h-px w-5 bg-gradient-to-l from-transparent to-[#c8a24a] lg:w-8" />
            </span>
          </Link>

          {/* Right: links on large screens, then the icons */}
          <div className="flex items-center justify-end gap-1 xl:gap-4">
            <nav aria-label="More" className="hidden lg:block">
              <ul className="flex items-center gap-2 xl:gap-5">
                {right.map(renderItem)}
                {companyItems.length ? (
                  <li>
                    <Dropdown
                      label="Company"
                      align="right"
                      active={companyItems.some((i) => pathname.startsWith(i.href.split("#")[0]))}
                      pathname={pathname}
                    >
                      <ul className="w-64 rounded-2xl border border-[#e8dcc0] bg-[#fffdf8] p-2 shadow-[var(--mt-shadow-drawer)] dark:border-border-subtle dark:bg-ink">
                        {companyItems.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center justify-between rounded-xl px-4 py-2.5 text-[0.9rem] font-medium transition-colors",
                                pathname === item.href
                                  ? "bg-[#f3ead6] text-[#173f29] dark:bg-forest-900 dark:text-emerald-500"
                                  : "text-cream-200 hover:bg-[#f3ead6] hover:text-[#173f29] dark:hover:bg-forest-900 dark:hover:text-emerald-500",
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

            <span className="mx-1 hidden h-6 w-px bg-gradient-to-b from-transparent via-[#c8a24a]/60 to-transparent lg:block" aria-hidden />

            <div className="flex items-center">
              <IconButton label="Search products, ingredients and articles" onClick={() => setSearchOpen(true)}>
                <SearchIcon />
              </IconButton>
              <IconLink
                href={isAuthenticated ? "/account" : "/login"}
                label={isAuthenticated ? "Your account" : "Sign in"}
                className="hidden md:inline-flex"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M3.8 17c.6-3.3 3.1-5.2 6.2-5.2s5.6 1.9 6.2 5.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </IconLink>
              <IconLink
                href={isAuthenticated ? "/account/wishlist" : "/login?next=/account/wishlist"}
                label={`Saved products${saved ? `, ${saved}` : ""}`}
                className="hidden sm:inline-flex"
                count={saved}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 20.5s-7.5-4.7-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.4-7.5 10.1-7.5 10.1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </IconLink>
              <ThemeToggle className="hidden xl:inline-flex" />
              <button
                type="button"
                onClick={open}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-black/5 dark:hover:bg-ink-800"
                aria-label={`Open bag, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
              >
                <svg width="21" height="21" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M4 6h12l-1 11H5L4 6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M7.4 6V4.8a2.6 2.6 0 0 1 5.2 0V6" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                {cart.itemCount > 0 ? <Badge>{cart.itemCount}</Badge> : null}
              </button>
            </div>
          </div>
        </div>
        {/* A gold hairline, brightest in the middle, instead of a grey border. */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#c8a24a]/70 to-transparent" aria-hidden />
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
 * The deep forest strip above the header, with a gold hairline beneath:
 * provenance on the left, the current offer in the middle (several rotate,
 * pausing on hover or focus), quick links on the right.
 */
function UtilityBar({ messages }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (messages.length < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => window.clearInterval(id);
  }, [messages.length, paused]);
  return (
    <div
      className="relative z-40 bg-[#0f2a1b] text-[#f3ead6]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto grid h-9 max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-3 gutter">
        <p className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-[#d9bc6a] md:block">
          Est. 2009 · Madurai
        </p>
        {messages.length ? (
          <p
            key={index}
            className="col-start-2 flex animate-[offer-in_0.5s_ease-out] items-center justify-center gap-2 truncate text-[0.74rem] font-medium tracking-[0.06em]"
            aria-live={paused ? "polite" : "off"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[#d9bc6a]">
              <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="truncate">{messages[index % messages.length]}</span>
          </p>
        ) : (
          <span className="col-start-2" />
        )}
        <nav aria-label="Help" className="col-start-3 hidden justify-end text-[0.7rem] tracking-[0.08em] text-[#f3ead6]/75 md:flex">
          <Link href="/track" className="px-2.5 transition-colors hover:text-[#d9bc6a]">
            Track order
          </Link>
          <span aria-hidden className="text-[#d9bc6a]/40">·</span>
          <Link href="/contact" className="px-2.5 transition-colors hover:text-[#d9bc6a]">
            Help
          </Link>
          <span aria-hidden className="text-[#d9bc6a]/40">·</span>
          <Link href="/faq" className="pl-2.5 transition-colors hover:text-[#d9bc6a]">
            FAQs
          </Link>
        </nav>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[#c8a24a]/60 to-transparent" aria-hidden />
    </div>
  );
}
/** A top-level link in spaced small caps, with a gold rule on hover. */
function NavLink({ href, active, children, ...rest }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1 px-2.5 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] transition-colors",
        active
          ? "text-[#173f29] dark:text-leaf-200"
          : "text-cream-200 hover:text-[#173f29] dark:hover:text-leaf-200",
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
        "absolute inset-x-2.5 bottom-0 h-px origin-center bg-gradient-to-r from-[#c8a24a] to-[#e7cf86] transition-transform duration-300 ease-[var(--ease-organic)]",
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
          "group relative inline-flex items-center gap-1.5 px-2.5 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] transition-colors",
          active || open
            ? "text-[#173f29] dark:text-leaf-200"
            : "text-cream-200 hover:text-[#173f29] dark:hover:text-leaf-200",
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
          align === "left"
            ? "left-0"
            : align === "right"
              ? "right-0"
              : "left-1/2 -translate-x-1/2",
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
    <Dropdown label={label} active={active} pathname={pathname} align="left">
      <div className="w-[min(46rem,90vw)] rounded-3xl border border-[#e8dcc0] bg-[#fffdf8] p-5 shadow-[var(--mt-shadow-drawer)] dark:border-border-subtle dark:bg-ink">
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
        "inline-flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-black/5 dark:hover:bg-ink-800",
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
        "relative inline-flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-black/5 dark:hover:bg-ink-800",
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
    <span className="absolute right-0.5 top-0.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-berry-500 px-1 text-[0.62rem] font-bold tabular-nums text-white ring-2 ring-[#fbf8f1] dark:ring-ink">
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
