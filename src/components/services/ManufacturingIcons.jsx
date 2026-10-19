import { cn } from "@/lib/utils";
/**
 * Line icons and the gold-ringed medallion used on the third-party
 * manufacturing page — shared by the page and its interactive range showcase.
 */
/** Line icons for the gold medallions, keyed by range and strength. */
export const ICONS = {
  bowl: "M4 11h16a8 8 0 0 1-16 0zM8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3",
  cup: "M5 8h11v6a5 5 0 0 1-10 0V8zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4c0 1 1 1.5 1 2.5M12 4c0 1 1 1.5 1 2.5",
  bar: "M3 9l12-5 6 3-12 5zM3 9v6l6 3 12-5V7M9 12v6",
  fruit: "M12 7c-4-2-8 1-7 6 1 4 4 7 7 6 3 1 6-2 7-6 1-5-3-8-7-6zM12 7c0-2 1-3 3-4",
  leaf: "M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l9-9",
  spice: "M7 21h10M9 21l-2-9h10l-2 9M12 12V8M10 5c1 1 3 1 4 0",
  grain: "M12 21V9M12 9c-3 0-4-3-4-5 2 0 4 1 4 5zM12 9c3 0 4-3 4-5-2 0-4 1-4 5zM12 14c-3 0-4-3-4-5 2 0 4 1 4 5zM12 14c3 0 4-3 4-5-2 0-4 1-4 5z",
  crisp: "M4 14c3-6 13-6 16 0-3 3-13 3-16 0zM8 12l1 2M12 11v3M16 12l-1 2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  plate: "M3 13h18M5 13a7 7 0 0 0 14 0M12 6v2M9 9h6",
  gourd: "M12 4c0 2 2 3 2 5 3 1 4 4 4 6a6 6 0 0 1-12 0c0-2 1-5 4-6 0-2 2-3 2-5z",
  box: "M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9",
  scale: "M12 3v18M5 21h14M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0zM6 7h12",
  truck: "M2 6h12v10H2zM14 10h4l3 3v3h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};
export const RANGE_ICONS = ["bowl", "cup", "bar", "fruit", "leaf", "spice", "grain", "crisp", "clock", "plate", "gourd", "box"];
export const DIFFERENCE_ICONS = ["sun", "flask", "scale", "truck"];

export function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d={ICONS[name] ?? ICONS.leaf} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A gold-ringed medallion holding a line icon. */
export function Medallion({ icon, dark }) {
  return (
    <span className="inline-block shrink-0 rounded-full bg-gradient-to-br from-[#f1dca0] via-[#b98a3a] to-[#f4e3b0] p-[2px] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]">
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          dark ? "bg-[#12301f] text-[#e7cf86]" : "bg-[#fffaf0] text-[#8a6d2c] dark:bg-ink dark:text-gold-300",
        )}
      >
        <Icon name={icon} className="size-6" />
      </span>
    </span>
  );
}

