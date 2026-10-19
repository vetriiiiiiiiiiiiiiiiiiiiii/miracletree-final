import { cn, whatsappLink } from "@/lib/utils";
import { Icon, RANGE_ICONS } from "@/components/services/ManufacturingIcons";
/**
 * "Premium ranges for your label" as an editorial bento grid. Each range has
 * its own jewel tone, drawn from the colours of the MiracleTree logo, with
 * its icon as oversized line art, a serif name, its products as tags, and a
 * WhatsApp enquiry that names the range. The last range (powder packing)
 * runs full width in the house forest and gold.
 */
const SERIF = "font-[family-name:var(--font-serif)]";

// [from, to] per range, in RANGES order.
const TONES = [
  ["#9c4512", "#e0862c"], // Nutrimix — saffron
  ["#4b2160", "#8e44ad"], // Milk mix — plum
  ["#7a4d0e", "#c8962a"], // Nutri bars — caramel
  ["#7d1840", "#d6246e"], // Dried fruits & vegetables — berry
  ["#0c4f5a", "#1aa0b8"], // Powders & flakes — teal
  ["#7e1f15", "#cf4a2a"], // Masala — chilli
  ["#44511a", "#86992e"], // Millet porridges — olive
  ["#8f5a08", "#e0a51e"], // Fryums — amber
  ["#7a321d", "#c0603a"], // Ready to use — terracotta
  ["#0b4a3b", "#1f8a66"], // Ready to eat — emerald
  ["#1c5229", "#3aa04a"], // Vegetable powders — leaf
  ["#0f2a1b", "#173f29"], // Powder packing — house forest
];
// Column spans on a four-column desktop grid, so every row fills.
const SPANS = [2, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 4];

export function RangeBento({ ranges, whatsapp }) {
  return (
    <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {ranges.map((range, index) => {
        const [from, to] = TONES[index % TONES.length];
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
                "group relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-[1.75rem] p-7 text-white shadow-[0_28px_60px_-34px_rgba(30,20,10,0.75)] transition-all duration-500 ease-[var(--ease-organic)] hover:-translate-y-1 hover:shadow-[0_36px_70px_-30px_rgba(30,20,10,0.8)] md:p-8",
                banner && "md:flex-row md:items-center md:gap-12",
              )}
              style={{
                backgroundImage: `radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.18) 0%, transparent 55%), linear-gradient(150deg, ${from} 0%, ${to} 100%)`,
              }}
            >
              {/* Inset hairline and oversized line-art icon */}
              <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[1.45rem] border border-white/20" />
              <Icon
                name={RANGE_ICONS[index]}
                className="pointer-events-none absolute -bottom-8 -right-8 size-52 text-white/[0.12] transition-transform duration-700 ease-[var(--ease-organic)] group-hover:-rotate-6 group-hover:scale-110"
              />

              <div className={cn("relative", banner && "md:w-[40%] md:shrink-0")}>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
                    <Icon name={RANGE_ICONS[index]} className="size-6" />
                  </span>
                  <span className={cn(SERIF, "text-[2rem] leading-none text-[#f4e3b0]/80", banner && "md:hidden")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className={cn(SERIF, "mt-5 font-medium leading-tight", span >= 2 ? "text-[1.9rem] md:text-[2.2rem]" : "text-[1.6rem]")}>
                  {range.name}
                </h3>
                <p className="mt-1.5 text-[0.92rem] italic text-[#f4e3b0]">{range.note}</p>
              </div>

              <div className={cn("relative mt-6 flex flex-1 flex-col", banner && "md:mt-0")}>
                {range.items.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {range.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full bg-white/[0.14] px-3 py-1.5 text-[0.8rem] ring-1 ring-white/20 backdrop-blur-sm"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[0.92rem] text-white/80">Varieties on request — ask us for the full list.</p>
                )}
                <a
                  href={enquire}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2 self-start pt-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#f4e3b0] transition-colors hover:text-white"
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
