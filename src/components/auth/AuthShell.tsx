import type { ReactNode } from "react";
import { BotanicalSeed } from "@/components/hero/BotanicalSeed";

/**
 * Shared frame for the four auth screens. The seed drawing carries the brand
 * without turning a two-field form into a production.
 */
export function AuthShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <div className="grain relative grid min-h-[80svh] items-center bg-ink py-20 lg:grid-cols-2 lg:py-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 40%, rgba(28,90,58,0.20) 0%, rgba(6,9,7,0) 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-md gutter">
        <p className="eyebrow mb-6 text-gold-400">{eyebrow}</p>
        <h1 className="text-display text-cream-50">{title}</h1>
        {lede ? (
          <p className="mt-5 max-w-[42ch] leading-relaxed text-cream-300/80">{lede}</p>
        ) : null}

        <div className="mt-10">{children}</div>
      </div>

      <div
        aria-hidden
        className="relative hidden h-full items-center justify-center lg:flex"
      >
        <BotanicalSeed className="h-[62%] w-auto opacity-50" />
      </div>
    </div>
  );
}
