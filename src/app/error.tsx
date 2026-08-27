"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

/**
 * The application error boundary.
 *
 * `digest` is the only thing shown from the error itself — the message can
 * contain internals, and this screen is public. The full error is logged
 * server-side under the same digest.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="grain flex min-h-[100svh] flex-col bg-ink">
      <header className="gutter py-8">
        <Link href="/" aria-label="Miracle Tree — home">
          <Logo className="h-7 w-auto" />
        </Link>
      </header>

      <main className="flex flex-1 items-center gutter">
        <div className="mx-auto w-full max-w-xl py-16 text-center">
          <p className="eyebrow mb-6 text-gold-400">Something went wrong</p>
          <h1
            className="text-display text-cream-50"
            style={{ fontFamily: "var(--font-display)" }}
          >
            That didn&rsquo;t take.
          </h1>
          <p className="mx-auto mt-7 max-w-[42ch] leading-relaxed text-cream-300/85">
            An unexpected error stopped this page loading. Trying again usually works —
            if it doesn&rsquo;t, let us know and we&rsquo;ll look into it.
          </p>

          <div className="mt-11 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={reset} magnetic>
              Try again
            </Button>
            <LinkButton href="/" variant="secondary" size="lg">
              Return home
            </LinkButton>
          </div>

          {error.digest ? (
            <p className="mt-10 text-xs text-cream-400">
              Reference <code className="tabular-nums text-cream-300">{error.digest}</code>
              {" · "}
              <Link href="/contact" className="underline underline-offset-4">
                Report this
              </Link>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
