import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
/**
 * Side-by-side promo tiles — the mid-page banners every reference shop uses to
 * break up product rows. Each is a whole-tile link with an image on the right.
 */
const TONES = {
  green: "bg-emerald-600 text-white",
  berry: "bg-berry-100 text-cream-50",
  cream: "bg-ink-800 text-cream-50",
};
export function PromoTiles({ tiles }) {
  if (!tiles.length) return null;
  return (
    <section className="mx-auto max-w-[90rem] gutter py-4 md:py-6">
      <ul className="grid gap-4 md:grid-cols-2 md:gap-6">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <Link
              href={tile.href}
              className={cn(
                "group relative flex min-h-[13rem] items-center overflow-hidden rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-0.5 md:min-h-[15rem] md:p-9",
                TONES[tile.tone] ?? TONES.cream,
              )}
            >
              <div className="relative z-10 max-w-[60%]">
                {tile.eyebrow ? (
                  <p
                    className={cn(
                      "text-[0.72rem] font-bold uppercase tracking-wider",
                      tile.tone === "green" ? "text-white/80" : "text-berry-500",
                    )}
                  >
                    {tile.eyebrow}
                  </p>
                ) : null}
                <h3 className="mt-2 text-2xl font-extrabold leading-tight md:text-[1.9rem]">
                  {tile.title}
                </h3>
                {tile.body ? (
                  <p className={cn("mt-2 text-sm leading-relaxed", tile.tone === "green" ? "text-white/85" : "text-cream-300")}>
                    {tile.body}
                  </p>
                ) : null}
                <span
                  className={cn(
                    "mt-5 inline-flex h-10 items-center rounded-full px-5 text-[0.85rem] font-bold transition-colors",
                    tile.tone === "green"
                      ? "bg-white text-emerald-600 group-hover:bg-forest-900"
                      : "bg-emerald-500 text-on-accent group-hover:bg-emerald-600",
                  )}
                >
                  {tile.cta} →
                </span>
              </div>
              {tile.image ? (
                <div className="absolute -right-4 bottom-0 top-0 w-[48%]">
                  <div
                    className="absolute left-1/2 top-1/2 aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-ink-700/70"
                    aria-hidden
                  />
                  <Image
                    src={tile.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 25vw, 45vw"
                    className={cn(
                      "object-contain p-4 transition-transform duration-500 group-hover:scale-105",
                      "mix-blend-multiply dark:mix-blend-normal",
                    )}
                    unoptimized={tile.image.startsWith("/uploads/")}
                  />
                </div>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
