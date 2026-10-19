import { cn } from "@/lib/utils";
/** Five stars, filled to the nearest half. */
export function Stars({ value, size = 16, className }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, Math.round((value - (n - 1)) * 2) / 2));
        return (
          <svg key={n} width={size} height={size} viewBox="0 0 20 20" aria-hidden className="text-ink-600">
            <defs>
              <linearGradient id={`star-${n}-${fill}`}>
                <stop offset={fill} stopColor="#f5a623" />
                <stop offset={fill} stopColor="currentColor" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"
              fill={`url(#star-${n}-${fill})`}
            />
          </svg>
        );
      })}
    </span>
  );
}
