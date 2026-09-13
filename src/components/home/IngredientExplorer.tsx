"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Container, Section, SectionHeading } from "@/components/layout/Section";

export type IngredientItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  origin: string | null;
  productCount: number;
};

/**
 * The five usable parts of the tree, explored by selection rather than by
 * scroll. Descriptions are botanical — what the part is and how it is handled.
 */
export function IngredientExplorer({
  title,
  subtitle,
  ingredients,
}: {
  title: string;
  subtitle: string | null;
  ingredients: IngredientItem[];
}) {
  const [active, setActive] = useState(0);
  const current = ingredients[active];

  if (!ingredients.length) return null;

  return (
    <Section id="ingredients" tone="forest" spacing="default" className="grain">
      <Container>
        <SectionHeading
          title={title}
          lede={subtitle ?? undefined}
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Selector */}
          <ul className="grid gap-0" role="tablist" aria-label="Parts of the moringa tree">
            {ingredients.map((ingredient, index) => (
              <li key={ingredient.id}>
                <button
                  type="button"
                  role="tab"
                  id={`ingredient-tab-${ingredient.slug}`}
                  aria-selected={index === active}
                  aria-controls={`ingredient-panel-${ingredient.slug}`}
                  onClick={() => setActive(index)}
                  className={cn(
                    "group flex w-full items-baseline justify-between gap-6 border-t border-border-subtle py-5 text-left transition-colors duration-400",
                    index === active ? "text-cream-50" : "text-cream-400 hover:text-cream-200",
                  )}
                >
                  <span className="flex items-baseline gap-4">
                    <span
                      className={cn(
                        "text-[0.66rem] tabular-nums tracking-[0.16em] transition-colors",
                        index === active ? "text-gold-400" : "text-cream-400",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <span
                      className="text-[1.35rem] leading-tight md:text-[1.6rem]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {ingredient.name}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "h-px w-8 shrink-0 self-center transition-all duration-500 ease-[var(--ease-organic)]",
                      index === active ? "w-14 bg-gold-400" : "bg-border-subtle",
                    )}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>

          {/* Panel */}
          {current ? (
            <div
              role="tabpanel"
              id={`ingredient-panel-${current.slug}`}
              aria-labelledby={`ingredient-tab-${current.slug}`}
              // Keying on the slug restarts the fade whenever the selection changes.
              key={current.slug}
              className="flex flex-col justify-center border border-border-subtle bg-ink/40 p-8 md:p-12"
              style={{ animation: "ingredientIn 600ms var(--ease-organic) both" }}
            >
              <h3
                className="text-title text-cream-50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {current.name}
              </h3>

              {current.origin ? (
                <p className="eyebrow mt-4 text-gold-400">{current.origin}</p>
              ) : null}

              {current.description ? (
                <p className="mt-6 max-w-[46ch] text-[1.02rem] leading-relaxed text-cream-300">
                  {current.description}
                </p>
              ) : null}

              <Link
                href={`/shop?ingredient=${current.slug}`}
                className="group mt-10 inline-flex items-center gap-3 py-1.5 text-[0.72rem] uppercase tracking-[0.16em] text-cream-200 transition-colors hover:text-gold-300"
              >
                <span>
                  {current.productCount} product{current.productCount === 1 ? "" : "s"} use it
                </span>
                <span className="h-px w-8 bg-current transition-all duration-500 group-hover:w-12" aria-hidden />
              </Link>
            </div>
          ) : null}
        </div>
      </Container>

      <style>{`
        @keyframes ingredientIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes ingredientIn { from { opacity: 1; } to { opacity: 1; } }
        }
      `}</style>
    </Section>
  );
}
