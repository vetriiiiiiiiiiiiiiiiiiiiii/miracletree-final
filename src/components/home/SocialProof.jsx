import Link from "next/link";
import { cn } from "@/lib/utils";
/**
 * Customer reviews, drawn entirely from real submissions: approved reviews
 * first, brand testimonials after. Nothing is seeded or synthesised — with no
 * reviews at all the section says so honestly instead of showing filler.
 */
export function SocialProof({ title, subtitle, items }) {
  const rated = items.filter((i) => i.rating);
  const average = rated.length
    ? rated.reduce((s, i) => s + i.rating, 0) / rated.length
    : null;
  return (
    <section id="reviews" className="py-12 md:py-16">
      <div className="mx-auto max-w-[90rem] gutter">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl text-cream-50 md:text-3xl">{title}</h2>
            {subtitle ? <p className="mt-1.5 text-cream-400">{subtitle}</p> : null}
          </div>
          {average ? (
            <p className="flex items-center gap-2 rounded-full bg-forest-900 px-4 py-2 text-sm font-semibold text-cream-100">
              <Stars value={average} />
              {average.toFixed(1)} from {rated.length} review{rated.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border-strong p-8 text-center">
            <p className="text-cream-300">
              Reviews from verified customers will appear here once approved.
            </p>
            <Link href="/shop" className="mt-4 inline-block font-bold text-emerald-500 underline underline-offset-4">
              Browse the collection
            </Link>
          </div>
        ) : (
          <ul className="-mx-[var(--spacing-gutter)] mt-8 flex snap-x gap-4 overflow-x-auto px-[var(--spacing-gutter)] pb-3 [scrollbar-width:thin] md:gap-5">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex w-[82%] shrink-0 snap-start flex-col rounded-3xl border border-border-subtle bg-ink p-6 shadow-[var(--mt-shadow-card)] sm:w-[22rem]"
              >
                {item.rating ? <Stars value={item.rating} /> : null}
                <p className="mt-3 line-clamp-6 flex-1 text-[0.95rem] leading-relaxed text-cream-200">
                  “{item.body}”
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-border-subtle pt-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-on-accent">
                    {initials(item.authorName)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-cream-50">
                      {item.authorName}
                      {item.isVerified ? (
                        <span className="rounded-full bg-forest-900 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-500">
                          Verified buyer
                        </span>
                      ) : null}
                    </p>
                    {item.product ? (
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="block truncate text-xs text-cream-400 hover:text-emerald-500"
                      >
                        on {item.product.name}
                      </Link>
                    ) : item.location ? (
                      <p className="truncate text-xs text-cream-400">{item.location}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "★"
  );
}
function Stars({ value }) {
  const full = Math.round(value);
  return (
    <span className="flex gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="16"
          height="16"
          viewBox="0 0 20 20"
          aria-hidden
          className={cn(n <= full ? "text-[#f5a623]" : "text-ink-600")}
          fill="currentColor"
        >
          <path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" />
        </svg>
      ))}
    </span>
  );
}
