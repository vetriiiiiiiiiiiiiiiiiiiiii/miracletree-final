import Image from "next/image";
import Link from "next/link";
/**
 * "Shop by category" — a row of round tiles, scrollable on a phone. Each uses
 * the category's own image from the admin, or failing that the first pack in
 * it, so a new category never shows up as a blank circle.
 */
export function CategoryCircles({ title = "Shop by category", categories }) {
  if (!categories.length) return null;
  return (
    <section className="mx-auto max-w-[90rem] gutter py-8 md:py-10">
      <h2 className="text-center text-2xl text-cream-50 md:text-3xl">{title}</h2>
      <ul className="mt-7 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:justify-center md:gap-8 [&::-webkit-scrollbar]:hidden">
        <li className="snap-start">
          <Tile href="/shop" name="Shop all" count={null} image={null} />
        </li>
        {categories.map((c) => (
          <li key={c.slug} className="snap-start">
            <Tile
              href={`/shop/${c.slug}`}
              name={c.name}
              count={c.count}
              image={c.image}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
function Tile({ href, name, count, image }) {
  return (
    <Link href={href} className="group flex w-24 flex-col items-center gap-2.5 text-center md:w-32">
      <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-full border-2 border-transparent bg-forest-900 transition-all duration-300 group-hover:border-emerald-500 group-hover:shadow-[var(--mt-shadow-card)]">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="128px"
            className="object-contain p-3 mix-blend-multiply transition-transform duration-300 group-hover:scale-110 dark:mix-blend-normal"
            unoptimized={image.startsWith("/uploads/")}
          />
        ) : (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden className="text-emerald-500">
            <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[0.82rem] font-semibold leading-tight text-cream-100 group-hover:text-emerald-500 md:text-[0.9rem]">
        {name}
      </span>
      {count ? (
        <span className="-mt-1.5 text-[0.7rem] text-cream-400">{count} products</span>
      ) : null}
    </Link>
  );
}
