import { cn } from "@/lib/utils";

/**
 * Wordmark with a moringa leaf-pair mark. Drawn rather than raster so it stays
 * crisp, inherits `currentColor`, and costs nothing to load.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 208 32"
      fill="none"
      className={cn("text-cream-50", className)}
      role="img"
      aria-label="Miracle Tree"
    >
      {/* Leaf pair on a stem */}
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M16 29V7" />
        <path
          d="M16 16c0-5-3.6-8.4-8.6-8.6C7.2 12.4 10.8 16 16 16z"
          fill="currentColor"
          fillOpacity="0.14"
        />
        <path
          d="M16 12c0-5 3.6-8.4 8.6-8.6C24.8 8.4 21.2 12 16 12z"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </g>

      <text
        x="38"
        y="15.5"
        fill="currentColor"
        fontFamily="var(--font-fraunces), Georgia, serif"
        fontSize="15"
        letterSpacing="0.02em"
      >
        Miracle Tree
      </text>
      <text
        x="38.5"
        y="27"
        fill="currentColor"
        fillOpacity="0.55"
        fontFamily="var(--font-inter), system-ui, sans-serif"
        fontSize="6.2"
        letterSpacing="0.34em"
      >
        LIFE SCIENCE
      </text>
    </svg>
  );
}
