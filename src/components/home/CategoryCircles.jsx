import Image from "next/image";
import Link from "next/link";
/**
 * "Shop by category": large gold-ringed circles on a warm cream band, each
 * with a small icon badge and the category name in the display serif.
 *
 * Each circle uses the category's own image from Admin → Categories (a
 * lifestyle shot looks best), or failing that the first pack in it on a warm
 * disc, so a new category never shows up as a blank circle.
 */
const ICONS = {
  all: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  leaf: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7",
  sprout: "M12 20v-8M12 12c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5zM12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5z",
  cup: "M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c0 1.2 1 1.2 1 2.4M11.5 3.5c0 1.2 1 1.2 1 2.4",
  drop: "M12 3.5c3.5 4.4 5.5 7.6 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.6 2-5.8 5.5-10.2z",
};
// Matched on words in the slug, so a category renamed or added in the admin
// still gets a sensible icon; anything unrecognised gets the leaf.
function iconFor(slug = "") {
  if (/oil|skin/.test(slug)) return "drop";
  if (/tea|drink|beverage/.test(slug)) return "cup";
  if (/supplement|tablet|capsule|herbal/.test(slug)) return "sprout";
  return "leaf";
}
export function CategoryCircles({
  title = "Shop by category",
  tagline = "Goodness from one tree, many ways",
  categories,
}) {
  if (!categories.length) return null;
  return (
    <section className="bg-[#f6efe2] py-10 dark:bg-ink-900 md:py-14">
      <div className="mx-auto max-w-[90rem] gutter">
        <div className="relative text-center">
          <Glyph path={ICONS.leaf} className="mx-auto h-7 w-7 text-[#1f5c3a] dark:text-leaf-300" />
          <h2 className="mt-2 font-[family-name:var(--font-serif)] text-[2rem] font-medium tracking-normal text-[#173f29] dark:text-cream-50 md:text-[2.75rem]">
            {title}
          </h2>
          {tagline ? (
            <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#3d4a40] dark:text-cream-300">
              {tagline}
            </p>
          ) : null}
          <Link
            href="/shop"
            className="mt-5 inline-flex h-11 items-center gap-3 rounded-full border border-[#173f29]/40 bg-white/60 pl-5 pr-1.5 text-sm font-semibold text-[#173f29] transition-colors hover:bg-white dark:border-border-strong dark:bg-transparent dark:text-cream-100 md:absolute md:right-0 md:top-1/2 md:mt-0 md:-translate-y-1/2"
          >
            View all products
            <span className="grid h-8 w-8 place-items-center rounded-full border border-[#173f29]/30 dark:border-border-strong">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>

        <ul className="-mx-[var(--spacing-gutter)] mt-8 flex snap-x scroll-px-[var(--spacing-gutter)] gap-5 overflow-x-auto px-[var(--spacing-gutter)] pb-2 [scrollbar-width:none] md:mx-0 md:mt-10 md:grid md:grid-cols-6 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          <li className="w-36 shrink-0 snap-start md:w-auto">
            <Tile href="/shop" name="Shop all" note="Explore our complete range" icon="all" />
          </li>
          {categories.map((c) => (
            <li key={c.slug} className="w-36 shrink-0 snap-start md:w-auto">
              <Tile
                href={`/shop/${c.slug}`}
                name={c.name}
                note={`${c.count} ${c.count === 1 ? "product" : "products"}`}
                image={c.image}
                icon={iconFor(c.slug)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
function Tile({ href, name, note, image, icon }) {
  return (
    <Link href={href} className="group flex flex-col items-center text-center">
      {/* The gold ring is a gradient border: a padded gradient disc with the
          picture sitting inside it. */}
      <span className="relative block aspect-square w-full max-w-[11.5rem] rounded-full bg-gradient-to-br from-[#f1dca0] via-[#b98a3a] to-[#f4e3b0] p-[3px] shadow-[0_14px_30px_-16px_rgba(80,55,10,0.55)] transition-transform duration-300 group-hover:-translate-y-1">
        <span className="relative block h-full w-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,#fffaf0_0%,#f3e7cf_70%,#e9d9b6_100%)] dark:bg-[radial-gradient(circle_at_50%_40%,#2a3a2f_0%,#17211a_80%)]">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 768px) 184px, 144px"
              className="object-contain p-[16%] mix-blend-multiply transition-transform duration-500 group-hover:scale-105 dark:mix-blend-normal"
              unoptimized={image.startsWith("/uploads/")}
            />
          ) : (
            <span className="absolute inset-[22%] grid place-items-center rounded-[1.4rem] bg-white/80 shadow-inner dark:bg-ink-700">
              <Glyph path={ICONS.all} className="h-9 w-9 text-[#1f5c3a] dark:text-leaf-300" />
            </span>
          )}
        </span>
        {/* Icon badge, half over the ring's lower edge. */}
        <span className="absolute -bottom-5 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-white shadow-md dark:bg-ink-700">
          <Glyph path={ICONS[icon] ?? ICONS.leaf} className="h-5 w-5 text-[#1f5c3a] dark:text-leaf-300" />
        </span>
      </span>
      <span className="mt-8 font-[family-name:var(--font-serif)] text-[1.05rem] font-medium leading-tight text-[#173f29] group-hover:text-emerald-600 dark:text-cream-50 md:text-[1.2rem]">
        {name}
      </span>
      {note ? (
        <span className="mt-1 text-[0.75rem] text-[#5b665e] dark:text-cream-400">{note}</span>
      ) : null}
    </Link>
  );
}
function Glyph({ path, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
