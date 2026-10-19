import { cn, whatsappLink } from "@/lib/utils";
import { Icon, RANGE_ICONS } from "@/components/services/ManufacturingIcons";
/**
 * "Premium ranges for your label" as an editorial bento grid. Each range has
 * its own soft tint and accent, the MiracleTree logo's colours muted, with
 * its icon as oversized line art, a serif name, its products as tags, and a
 * WhatsApp enquiry that names the range. The last range (powder packing)
 * runs full width in the house forest and gold.
 */
const SERIF = "font-[family-name:var(--font-serif)]";

// Soft tint [from, to] and a deeper accent per range, in RANGES order —
// the logo's colours, muted to pastels.
const TONES = [
  ["#fbefe2", "#f6dfc6", "#b4641f"], // Nutrimix — saffron
  ["#f3ecf6", "#e6d9ee", "#7a4a93"], // Milk mix — plum
  ["#f8f0e0", "#efe0c2", "#94691d"], // Nutri bars — caramel
  ["#f9eaef", "#f1d6df", "#a8345f"], // Dried fruits & vegetables — berry
  ["#e8f3f4", "#d3e8eb", "#1f7584"], // Powders & flakes — teal
  ["#f9e9e4", "#f1d5cc", "#a8432c"], // Masala — chilli
  ["#f0f2e2", "#e1e6c6", "#5e6b22"], // Millet porridges — olive
  ["#fbf3dc", "#f3e4b6", "#9a6d0c"], // Fryums — amber
  ["#f7ebe4", "#eed8cb", "#9a4f30"], // Ready to use — terracotta
  ["#e7f2ed", "#d2e7dd", "#1d6b52"], // Ready to eat — emerald
  ["#eaf3e6", "#d6e8cf", "#2f7a3c"], // Vegetable powders — leaf
  ["#0f2a1b", "#173f29", "#e7cf86"], // Powder packing — house forest
];
// Column spans on a four-column desktop grid, so every row fills.
const SPANS = [2, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 4];

export function RangeBento({ ranges, whatsapp }) {
  return (
    <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {ranges.map((range, index) => {
        const [from, to, accent] = TONES[index % TONES.length];
        const span = SPANS[index] ?? 1;
        const banner = span === 4;
        const enquire = whatsappLink(
          whatsapp,
          `Hello MiracleTree, I would like to enquire about private-label manufacturing of your ${range.name}.`,
        );
        return (
          <li
            key={range.name}
            className={cn(
              span >= 2 && "sm:col-span-2",
              span === 4 && "lg:col-span-4",
            )}
          >
            <article
              className={cn(
                "group relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-[1.75rem] p-7 shadow-[0_24px_50px_-38px_rgba(40,30,10,0.5)] transition-all duration-500 ease-[var(--ease-organic)] hover:-translate-y-1 hover:shadow-[0_32px_60px_-34px_rgba(40,30,10,0.55)] md:p-8",
                banner ? "text-[#f3ead6] md:flex-row md:items-center md:gap-12" : "text-[#23301f]",
              )}
              style={{
                "--accent": accent,
                backgroundImage: `radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,${banner ? 0.1 : 0.7}) 0%, transparent 55%), linear-gradient(150deg, ${from} 0%, ${to} 100%)`,
              }}
            >
              {/* Inset hairline and oversized line-art icon */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-2.5 rounded-[1.45rem] border",
                  banner ? "border-[#c8a24a]/35" : "border-[color-mix(in_srgb,var(--accent)_22%,transparent)]",
                )}
              />
              <Icon
                name={RANGE_ICONS[index]}
                className="pointer-events-none absolute -bottom-8 -right-8 size-52 text-[color-mix(in_srgb,var(--accent)_13%,transparent)] transition-transform duration-700 ease-[var(--ease-organic)] group-hover:-rotate-6 group-hover:scale-110"
              />

              <div className={cn("relative", banner && "md:w-[40%] md:shrink-0")}>
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-full text-[var(--accent)] ring-1",
                      banner ? "bg-white/10 ring-[#c8a24a]/50" : "bg-white/80 ring-[color-mix(in_srgb,var(--accent)_30%,transparent)]",
                    )}
                  >
                    <Icon name={RANGE_ICONS[index]} className="size-6" />
                  </span>
                  <span className={cn(SERIF, "text-[2rem] leading-none text-[color-mix(in_srgb,var(--accent)_70%,transparent)]", banner && "md:hidden")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className={cn(SERIF, "mt-5 font-medium leading-tight", span >= 2 ? "text-[1.9rem] md:text-[2.2rem]" : "text-[1.6rem]")}>
                  {range.name}
                </h3>
                <p className="mt-1.5 text-[0.92rem] italic text-[var(--accent)]">{range.note}</p>
              </div>

              <div className={cn("relative mt-6 flex flex-1 flex-col", banner && "md:mt-0")}>
                {range.items.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {range.items.map((item) => (
                      <li
                        key={item}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[0.8rem] ring-1",
                          banner ? "bg-white/[0.06] ring-[#c8a24a]/35" : "bg-white/75 ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]",
                        )}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[0.92rem] opacity-75">Varieties on request — ask us for the full list.</p>
                )}
                <a
                  href={enquire}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2 self-start pt-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] transition-opacity hover:opacity-75"
                >
                  <span className="border-b border-current pb-0.5">Enquire</span>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only">about the {range.name} on WhatsApp</span>
                </a>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
