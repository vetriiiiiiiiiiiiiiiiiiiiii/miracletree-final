"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { subscribeAction, type FormState } from "@/app/actions/marketing";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const INITIAL: FormState = { status: "idle" };

export function NewsletterForm({
  source = "site",
  className,
}: {
  source?: string;
  className?: string;
}) {
  const [state, action] = useActionState(subscribeAction, INITIAL);

  useEffect(() => {
    if (state.status === "success") analytics.newsletterSignup(source);
  }, [state, source]);

  if (state.status === "success") {
    return (
      <p
        className={cn(
          "border border-emerald-400/30 bg-emerald-500/8 px-5 py-4 text-sm text-leaf-200",
          className,
        )}
        role="status"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className={cn("grid gap-3", className)}>
      <input type="hidden" name="source" value={source} />

      <div className="flex items-end gap-0 border-b border-white/20 focus-within:border-gold-400">
        <label htmlFor={`newsletter-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={state.status === "error" ? `newsletter-${source}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-cream-50 placeholder:text-cream-400/60 focus:outline-none"
        />
        <SubmitButton />
      </div>

      {state.status === "error" ? (
        <p id={`newsletter-${source}-error`} className="text-xs text-[#e0a19c]" role="alert">
          {state.errors?.email ?? state.message}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-cream-400">
        We use your address only to send the journal. Unsubscribe from any email.
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 py-3 pl-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gold-400 transition-colors hover:text-gold-300 disabled:opacity-50"
    >
      {pending ? "Joining…" : "Subscribe"}
    </button>
  );
}
