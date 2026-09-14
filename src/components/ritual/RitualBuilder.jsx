"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { addRitualAction } from "@/app/actions/ritual";
import { useCart } from "@/components/cart/CartProvider";
export function RitualBuilder({ steps, promo }) {
  const [picked, setPicked] = useState({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const { open } = useCart();
  const router = useRouter();
  const chosen = useMemo(
    () => steps.map((s) => picked[s.key]).filter((c) => Boolean(c)),
    [picked, steps],
  );
  const subtotal = chosen.reduce((sum, c) => sum + c.price, 0);
  // Mirrors the coupon the server will evaluate. Shown only when the basket
  // actually qualifies, so nothing is promised that checkout then declines.
  const saving = useMemo(() => {
    if (!promo || subtotal < promo.minSubtotal) return 0;
    const raw = Math.floor((subtotal * promo.percent) / 100);
    return promo.maxDiscount ? Math.min(raw, promo.maxDiscount) : raw;
  }, [promo, subtotal]);
  const toGo =
    promo && subtotal > 0 && subtotal < promo.minSubtotal
      ? promo.minSubtotal - subtotal
      : 0;
  const choose = (stepKey, choice) => {
    setError(null);
    setPicked((prev) => ({
      ...prev,
      // Tapping the selected one again clears it — skipping a step has to be
      // as easy as filling it.
      [stepKey]: prev[stepKey]?.variantId === choice.variantId ? undefined : choice,
    }));
  };
  const addRitual = () => {
    setError(null);
    startTransition(async () => {
      const result = await addRitualAction({
        variantIds: chosen.map((c) => c.variantId),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      open();
    });
  };
  return (
    <div className="grid gap-16 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
      <div className="grid gap-16">
        {steps.map((step, index) => (
          <section key={step.key} aria-labelledby={`step-${step.key}`}>
            <header className="mb-7">
              <p className="eyebrow text-cream-400">
                Step {index + 1} · {step.eyebrow}
              </p>
              <h2 id={`step-${step.key}`} className="mt-3 text-title text-cream-50">
                {step.title}
              </h2>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-cream-400">
                {step.blurb}
              </p>
            </header>

            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {step.choices.map((choice) => {
                const selected = picked[step.key]?.variantId === choice.variantId;
                return (
                  <li key={choice.variantId}>
                    <button
                      type="button"
                      onClick={() => choose(step.key, choice)}
                      disabled={!choice.inStock}
                      aria-pressed={selected}
                      data-cursor="link"
                      className={cn(
                        "group flex h-full w-full flex-col overflow-hidden border text-left transition-all duration-500",
                        "ease-[var(--ease-organic)] disabled:cursor-not-allowed disabled:opacity-40",
                        selected
                          ? "border-emerald-400/70 bg-emerald-500/[0.07]"
                          : "border-border-subtle bg-white/[0.02] hover:border-border-strong",
                      )}
                    >
                      <div className="relative aspect-square w-full bg-gradient-to-b from-photo-from to-photo-to">
                        {choice.imageUrl ? (
                          <Image
                            src={choice.imageUrl}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 45vw, 20vw"
                            className="object-contain p-4 transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                        ) : null}

                        {/* The tick, drawn rather than iconified, so it matches
                        the rest of the site's hand. */}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border transition-all duration-300",
                            selected
                              ? "scale-100 border-emerald-400 bg-emerald-500 opacity-100"
                              : "scale-75 border-on-photo/20 bg-photo-from/70 opacity-0 group-hover:opacity-100",
                          )}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6.2 4.8 8.5 9.5 3.8"
                              stroke={selected ? "#ffffff" : "#5a6552"}
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>

                        {!choice.inStock ? (
                          <span className="absolute left-2 top-2 border border-border-subtle bg-ink/85 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.14em] text-cream-400">
                            Out of stock
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <p className="text-[0.9rem] leading-snug text-cream-50">
                          {choice.productName}
                        </p>
                        {choice.variantName ? (
                          <p className="text-[0.7rem] uppercase tracking-[0.1em] text-cream-400">
                            {choice.variantName}
                          </p>
                        ) : null}
                        <p className="mt-auto pt-2 text-sm tabular-nums text-cream-100">
                          {formatPrice(choice.price)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* The running ritual. Sticky on desktop so the total is never out of
            sight while choosing. */}
      <aside className="lg:sticky lg:top-28">
        <div className="border border-border-subtle bg-white/[0.03] p-6">
          <h2 className="text-[1.05rem] text-cream-50">Your ritual</h2>

          {chosen.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-cream-400">
              Nothing chosen yet. Pick whatever fits your day — every step is optional.
            </p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {steps.map((step) => {
                const choice = picked[step.key];
                if (!choice) return null;
                return (
                  <li
                    key={step.key}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-cream-100">
                        {choice.productName}
                      </span>
                      <span className="text-[0.68rem] uppercase tracking-[0.12em] text-cream-400">
                        {step.eyebrow}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-cream-300">
                      {formatPrice(choice.price)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {chosen.length > 0 ? (
            <dl className="mt-6 grid gap-2 border-t border-border-subtle pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-cream-400">Subtotal</dt>
                <dd className="tabular-nums text-cream-100">{formatPrice(subtotal)}</dd>
              </div>

              {saving > 0 && promo ? (
                <div className="flex justify-between text-leaf-300">
                  <dt>{promo.code}</dt>
                  <dd className="tabular-nums">−{formatPrice(saving)}</dd>
                </div>
              ) : null}

              <div className="mt-1 flex justify-between border-t border-border-subtle pt-3">
                <dt className="text-cream-100">Total</dt>
                <dd className="text-[1.05rem] tabular-nums text-cream-50">
                  {formatPrice(subtotal - saving)}
                </dd>
              </div>
            </dl>
          ) : null}

          {toGo > 0 && promo ? (
            <p className="mt-4 text-xs leading-relaxed text-cream-400">
              Add {formatPrice(toGo)} more to unlock {promo.percent}% off.
            </p>
          ) : null}

          <Button
            className="mt-6 w-full"
            onClick={addRitual}
            disabled={chosen.length === 0 || pending}
            loading={pending}
          >
            {chosen.length === 0
              ? "Choose something first"
              : `Add ${chosen.length === 1 ? "it" : `all ${chosen.length}`} to bag`}
          </Button>

          {error ? (
            <p role="alert" className="mt-3 text-xs text-[#e0a19c]">
              {error}
            </p>
          ) : null}

          <p className="mt-4 text-[0.68rem] leading-relaxed text-cream-400">
            Prices and stock are confirmed again when the bag is updated.{" "}
            <Link
              href="/shop"
              className="underline underline-offset-2 hover:text-cream-200"
            >
              Browse everything
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
