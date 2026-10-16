/**
 * The reassurance strip under the hero. Every line here must be true of this
 * shop: the shipping copy and COD flag come from Admin → Settings, and the
 * rest is stated elsewhere on the site with its source.
 */
const ICONS = {
  leaf: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v2M12 20v2M2 12h2M20 12h2",
  shield: "M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3zM9 12l2 2 4-4",
  truck: "M3 7h11v8H3zM14 10h4l3 3v2h-7M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  cash: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};
export function UspStrip({ items }) {
  return (
    <section className="border-y border-border-subtle bg-forest-900">
      <ul className="mx-auto grid max-w-[90rem] grid-cols-2 gap-x-4 gap-y-5 gutter py-6 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.title} className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-emerald-500 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d={ICONS[item.icon]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[0.85rem] font-bold leading-tight text-cream-50">{item.title}</span>
              <span className="block text-[0.75rem] leading-snug text-cream-400">{item.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
