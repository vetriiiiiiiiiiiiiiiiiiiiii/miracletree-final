"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { FloatingParticles } from "@/components/motion/FloatingParticles";
import { SplitText } from "@/components/motion/SplitText";
import { formatPrice } from "@/lib/money";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The homepage hero.
 *
 * Several versions got here and each failed differently, which is worth
 * recording. It began as a 2.4-screen scroll journey through a WebGL scene:
 * impressive once, tiring on every return. Freezing that scene fixed the
 * scrolling and exposed that its appeal had been the *motion* — held still it
 * was dark green murk. Composing product cut-outs against a brand ground fixed
 * the imagery, but the packs floated as decoration: no price, no link, nothing
 * holding them in place, and the composition read as sparse no matter how much
 * was added to it.
 *
 * So nothing floats here. The screen is a grid and every claim the company has
 * gets a cell of its own — the statement, the flagship at the price it really
 * sells for, the AGRI INTEX world-first, the record in numbers, three more
 * products, the certifications.
 *
 * The motion is layered so that no single thing has to carry it: the panels
 * arrive on a stagger, the headline rises a word at a time, the numbers count
 * up, the flagship breathes and leans towards the pointer, light crosses the
 * gold panel now and then, and the three small cells cycle through the rest of
 * the range so the hero is never showing the same four products twice.
 *
 * All of it degrades. Under `prefers-reduced-motion` nothing animates, nothing
 * cycles, the numbers are simply their final values, and the hero renders as a
 * finished composition rather than an empty one waiting for JavaScript.
 */

const NUMBERS = [
  { to: 2009, plus: false, label: "Working with moringa since", plain: true },
  { to: 60, plus: true, label: "Products developed" },
  { to: 14, plus: true, label: "Countries reached" },
  { to: 40, plus: true, label: "Grower families" },
];

const MARKS = ["NPOP Organic", "FSSAI", "ISO 9001:2015", "GMP", "HACCP"];

const CELL =
  "border border-border-subtle bg-ink-800/60 transition-[border-color,transform] duration-500 ease-[var(--ease-organic)]";

/** Counts up once, on mount. Returns the target immediately when disabled. */
function useCountUp(target, enabled, duration = 1200) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    let raf = 0;
    const began = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - began) / duration);
      // Ease-out cubic: settles onto the number rather than stopping dead.
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, duration]);

  return value;
}

function Stat({ item, animate }) {
  const value = useCountUp(item.to, animate);
  return (
    <div>
      <dd className="font-display text-[1.6rem] leading-none tabular-nums text-cream-50">
        {item.plain ? value : `${value}${item.plus ? "+" : ""}`}
      </dd>
      <dt className="mt-1 text-[0.7rem] leading-snug text-cream-400">{item.label}</dt>
    </div>
  );
}

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

  // The small cells cycle through everything that is not the flagship, three
  // at a time, so a returning visitor meets a different set. Cycling by offset
  // rather than shuffling keeps the order stable and predictable.
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!animate || rest.length <= 3) return;
    const id = window.setInterval(
      () => setOffset((o) => (o + 3) % rest.length),
      6000,
    );
    return () => window.clearInterval(id);
  }, [animate, rest.length]);

  const minis = rest.length
    ? Array.from({ length: Math.min(3, rest.length) }, (_, i) => rest[(offset + i) % rest.length])
    : [];

  // The flagship leans towards the pointer. The lean lives on an inner element
  // so it never competes with the entrance animation for `transform`.
  const packRef = useRef(null);
  const [lean, setLean] = useState({ x: 0, y: 0 });
  const onPointerMove = useCallback(
    (event) => {
      if (!animate) return;
      const box = event.currentTarget.getBoundingClientRect();
      setLean({
        x: (event.clientX - box.left) / box.width - 0.5,
        y: (event.clientY - box.top) / box.height - 0.5,
      });
    },
    [animate],
  );

  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-ink-900 px-gutter py-6 lg:h-[calc(100svh-var(--header-offset))]">
      {/* The cells are translucent, so the drift reads through them and in the
          gaps between rather than sitting on top of anything. */}
      <FloatingParticles className="pointer-events-none absolute inset-0 h-full w-full" max={45} />

      <div className="relative mx-auto grid h-full max-w-[100rem] gap-3 lg:grid-cols-12 lg:grid-rows-6">
        {/* The statement. Carries the page's only h1. */}
        <div
          className={`${CELL} group flex flex-col justify-center p-7 hover:border-border-strong lg:col-span-7 lg:row-span-4 xl:p-10`}
          style={rise("0.05s")}
        >
          <p className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-gold-400">
            MiracleTree Life Science · Madurai
            <span
              aria-hidden
              className="h-px w-10 origin-left bg-gold-400/50"
              style={
                animate
                  ? { animation: "hero-rule 0.7s var(--ease-organic) 0.5s both" }
                  : undefined
              }
            />
          </p>

          <SplitText
            as="h1"
            text={title}
            className="mt-4 block font-display text-cream-50"
            delay={0.25}
            stagger={0.07}
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.6rem)",
              lineHeight: 0.94,
              letterSpacing: "-0.03em",
            }}
          />

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
            ref={packRef}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setLean({ x: 0, y: 0 })}
            className={`group relative flex flex-col justify-between overflow-hidden p-6 lg:col-span-5 lg:row-span-4 ${CELL} hover:border-gold-400/60`}
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
              {/* Two nested wrappers: the outer one breathes on a loop, the
                  inner one answers the pointer. One element cannot hold both
                  without the idle animation stamping on the lean. */}
              <div
                className="absolute inset-0"
                style={
                  animate
                    ? { animation: "hero-float 7s ease-in-out 1.2s infinite" }
                    : undefined
                }
              >
                <div
                  className="relative h-full w-full will-change-transform"
                  style={{
                    transform: `translate3d(${(lean.x * 18).toFixed(1)}px, ${(lean.y * 12).toFixed(1)}px, 0)`,
                    transition: "transform 0.5s var(--ease-organic)",
                  }}
                >
                  <Image
                    src={flagship.image}
                    alt={flagship.name}
                    fill
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    priority
                    className="object-contain transition-transform duration-700 ease-[var(--ease-organic)] group-hover:scale-[1.05]"
                  />
                </div>
              </div>
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
          className="relative flex flex-col justify-center overflow-hidden border border-gold-400/45 bg-gold-400/[0.11] p-6 lg:col-span-4 lg:row-span-2"
          style={rise("0.22s")}
        >
          {animate ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-gold-300/20 to-transparent"
              style={{ animation: "hero-sheen 9s ease-in-out 2s infinite" }}
            />
          ) : null}
          <p className="relative text-[0.66rem] uppercase tracking-[0.2em] text-gold-400">
            2015 · AGRI INTEX
          </p>
          <p className="relative mt-2.5 font-display text-[1.35rem] leading-tight text-cream-50">
            The world&rsquo;s first moringa-leaf energy bar
          </p>
        </div>

        <dl
          className={`${CELL} grid grid-cols-2 content-center gap-x-6 gap-y-5 p-6 lg:col-span-3 lg:row-span-2`}
          style={rise("0.28s")}
        >
          {NUMBERS.map((n) => (
            <Stat key={n.label} item={n} animate={animate} />
          ))}
        </dl>

        <ul className="grid grid-cols-3 gap-3 lg:col-span-5 lg:row-span-2" style={rise("0.34s")}>
          {minis.map((p, i) => (
            <li
              key={`${p.slug}-${i}`}
              className={`group relative flex flex-col ${CELL} p-3 hover:-translate-y-1 hover:border-gold-400/60`}
            >
              <div className="relative min-h-[4.5rem] flex-1">
                <Image
                  // Keying on the slug restarts the fade when the cell cycles
                  // to a different product, so the swap is a dissolve rather
                  // than a jump cut.
                  key={p.slug}
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 16vw, 30vw"
                  className="object-contain transition-transform duration-500 ease-[var(--ease-organic)] group-hover:scale-[1.06]"
                  style={
                    animate
                      ? { animation: "hero-rise 0.6s var(--ease-organic) both" }
                      : undefined
                  }
                />
              </div>
              <p className="mt-2 line-clamp-2 text-[0.74rem] leading-snug text-cream-200">
                <Link href={`/product/${p.slug}`} className="before:absolute before:inset-0">
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
          {MARKS.map((m, i) => (
            <span
              key={m}
              className="text-[0.68rem] uppercase tracking-[0.16em] text-cream-400"
              style={
                animate
                  ? {
                      animation: `hero-rise 0.5s var(--ease-organic) ${0.45 + i * 0.06}s both`,
                    }
                  : undefined
              }
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
