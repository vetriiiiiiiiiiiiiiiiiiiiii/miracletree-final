"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import { prefersReducedMotion } from "@/lib/motion";
const NUMBERS = [
  { value: "2009", label: "Working with moringa since" },
  { value: "60+", label: "Products developed" },
  { value: "14+", label: "Countries reached" },
  { value: "40+", label: "Grower families" },
];
const MARKS = ["NPOP Organic", "FSSAI", "ISO 9001:2015", "GMP", "HACCP"];
const CELL = "border border-border-subtle bg-ink-800/60";
export function HomeHero({ title, subtitle, products }) {
  // Opt in after mount: the server cannot know the visitor's motion
  // preference, and animating from opacity 0 in the markup would leave a blank
  // hero for anyone whose JavaScript never arrives.
  const [animate, setAnimate] = useState(false);
  useEffect(() => setAnimate(!prefersReducedMotion()), []);
  /**
   * The entrance is an inline style rather than a class, for two reasons both
   * learned the hard way. Tailwind only generates classes it can see as
   * literals, so a delay interpolated at runtime produces a class that never
   * exists. And `cn()` runs tailwind-merge, which treats a font-size utility
   * and a text colour as the same `text-*` property and silently drops one of
   * them — that collapsed the headline to 16px. Inline styles have neither
   * failure mode.
   */
  const rise = (delay) =>
    animate ? { animation: `hero-rise 0.7s var(--ease-organic) ${delay} both` } : {};
  const [flagship, ...rest] = products;
  const minis = rest.slice(0, 3);
  return (
    <section className="border-b border-border-subtle bg-ink-900 px-gutter py-6 lg:h-[calc(100svh-var(--header-offset))]">
      <div className="mx-auto grid h-full max-w-[100rem] gap-3 lg:grid-cols-12 lg:grid-rows-6">
        {/* The statement. Carries the page's only h1. */}
        <div
          className={`${CELL} flex flex-col justify-center p-7 lg:col-span-7 lg:row-span-4 xl:p-10`}
          style={rise("0.05s")}
        >
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-400">
            MiracleTree Life Science · Madurai
          </p>
          <h1
            className="mt-4 font-display text-cream-50"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.6rem)",
              lineHeight: 0.94,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </h1>
          <p className="mt-4 max-w-[44ch] text-[1.02rem] leading-relaxed text-cream-300">
            {subtitle}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton href="/shop" size="lg">
              Shop the range
            </LinkButton>
            <LinkButton href="/innovation" variant="ghost" size="lg">
              What we developed
            </LinkButton>
          </div>
        </div>

        {/* The flagship, at the price it actually sells for. */}
        {flagship ? (
          <div
            className={`group relative flex flex-col justify-between overflow-hidden p-6 lg:col-span-5 lg:row-span-4 ${CELL} transition-colors duration-300 hover:border-gold-400/60`}
            style={rise("0.14s")}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-cream-400">
                Flagship
              </p>
              {flagship.price !== null ? (
                <p className="text-[0.8rem] tabular-nums text-cream-300">
                  from {formatPrice(flagship.price)}
                </p>
              ) : null}
            </div>
            <div className="relative my-4 min-h-[12rem] flex-1 lg:min-h-[9rem]">
              <Image
                src={flagship.image}
                alt={flagship.name}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                priority
                className="object-contain transition-transform duration-700 ease-[var(--ease-organic)] group-hover:scale-[1.04]"
              />
            </div>
            <p className="font-display text-xl leading-tight text-cream-50">
              <Link
                href={`/product/${flagship.slug}`}
                className="before:absolute before:inset-0"
              >
                {flagship.name}
              </Link>
            </p>
          </div>
        ) : null}

        {/* The one claim no competitor can make. */}
        <div
          className="flex flex-col justify-center border border-gold-400/45 bg-gold-400/[0.11] p-6 lg:col-span-4 lg:row-span-2"
          style={rise("0.22s")}
        >
          <p className="text-[0.66rem] uppercase tracking-[0.2em] text-gold-400">
            2015 · AGRI INTEX
          </p>
          <p className="mt-2.5 font-display text-[1.35rem] leading-tight text-cream-50">
            The world&rsquo;s first moringa-leaf energy bar
          </p>
        </div>

        <dl
          className={`${CELL} grid grid-cols-2 content-center gap-x-6 gap-y-5 p-6 lg:col-span-3 lg:row-span-2`}
          style={rise("0.28s")}
        >
          {NUMBERS.map((n) => (
            <div key={n.label}>
              <dd className="font-display text-[1.6rem] leading-none tabular-nums text-cream-50">
                {n.value}
              </dd>
              <dt className="mt-1 text-[0.7rem] leading-snug text-cream-400">
                {n.label}
              </dt>
            </div>
          ))}
        </dl>

        <ul
          className="grid grid-cols-3 gap-3 lg:col-span-5 lg:row-span-2"
          style={rise("0.34s")}
        >
          {minis.map((p) => (
            <li
              key={p.slug}
              className={`group relative flex flex-col ${CELL} p-3 transition-colors duration-300 hover:border-gold-400/60`}
            >
              <div className="relative min-h-[4.5rem] flex-1">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 16vw, 30vw"
                  className="object-contain transition-transform duration-500 ease-[var(--ease-organic)] group-hover:scale-[1.06]"
                />
              </div>
              <p className="mt-2 line-clamp-2 text-[0.74rem] leading-snug text-cream-200">
                <Link
                  href={`/product/${p.slug}`}
                  className="before:absolute before:inset-0"
                >
                  {p.name}
                </Link>
              </p>
              {p.price !== null ? (
                <p className="text-[0.72rem] tabular-nums text-cream-400">
                  {formatPrice(p.price)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <div
          className={`${CELL} flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4 lg:col-span-12`}
          style={rise("0.4s")}
        >
          {MARKS.map((m) => (
            <span
              key={m}
              className="text-[0.68rem] uppercase tracking-[0.16em] text-cream-400"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
