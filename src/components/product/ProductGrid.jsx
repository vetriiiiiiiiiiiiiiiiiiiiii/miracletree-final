"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import { QuickView } from "@/components/product/QuickView";
import { initMotion, productReveal } from "@/lib/motion";
import { analytics } from "@/lib/analytics";
/**
 * A grid of product cards that reports its impressions once and staggers its
 * entrance. Kept separate from the card so the card can also be used inside
 * rails and recommendation strips without inheriting grid behaviour.
 */
export function ProductGrid({
  products,
  listName = "Product list",
  columns = 4,
  priorityCount = 0,
  className,
  headingLabel,
}) {
  const ref = useRef(null);
  const reported = useRef(false);
  const [quickViewSlug, setQuickViewSlug] = useState(null);
  useEffect(() => {
    initMotion();
    const node = ref.current;
    if (!node) return;
    const cards = [...node.querySelectorAll("[data-animate]")];
    const trigger = cards.length ? productReveal(cards, node) : undefined;
    return () => trigger?.kill();
  }, [products]);
  // Impressions fire once, and only when the grid is actually seen.
  useEffect(() => {
    const node = ref.current;
    if (!node || reported.current || !products.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || reported.current) return;
        reported.current = true;
        analytics.viewItemList(
          listName,
          products.map((p, index) => ({
            item_id: p.id,
            item_name: p.name,
            item_category: p.category?.name,
            price: p.price / 100,
            index,
          })),
        );
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [products, listName]);
  const gridColumns = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };
  return (
    <section
      ref={ref}
      className={cn(
        "grid gap-x-6 gap-y-14 md:gap-x-8",
        gridColumns[columns],
        className,
      )}
      aria-label={headingLabel}
    >
      {headingLabel ? <h2 className="sr-only">{headingLabel}</h2> : null}
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          listName={listName}
          priority={index < priorityCount}
          onQuickView={setQuickViewSlug}
        />
      ))}

      <QuickView
        slug={quickViewSlug}
        open={Boolean(quickViewSlug)}
        onClose={() => setQuickViewSlug(null)}
      />
    </section>
  );
}
