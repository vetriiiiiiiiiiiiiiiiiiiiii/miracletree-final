import Link from "next/link";
/**
 * What makes the tree unusual, stated as horticulture and process rather than
 * as health claims. Everything here is verifiable about how the plant grows and
 * how the brand handles it — nothing about what it does to a body.
 */
const FACTS = [
  {
    figure: "< 12",
    unit: "months",
    title: "Seed to first harvest",
    body: "Moringa is tall enough to harvest within a year of sowing, so growers plant it along field edges and bunds.",
  },
  {
    figure: "5",
    unit: "usable parts",
    title: "Leaf, pod, flower, seed, gum",
    body: "Each part is processed differently and ends up in a different product. Very little of the tree is thrown away.",
  },
  {
    // Supplied as a figure, a unit and one paragraph, with no heading line —
    // so this card has none, rather than carrying a title written here.
    figure: "40+",
    unit: "grower families",
    title: null,
    body: "A network of over forty farming families around Madurai grows with the company, and the planting trials and SOPs were shared with them, not kept.",
  },
];
export function WhyMoringa({ title, subtitle }) {
  return (
    <section
      id="why-moringa"
      className="relative bg-[#fbf8f1] py-12 dark:bg-ink-900 md:py-16"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a24a]/50 to-transparent" aria-hidden />
      <div className="mx-auto max-w-[90rem] gutter">
        <div className="mx-auto max-w-2xl text-center">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="mx-auto h-7 w-7 text-[#1f5c3a] dark:text-leaf-300">
            <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="mt-2 font-[family-name:var(--font-serif)] text-[2rem] font-medium tracking-normal text-[#173f29] dark:text-cream-50 md:text-[2.75rem]">
            {title}
          </h2>
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#8a6d2c] dark:text-gold-300">
            How the plant grows, and how we handle it
          </p>
          {subtitle ? (
            <p className="mt-4 leading-relaxed text-[#3d4a40] dark:text-cream-300">{subtitle}</p>
          ) : null}
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {FACTS.map((fact) => (
            <li
              key={fact.figure}
              className="relative overflow-hidden rounded-[1.75rem] border border-[#e8dcc0] bg-white p-7 shadow-[0_20px_50px_-36px_rgba(40,30,10,0.5)] dark:border-border-subtle dark:bg-ink md:p-9"
            >
              {/* Gold rule across the top edge. */}
              <span className="absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c8a24a] to-transparent" aria-hidden />
              <p className="flex items-baseline gap-3">
                <span className="font-[family-name:var(--font-serif)] text-[3.2rem] font-medium leading-none text-[#173f29] dark:text-leaf-200">
                  {fact.figure}
                </span>
                <span className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#8a6d2c] dark:text-gold-300">
                  {fact.unit}
                </span>
              </p>
              {fact.title ? (
                <h3 className="mt-5 font-[family-name:var(--font-serif)] text-[1.2rem] font-medium leading-snug tracking-normal text-[#173f29] dark:text-cream-50">
                  {fact.title}
                </h3>
              ) : null}
              <p className={`text-[0.92rem] leading-relaxed text-[#4d5950] dark:text-cream-300 ${fact.title ? "mt-2" : "mt-5"}`}>
                {fact.body}
              </p>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-[#5b665e] dark:text-cream-400">
          We describe how the plant is grown and handled, not what it will do
          for you. Moringa is a food, and our products are foods — if you are
          pregnant, nursing, on prescribed medication or managing a condition,
          talk to your doctor before adding any supplement.{" "}
          <Link href="/moringa" className="font-semibold text-[#173f29] underline decoration-[#c8a24a] underline-offset-4 dark:text-leaf-200">
            More about the plant
          </Link>
        </p>
      </div>
    </section>
  );
}
