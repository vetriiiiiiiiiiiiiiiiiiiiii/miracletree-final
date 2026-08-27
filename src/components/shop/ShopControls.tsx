"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerHeader } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";

export type FilterOption = { label: string; value: string; count?: number };

export type FilterGroups = {
  categories: FilterOption[];
  types: FilterOption[];
  ingredients: FilterOption[];
  collections: FilterOption[];
};

const SORTS: FilterOption[] = [
  { label: "Featured", value: "featured" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Newest", value: "newest" },
  { label: "Top rated", value: "rating" },
  { label: "Name A–Z", value: "name" },
];

const PRICE_BANDS: FilterOption[] = [
  { label: "Under ₹250", value: "0-250" },
  { label: "₹250 – ₹500", value: "250-500" },
  { label: "₹500 – ₹1000", value: "500-1000" },
  { label: "Over ₹1000", value: "1000-" },
];

/**
 * Filters live in the URL rather than in component state, so a filtered view is
 * shareable, survives a refresh, works with the back button, and can be crawled.
 */
function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
      // Any filter change resets pagination — page 4 of a new result set is
      // almost never what the shopper meant.
      params.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }, [pathname, router, searchParams]);

  return { searchParams, setParam, clearAll, pending };
}

export function ShopToolbar({
  total,
  groups,
  activeCount,
}: {
  total: number;
  groups: FilterGroups;
  activeCount: number;
}) {
  const { searchParams, setParam, clearAll } = useFilterNavigation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sort = searchParams.get("sort") ?? "featured";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
        <p className="text-sm text-cream-400" aria-live="polite">
          <span className="tabular-nums text-cream-100">{total}</span>{" "}
          {total === 1 ? "product" : "products"}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 text-[0.68rem] uppercase tracking-[0.14em] text-cream-200 transition-colors hover:border-white/30 hover:text-cream-50 lg:hidden"
          >
            Filters
            {activeCount > 0 ? (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-gold-400 text-[0.6rem] text-ink">
                {activeCount}
              </span>
            ) : null}
          </button>

          <label className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-cream-400">
            <span className="hidden sm:inline">Sort</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="border border-white/15 bg-transparent py-2 pl-3 pr-8 text-[0.68rem] uppercase tracking-[0.14em] text-cream-100 focus:border-emerald-400 focus:outline-none"
              aria-label="Sort products"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value} className="bg-ink-800">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {activeCount > 0 ? (
        <ActiveChips groups={groups} onClear={clearAll} setParam={setParam} searchParams={searchParams} />
      ) : null}

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        side="bottom"
        className="max-h-[86dvh]"
      >
        <DrawerHeader title="Filters" onClose={() => setFiltersOpen(false)} />
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ShopFilters groups={groups} />
        </div>
        <div className="border-t border-white/10 p-5">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setFiltersOpen(false)}
          >
            Show {total} {total === 1 ? "product" : "products"}
          </Button>
        </div>
      </Drawer>
    </>
  );
}

function ActiveChips({
  groups,
  searchParams,
  setParam,
  onClear,
}: {
  groups: FilterGroups;
  searchParams: URLSearchParams;
  setParam: (key: string, value: string | null) => void;
  onClear: () => void;
}) {
  const chips: { key: string; label: string }[] = [];

  const label = (options: FilterOption[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  for (const [key, options] of [
    ["category", groups.categories],
    ["type", groups.types],
    ["ingredient", groups.ingredients],
    ["collection", groups.collections],
  ] as const) {
    const value = searchParams.get(key);
    if (value) chips.push({ key, label: label(options, value) });
  }

  if (searchParams.get("availability") === "in-stock") {
    chips.push({ key: "availability", label: "In stock" });
  }
  if (searchParams.get("offers")) chips.push({ key: "offers", label: "On offer" });
  if (searchParams.get("min") || searchParams.get("max")) {
    const min = searchParams.get("min");
    const max = searchParams.get("max");
    chips.push({
      key: "price",
      label: min && max ? `₹${min}–₹${max}` : min ? `Over ₹${min}` : `Under ₹${max}`,
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => {
            if (chip.key === "price") {
              setParam("min", null);
              setParam("max", null);
            } else {
              setParam(chip.key, null);
            }
          }}
          className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs text-cream-200 transition-colors hover:border-white/40"
        >
          {chip.label}
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          <span className="sr-only">Remove filter</span>
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        className="px-2 py-1.5 text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
      >
        Clear all
      </button>
    </div>
  );
}

export function ShopFilters({ groups }: { groups: FilterGroups }) {
  const { searchParams, setParam } = useFilterNavigation();

  const activePrice = (() => {
    const min = searchParams.get("min");
    const max = searchParams.get("max");
    if (!min && !max) return null;
    return `${min ?? "0"}-${max ?? ""}`;
  })();

  return (
    <div className="grid gap-9">
      <FilterGroup
        title="Category"
        options={groups.categories}
        value={searchParams.get("category")}
        onSelect={(value) => setParam("category", value)}
      />

      <FilterGroup
        title="Price"
        options={PRICE_BANDS}
        value={activePrice}
        onSelect={(value) => {
          if (!value) {
            setParam("min", null);
            setParam("max", null);
            return;
          }
          const [min, max] = value.split("-");
          setParam("min", min && min !== "0" ? min : null);
          setParam("max", max || null);
        }}
      />

      <FilterGroup
        title="Product type"
        options={groups.types}
        value={searchParams.get("type")}
        onSelect={(value) => setParam("type", value)}
      />

      <FilterGroup
        title="Ingredient"
        options={groups.ingredients}
        value={searchParams.get("ingredient")}
        onSelect={(value) => setParam("ingredient", value)}
      />

      <FilterGroup
        title="Collection"
        options={groups.collections}
        value={searchParams.get("collection")}
        onSelect={(value) => setParam("collection", value)}
      />

      <fieldset className="grid gap-3">
        <legend className="eyebrow mb-3 text-gold-400/80">Availability</legend>
        <Toggle
          label="In stock only"
          checked={searchParams.get("availability") === "in-stock"}
          onChange={(on) => setParam("availability", on ? "in-stock" : null)}
        />
        <Toggle
          label="On offer"
          checked={Boolean(searchParams.get("offers"))}
          onChange={(on) => setParam("offers", on ? "1" : null)}
        />
      </fieldset>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: FilterOption[];
  value: string | null;
  onSelect: (value: string | null) => void;
}) {
  if (!options.length) return null;

  return (
    <fieldset>
      <legend className="eyebrow mb-4 text-gold-400/80">{title}</legend>
      <ul className="grid gap-2.5">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(active ? null : option.value)}
                className={cn(
                  "flex w-full items-baseline justify-between gap-3 text-left text-sm transition-colors",
                  active ? "text-cream-50" : "text-cream-400 hover:text-cream-200",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 border transition-colors",
                      active ? "border-gold-400 bg-gold-400" : "border-white/25",
                    )}
                    aria-hidden
                  />
                  {option.label}
                </span>
                {option.count !== undefined ? (
                  <span className="text-xs tabular-nums text-cream-400/60">{option.count}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm text-cream-300">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 border transition-colors duration-300",
          checked ? "border-emerald-400 bg-emerald-600/50" : "border-white/20 bg-white/[0.04]",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-3 w-3 -translate-y-1/2 transition-all duration-300 ease-[var(--ease-organic)]",
            checked ? "left-[1.15rem] bg-leaf-200" : "left-1 bg-cream-400",
          )}
          aria-hidden
        />
      </button>
    </label>
  );
}
