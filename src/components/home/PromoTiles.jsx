import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
/**
 * The pair of promo tiles between the product shelf and the brand sections,
 * in the house's luxury register: deep forest and warm ivory grounds, an
 * inset gold hairline, small-caps gold eyebrows, a serif headline, and the
 * pack in a gold-ringed medallion.
 */
const TONES = {
  forest: {
    ground: "bg-[#0f2a1b] bg-[radial-gradient(90%_120%_at_85%_50%,rgba(200,162,74,0.18)_0%,transparent_60%)] text-[#f3ead6]",
    eyebrow: "text-[#d9bc6a]",
    body: "text-[#f3ead6]/75",
    cta: "border border-[#c8a24a] text-[#e7cf86] group-hover:bg-[#c8a24a] group-hover:text-[#0f2a1b]",
  },
  ivory: {
    ground: "bg-[#f6efe2] bg-[radial-gradient(90%_120%_at_85%_50%,rgba(255,255,255,0.9)_0%,transparent_60%)] text-[#173f29] dark:bg-ink-800 dark:text-cream-50",
    eyebrow: "text-[#8a6d2c] dark:text-gold-300",
    body: "text-[#3d4a40] dark:text-cream-300",
    cta: "bg-[#173f29] text-[#f3ead6] group-hover:bg-[#0f2a1b] dark:bg-emerald-600",
  },
};
export function PromoTiles({ tiles }) {
  if (!tiles.length) return null;
  return (
    <section className="mx-auto max-w-[90rem] gutter py-6 md:py-10">
      <ul className="grid gap-5 md:grid-cols-2 md:gap-6">
        {tiles.map((tile) => {
          const tone = TONES[tile.tone] ?? TONES.ivory;
          return (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className={cn(
                  "group relative flex min-h-[15rem] items-center overflow-hidden rounded-[2rem] p-7 shadow-[0_24px_60px_-34px_rgba(40,30,10,0.55)] transition-transform duration-500 ease-[var(--ease-organic)] hover:-translate-y-1 md:min-h-[17rem] md:p-10",
                  tone.ground,
                )}
              >
                {/* Inset gold hairline. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-[#c8a24a]/35"
                />

                <div className="relative z-10 max-w-[58%]">
                  {tile.eyebrow ? (
                    <p className={cn("flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.28em]", tone.eyebrow)}>
                      <span className="h-px w-6 bg-current opacity-70" aria-hidden />
                      {tile.eyebrow}
                    </p>
                  ) : null}
                  <h3 className="mt-3 font-[family-name:var(--font-serif)] text-[1.75rem] font-medium leading-[1.12] tracking-normal md:text-[2.2rem]">
                    {tile.title}
                  </h3>
                  {tile.body ? (
                    <p className={cn("mt-3 text-[0.92rem] leading-relaxed", tone.body)}>{tile.body}</p>
                  ) : null}
                  <span
                    className={cn(
                      "mt-6 inline-flex h-11 items-center gap-2.5 rounded-full px-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
                      tone.cta,
                    )}
                  >
                    {tile.cta}
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
                      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>

                {tile.image ? (
                  <span className="absolute right-5 top-1/2 aspect-square w-[40%] max-w-[15rem] -translate-y-1/2 rounded-full bg-gradient-to-br from-[#f1dca0] via-[#b98a3a] to-[#f4e3b0] p-[3px] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.45)] md:right-9">
                    <span className="relative block h-full w-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,#fffaf0_0%,#f3e7cf_75%)]">
                      <Image
                        src={tile.image}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 240px, 40vw"
                        className="object-contain p-[14%] mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                        unoptimized={tile.image.startsWith("/uploads/")}
                      />
                    </span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
