import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The visible counterpart to the BreadcrumbList structured data. Both are
 * generated from the same array at the page level so they cannot disagree.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: { name: string; path: string }[];
  className?: string;
}) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn(className)}>
      <ol className="flex flex-wrap items-center gap-2 text-[0.66rem] uppercase tracking-[0.14em] text-cream-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-cream-200" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                  href={item.path}
                  className="inline-block py-1.5 transition-colors hover:text-cream-100"
                >
                    {item.name}
                  </Link>
                  <span aria-hidden className="text-border-strong">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
