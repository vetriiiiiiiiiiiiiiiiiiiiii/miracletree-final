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
    <section id="why-moringa" className="bg-ink-900 py-12 md:py-16">
      <div className="mx-auto max-w-[90rem] gutter">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl text-cream-50 md:text-3xl">{title}</h2>
          {subtitle ? (
            <p className="mt-3 leading-relaxed text-cream-300">{subtitle}</p>
          ) : null}
        </div>
        <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {FACTS.map((fact) => (
            <li
              key={fact.figure}
              className="rounded-3xl border border-border-subtle bg-ink p-6 md:p-8"
            >
              <p className="flex items-baseline gap-2">
                <span className="text-[2.6rem] font-extrabold leading-none tracking-tight text-emerald-500">
                  {fact.figure}
                </span>
                <span className="text-[0.75rem] font-bold uppercase tracking-wider text-berry-500">
                  {fact.unit}
                </span>
              </p>
              {fact.title ? (
                <h3 className="mt-4 text-[1.05rem] font-bold leading-snug text-cream-50">
                  {fact.title}
                </h3>
              ) : null}
              <p
                className={`text-sm leading-relaxed text-cream-300 ${fact.title ? "mt-2" : "mt-4"}`}
              >
                {fact.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-cream-400">
          We describe how the plant is grown and handled, not what it will do
          for you. Moringa is a food, and our products are foods — if you are
          pregnant, nursing, on prescribed medication or managing a condition,
          talk to your doctor before adding any supplement.{" "}
          <Link href="/moringa" className="font-semibold text-emerald-500 underline underline-offset-2">
            More about the plant
          </Link>
        </p>
      </div>
    </section>
  );
}
