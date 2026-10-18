"use client";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
/**
 * A tabbed product shelf — "Bestsellers / New / by category" — the centrepiece
 * of most D2C homepages. Tabs with no products are left out rather than shown
 * empty. A horizontal scroller on phones, a grid from md up.
 */
export function ProductTabs({ title, subtitle, tabs, viewAllHref = "/shop" }) {
  const visible = tabs.filter((t) => t.products.length);
  const [active, setActive] = useState(visible[0]?.key);
  if (!visible.length) return null;
  const current = visible.find((t) => t.key === active) ?? visible[0];
  return (
    <section className="mx-auto max-w-[90rem] gutter py-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl text-cream-50 md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-1.5 text-cream-400">{subtitle}</p> : null}
        </div>
        <Link
          href={current.href ?? viewAllHref}
          className="text-sm font-bold text-emerald-500 underline-offset-4 hover:underline"
        >
          View all →
        </Link>
      </div>

      {visible.length > 1 ? (
        <div
          role="tablist"
          aria-label={title}
          className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === current.key}
              onClick={() => setActive(tab.key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[0.85rem] font-semibold transition-colors",
                tab.key === current.key
                  ? "border-emerald-500 bg-emerald-500 text-on-accent"
                  : "border-border-strong text-cream-200 hover:border-emerald-500 hover:text-emerald-500",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <ul
        role="tabpanel"
        className="-mx-[var(--spacing-gutter)] mt-6 flex snap-x scroll-px-[var(--spacing-gutter)] gap-3 overflow-x-auto px-[var(--spacing-gutter)] pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-3 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
      >
        {current.products.slice(0, 8).map((product, i) => (
          <li key={product.id} className="w-[80%] shrink-0 snap-start sm:w-[46%] md:w-auto">
            <ProductCard
              product={product}
              index={i}
              listName={`Home — ${current.label}`}
            />
          </li>
        ))}
      </ul>

    </section>
  );
}
