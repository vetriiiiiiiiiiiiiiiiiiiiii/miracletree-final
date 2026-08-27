import { cn } from "@/lib/utils";

/**
 * Stars render as a single accessible value. Partial fills use a clipped
 * overlay rather than half-star glyphs, so 4.3 looks like 4.3.
 */
export function Rating({
  value,
  count,
  size = "sm",
  showCount = true,
  className,
}: {
  value: number | null;
  count?: number;
  size?: "xs" | "sm" | "md";
  showCount?: boolean;
  className?: string;
}) {
  const dimensions = { xs: 11, sm: 13, md: 17 }[size];

  if (value === null || !count) {
    return showCount ? (
      <span className={cn("text-xs text-cream-400", className)}>No reviews yet</span>
    ) : null;
  }

  const percent = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="img"
      aria-label={`Rated ${value} out of 5 from ${count} review${count === 1 ? "" : "s"}`}
    >
      <span className="relative inline-flex" aria-hidden>
        <Stars size={dimensions} className="text-white/18" />
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          <Stars size={dimensions} className="text-gold-400" />
        </span>
      </span>
      {showCount ? (
        <span className="text-xs tabular-nums text-cream-400">
          {value.toFixed(1)} ({count})
        </span>
      ) : null}
    </span>
  );
}

function Stars({ size, className }: { size: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="shrink-0"
        >
          <path d="M12 2.2l2.9 6.26 6.85.79-5.06 4.67 1.36 6.75L12 17.3l-6.05 3.37 1.36-6.75L2.25 9.25l6.85-.79L12 2.2z" />
        </svg>
      ))}
    </span>
  );
}

/** Interactive star picker for the review form. */
export function RatingInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="flex items-center gap-1">
      <legend className="sr-only">Your rating</legend>
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className="cursor-pointer p-1 text-white/20 transition-colors has-[:checked]:text-gold-400 hover:text-gold-300"
          data-rating={star <= value ? "on" : "off"}
          style={{ color: star <= value ? "var(--color-gold-400)" : undefined }}
        >
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            className="sr-only"
          />
          <span className="sr-only">{star} star{star === 1 ? "" : "s"}</span>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.2l2.9 6.26 6.85.79-5.06 4.67 1.36 6.75L12 17.3l-6.05 3.37 1.36-6.75L2.25 9.25l6.85-.79L12 2.2z" />
          </svg>
        </label>
      ))}
    </fieldset>
  );
}
