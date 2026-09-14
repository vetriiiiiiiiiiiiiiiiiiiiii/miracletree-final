"use client";
import { ShopFilters, ShopToolbar } from "@/components/shop/ShopControls";
/**
 * Client wrappers around the filter UI. Split from the page so the shop route
 * itself stays a Server Component and only the interactive controls ship JS.
 */
export function ShopControls({ groups, total, activeCount }) {
  return <ShopToolbar total={total} groups={groups} activeCount={activeCount} />;
}
export function ShopSidebar({ groups }) {
  return (
    <aside className="hidden lg:block" aria-label="Product filters">
      <div className="sticky top-28 max-h-[calc(100svh-9rem)] overflow-y-auto pr-2 [scrollbar-width:thin]">
        <ShopFilters groups={groups} />
      </div>
    </aside>
  );
}
