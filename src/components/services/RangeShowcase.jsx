"use client";
import { useRef, useState } from "react";
import { cn, whatsappLink } from "@/lib/utils";
import { Icon, RANGE_ICONS } from "@/components/services/ManufacturingIcons";
/**
 * "Premium ranges for your label" as a tabbed showcase: a row of gold-ringed
 * range tabs (a swipeable strip on phones, two rows on desktop) and the
 * chosen range in a large forest panel with its products and an enquiry
 * button that opens WhatsApp about that range.
 */
const SERIF = "font-[family-name:var(--font-serif)]";

export function RangeShowcase({ ranges, whatsapp }) {
  const [active, setActive] = useState(0);
  const tabsRef = useRef([]);
  const range = ranges[active];
  const select = (index, focus) => {
    const next = (index + ranges.length) % ranges.length;
    setActive(next);
    if (focus) tabsRef.current[next]?.focus();
    tabsRef.current[next]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  };
  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") select(active + 1, true);
    else if (event.key === "ArrowLeft") select(active - 1, true);
    else if (event.key === "Home") select(0, true);
    else if (event.key === "End") select(ranges.length - 1, true);
    else return;
    event.preventDefault();
  };
  const enquire = whatsappLink(
    whatsapp,
    `Hello MiracleTree, I would like to enquire about private-label manufacturing of your ${range.name}.`,
  );
  return (
    <div className="mt-12">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Product ranges"
        onKeyDown={onKeyDown}
        className="-mx-[var(--spacing-gutter)] flex snap-x gap-3 overflow-x-auto px-[var(--spacing-gutter)] pb-6 pt-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {ranges.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.name}
              ref={(el) => (tabsRef.current[index] = el)}
              type="button"
              role="tab"
              id={`range-tab-${index}`}
              aria-selected={selected}
              aria-controls="range-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              className={cn(
                "group flex w-[7.5rem] shrink-0 snap-center flex-col items-center gap-2.5 rounded-2xl px-2 py-4 text-center transition-all duration-300 lg:w-auto",
                selected
                  ? "bg-[#0f2a1b] text-[#f3ead6] shadow-[0_18px_40px_-22px_rgba(15,42,27,0.9)]"
                  : "bg-white/70 text-[#173f29] hover:-translate-y-0.5 hover:bg-white dark:bg-ink-800 dark:text-cream-100",
              )}
            >
              <span
                className={cn(
                  "rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105",
                  selected
                    ? "bg-gradient-to-br from-[#f1dca0] via-[#b98a3a] to-[#f4e3b0]"
                    : "bg-[#e3d3a8] dark:bg-border-strong",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full",
                    selected ? "bg-[#12301f] text-[#e7cf86]" : "bg-[#fffaf0] text-[#8a6d2c] dark:bg-ink dark:text-gold-300",
                  )}
                >
                  <Icon name={RANGE_ICONS[index]} className="size-5" />
                </span>
              </span>
              <span className="text-[0.74rem] font-semibold leading-tight">{item.name.replace(/ Range$/, "")}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        id="range-panel"
        role="tabpanel"
        aria-labelledby={`range-tab-${active}`}
        className="relative mt-2 overflow-hidden rounded-[2rem] lg:mt-4 bg-[#0f2a1b] bg-[radial-gradient(70%_120%_at_100%_0%,rgba(200,162,74,0.22)_0%,transparent_55%),linear-gradient(160deg,#0f2a1b_0%,#173f29_100%)] p-7 text-[#f3ead6] shadow-[0_40px_80px_-50px_rgba(15,42,27,0.9)] md:p-12"
      >
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-[#c8a24a]/35" />
        {/* Oversized watermark icon */}
        <Icon
          name={RANGE_ICONS[active]}
          className="pointer-events-none absolute -bottom-10 -right-6 size-64 text-[#c8a24a]/[0.07] md:size-80"
        />
        <div key={range.name} className="relative animate-[offer-in_500ms_var(--ease-organic)_both]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#d9bc6a]">
                <span className="h-px w-8 bg-current opacity-60" aria-hidden />
                {String(active + 1).padStart(2, "0")} / {String(ranges.length).padStart(2, "0")}
              </p>
              <h3 className={cn(SERIF, "mt-4 text-[2.1rem] font-medium leading-tight md:text-[3rem]")}>{range.name}</h3>
              <p className="mt-2 italic text-[#e7cf86]">{range.note}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => select(active - 1)}
                aria-label="Previous range"
                className="flex size-11 items-center justify-center rounded-full border border-[#c8a24a]/50 text-[#e7cf86] transition-colors hover:bg-[#c8a24a] hover:text-[#0f2a1b]"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M16 10H4M9 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => select(active + 1)}
                aria-label="Next range"
                className="flex size-11 items-center justify-center rounded-full border border-[#c8a24a]/50 text-[#e7cf86] transition-colors hover:bg-[#c8a24a] hover:text-[#0f2a1b]"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <span aria-hidden className="mt-7 block h-px bg-gradient-to-r from-[#c8a24a]/70 via-[#c8a24a]/25 to-transparent" />

          {range.items.length ? (
            <ul className="mt-7 grid gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {range.items.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[0.98rem]">
                  <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-[#c8a24a]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-7 text-[#f3ead6]/75">Varieties on request — ask us for the full list.</p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={enquire}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-[#c8a24a] px-6 text-[0.72rem] font-semibold uppercase tracking-[0.12em] sm:px-7 sm:text-[0.78rem] sm:tracking-[0.16em] text-[#0f2a1b] shadow-[0_12px_30px_-14px_rgba(200,162,74,0.8)] transition-colors hover:bg-[#d9bc6a]"
            >
              Enquire about this range
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <span className="text-sm text-[#f3ead6]/60">
              {range.items.length ? `${range.items.length} products · ` : ""}Your label, 10 g – 10 kg packs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
