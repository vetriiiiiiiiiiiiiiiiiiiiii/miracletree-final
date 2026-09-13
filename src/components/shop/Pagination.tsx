"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Real links rather than buttons, so pages are crawlable, middle-clickable and
 * work without JavaScript. Long ranges collapse around the current page.
 */
export function Pagination({
  page,
  pages,
  total,
  pageSize,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex flex-col items-center gap-5 border-t border-border-subtle pt-8"
    >
      <p className="text-xs tabular-nums text-cream-400">
        Showing {from}–{to} of {total}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <PageLink href={href(page - 1)} disabled={page === 1} label="Previous page">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </PageLink>
        </li>

        {pageRange(page, pages).map((entry, index) =>
          entry === "…" ? (
            <li key={`gap-${index}`} className="px-2 text-cream-400" aria-hidden>
              …
            </li>
          ) : (
            <li key={entry}>
              <PageLink href={href(entry)} active={entry === page} label={`Page ${entry}`}>
                <span className="tabular-nums">{entry}</span>
              </PageLink>
            </li>
          ),
        )}

        <li>
          <PageLink href={href(page + 1)} disabled={page === pages} label="Next page">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </PageLink>
        </li>
      </ul>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  label,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const classes = cn(
    "grid h-9 min-w-9 place-items-center px-2 text-sm transition-colors",
    active
      ? "border border-gold-400 text-cream-50"
      : "border border-transparent text-cream-400 hover:border-border-strong hover:text-cream-100",
    disabled && "pointer-events-none opacity-30",
  );

  if (disabled) {
    return (
      <span className={classes} aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      scroll
      className={classes}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

/** 1 … 4 [5] 6 … 20 */
function pageRange(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const range: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  if (start > 2) range.push("…");
  for (let i = start; i <= end; i++) range.push(i);
  if (end < pages - 1) range.push("…");

  range.push(pages);
  return range;
}
