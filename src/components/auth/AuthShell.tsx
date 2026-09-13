import type { ReactNode } from "react";
import { SITE } from "@/lib/constants";

/**
 * Shared frame for the four auth screens.
 *
 * The second column used to hold a large decorative seed drawing at 50%
 * opacity. On the dark ground it read as a faint botanical watermark; on paper
 * it rendered as a flat grey disc in the middle of an otherwise empty half of
 * the page, which is the single least professional thing on the site.
 *
 * It now carries the reasons to finish signing in — order history, saved
 * addresses, the certifications, and how to reach a human. That is standard on
 * a commerce sign-in for a reason: the column was always going to be looked at,
 * so it may as well answer the question the visitor actually has.
 */

const REASONS = [
  {
    title: "Your orders in one place",
    body: "Track what is on its way, and reorder in two taps.",
  },
  {
    title: "Saved addresses",
    body: "Checkout without typing a PIN code again.",
  },
  {
    title: "Keep a wishlist",
    body: "Save products to come back to, on any device.",
  },
];

const CERTIFICATIONS = ["Organic", "ISO 9001:2015", "HACCP", "GMP", "HALAL", "APEDA"];

export function AuthShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <div className="grain relative grid min-h-[80svh] items-center bg-ink py-20 lg:grid-cols-2 lg:py-0">
      <div className="relative z-10 mx-auto w-full max-w-md gutter">
        <h1 className="text-display text-cream-50">{title}</h1>
        {lede ? (
          <p className="mt-5 max-w-[42ch] leading-relaxed text-cream-300">{lede}</p>
        ) : null}

        <div className="mt-10">{children}</div>
      </div>

      <aside className="relative hidden h-full flex-col justify-center border-l border-border-subtle bg-ink-900 px-16 lg:flex">
        <ul className="grid gap-8">
          {REASONS.map((reason) => (
            <li key={reason.title} className="flex gap-4">
              <Tick />
              <div>
                <p className="text-[1.05rem] text-cream-100">{reason.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-cream-400">
                  {reason.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 border-t border-border-subtle pt-8">
          <p className="eyebrow mb-4 text-cream-400">Certified</p>
          <ul className="flex flex-wrap gap-2">
            {CERTIFICATIONS.map((mark) => (
              <li
                key={mark}
                className="border border-border-subtle px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-cream-300"
              >
                {mark}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-cream-400">
            Trouble signing in? Write to{" "}
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="text-cream-200 underline decoration-gold-500 underline-offset-4 transition-colors hover:text-cream-50"
            >
              {SITE.supportEmail}
            </a>{" "}
            or call {SITE.phone}, {SITE.phoneHours}.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Tick() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="mt-0.5 shrink-0 text-emerald-400"
    >
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="m6.4 10.2 2.4 2.4 4.8-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
