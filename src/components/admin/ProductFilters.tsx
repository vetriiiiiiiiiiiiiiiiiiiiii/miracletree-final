"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
] as const;

export function ProductFilters({
  categories,
  counts,
}: {
  categories: { name: string; slug: string }[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "all";
  const category = searchParams.get("category") ?? "";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams],
  );

  // Debounced so typing does not fire a query per keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (term === current) return;

    const id = window.setTimeout(() => setParam("q", term || null), 320);
    return () => window.clearTimeout(id);
  }, [term, searchParams, setParam]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 border border-border-subtle bg-white/[0.02] px-3.5 py-2">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden className="text-cream-400">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search name, slug or SKU"
          aria-label="Search products"
          className="w-52 bg-transparent text-sm text-cream-50 placeholder:text-cream-400 focus:outline-none"
        />
        {term ? (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear search"
            className="text-cream-400 hover:text-cream-100"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
        {STATUSES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setParam("status", option.value)}
            aria-pressed={status === option.value}
            className={cn(
              "border px-3.5 py-2 text-[0.66rem] uppercase tracking-[0.12em] transition-colors",
              status === option.value
                ? "border-gold-400 text-cream-50"
                : "border-border-subtle text-cream-400 hover:border-border-strong hover:text-cream-100",
            )}
          >
            {option.label}
            {counts[option.value] !== undefined ? (
              <span className="ml-1.5 tabular-nums text-cream-400">
                {counts[option.value]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-400">
        <span className="sr-only sm:not-sr-only">Category</span>
        <select
          value={category}
          onChange={(event) => setParam("category", event.target.value || null)}
          className="border border-border-subtle bg-transparent py-2 pl-3 pr-8 text-[0.66rem] uppercase tracking-[0.12em] text-cream-100 focus:border-emerald-400 focus:outline-none"
        >
          <option value="" className="bg-ink-800">
            All categories
          </option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug} className="bg-ink-800">
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
