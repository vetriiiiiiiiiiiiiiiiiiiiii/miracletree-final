import Link from "next/link";
import { cn } from "@/lib/utils";
/**
 * The top of a listing page: a tinted banner with the title and live product
 * count, then category chips — the quickest way across the range on a phone,
 * where the filter sidebar is tucked away.
 */
export function ShopHero({ title, description, total, categories, activeSlug }) {
  return (
    <div className="mt-5">
      <header className="rounded-3xl bg-gradient-to-br from-forest-800 to-forest-900 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-cream-50 md:text-[2.6rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 leading-relaxed text-cream-300">{description}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-emerald-500 shadow-sm">
            {total} {total === 1 ? "product" : "products"}
          </span>
        </div>
      </header>

      {categories?.length ? (
        <nav
          aria-label="Shop by category"
          className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Chip href="/shop" active={!activeSlug}>
            All products
          </Chip>
          {categories.map((c) => (
            <Chip key={c.slug} href={`/shop/${c.slug}`} active={c.slug === activeSlug}>
              {c.name}
              <span className={cn("ml-1.5 text-xs", c.slug === activeSlug ? "text-white/80" : "text-cream-400")}>
                {c._count.products}
              </span>
            </Chip>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
function Chip({ href, active, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-[0.85rem] font-semibold transition-colors",
        active
          ? "border-emerald-500 bg-emerald-500 text-on-accent"
          : "border-border-strong bg-ink text-cream-200 hover:border-emerald-500 hover:text-emerald-500",
      )}
    >
      {children}
    </Link>
  );
}
