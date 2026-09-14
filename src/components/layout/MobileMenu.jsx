"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Logo } from "@/components/layout/Logo";
import { ThemeSegmented } from "@/components/theme/ThemeToggle";
import { SITE } from "@/lib/constants";
import { gsap, prefersReducedMotion } from "@/lib/motion";
/**
 * Full-screen mobile navigation. Links stagger in on open — the one place a
 * full-screen transition earns its keep, because the panel replaces the page
 * entirely and needs a beat to establish itself.
 */
export function MobileMenu({
  open,
  onClose,
  items,
  companyItems,
  categories,
  isAuthenticated,
  onSearch,
}) {
  const listRef = useRef(null);
  useEffect(() => {
    if (!open || prefersReducedMotion()) return;
    const targets = listRef.current?.querySelectorAll("[data-menu-item]");
    if (!targets?.length) return;
    const tween = gsap.fromTo(
      targets,
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.045,
        ease: "power3.out",
        delay: 0.12,
      },
    );
    return () => {
      tween.kill();
    };
  }, [open]);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Menu"
      side="top"
      className="h-[100dvh]"
    >
      <div className="flex h-16 items-center justify-between border-b border-border-subtle px-5">
        <Logo className="h-7 w-auto" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-2 p-2 text-cream-300 hover:text-cream-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-8">
        <button
          type="button"
          onClick={onSearch}
          data-menu-item
          className="mb-8 flex w-full items-center gap-3 border border-border-subtle bg-white/[0.03] px-4 py-3.5 text-left text-sm text-cream-400"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          Search products, ingredients, articles
        </button>

        <nav aria-label="Mobile primary">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.id} data-menu-item>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block py-3 text-[1.9rem] leading-tight text-cream-50"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {companyItems.length ? (
          <div className="mt-10 border-t border-border-subtle pt-8" data-menu-item>
            <p className="eyebrow mb-4 text-cream-400">Company</p>
            <ul className="grid gap-3">
              {companyItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="inline-block py-1 text-cream-200 hover:text-cream-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 border-t border-border-subtle pt-8" data-menu-item>
          <p className="eyebrow mb-4 text-cream-400">Shop by category</p>
          <ul className="grid gap-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/shop/${category.slug}`}
                  onClick={onClose}
                  className="flex items-baseline justify-between gap-4 text-cream-200 hover:text-cream-50"
                >
                  <span>{category.name}</span>
                  <span className="text-xs tabular-nums text-cream-400">
                    {category.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="mt-10 grid gap-3 border-t border-border-subtle pt-8"
          data-menu-item
        >
          <Link
            href={isAuthenticated ? "/account" : "/login"}
            onClick={onClose}
            className="inline-block py-1 text-cream-200 hover:text-cream-50"
          >
            {isAuthenticated ? "Your account" : "Sign in"}
          </Link>
          <Link
            href="/faq"
            onClick={onClose}
            className="inline-block py-1 text-cream-200 hover:text-cream-50"
          >
            Help &amp; FAQ
          </Link>
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="text-cream-200">
            {SITE.phone}
          </a>
          <p className="text-xs text-cream-400">{SITE.phoneHours}</p>
        </div>

        {/* The header's one-tap toggle has no room to explain itself. Here it
            does, including the "System" setting that follows the device. */}
        <div className="mt-10 border-t border-border-subtle pt-8" data-menu-item>
          <p className="eyebrow mb-4 text-cream-400">Theme</p>
          <ThemeSegmented />
        </div>
      </div>
    </Drawer>
  );
}
