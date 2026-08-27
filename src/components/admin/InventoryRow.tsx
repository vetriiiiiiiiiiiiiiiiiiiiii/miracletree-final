"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { adjustInventoryAction } from "@/app/actions/admin/orders";
import type { FormState } from "@/app/actions/marketing";
import { cn } from "@/lib/utils";

const INITIAL: FormState = { status: "idle" };

/**
 * Inline stock adjustment. The field takes a delta rather than an absolute
 * number on purpose — "+24 received" is a fact about what happened, where
 * "set to 64" hides whether stock arrived or was written off.
 */
export function InventoryRow({
  variantId,
  onHand,
}: {
  variantId: string;
  onHand: number;
}) {
  const router = useRouter();
  const [state, action] = useActionState(adjustInventoryAction, INITIAL);
  const [delta, setDelta] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      setDelta("");
      startTransition(() => router.refresh());
    }
  }, [state, router]);

  return (
    <form action={action} className="relative flex items-center justify-end gap-1.5">
      <input type="hidden" name="variantId" value={variantId} />

      <label className="sr-only" htmlFor={`delta-${variantId}`}>
        Stock adjustment for this variant
      </label>
      <input
        id={`delta-${variantId}`}
        name="delta"
        type="number"
        value={delta}
        onChange={(event) => setDelta(event.target.value)}
        placeholder="±0"
        className="w-16 border border-white/15 bg-white/[0.03] px-2 py-1.5 text-right text-sm tabular-nums text-cream-50 focus:border-emerald-400 focus:outline-none"
      />

      <label className="sr-only" htmlFor={`reason-${variantId}`}>
        Reason
      </label>
      <select
        id={`reason-${variantId}`}
        name="reason"
        defaultValue="restock"
        className="border border-white/15 bg-transparent px-2 py-1.5 text-xs text-cream-200 focus:border-emerald-400 focus:outline-none"
      >
        <option value="restock" className="bg-ink-800">
          Restock
        </option>
        <option value="adjustment" className="bg-ink-800">
          Adjustment
        </option>
      </select>

      <Apply disabled={!delta || Number(delta) === 0} />

      {state.status === "error" ? (
        // Visible, not sr-only: a stock adjustment that silently fails is worse
        // than one that refuses loudly.
        <span
          role="alert"
          className="absolute right-4 z-10 -translate-y-7 whitespace-nowrap border border-danger/50 bg-[#2a1212] px-2 py-1 text-[0.62rem] text-[#f0b3b0]"
        >
          {state.message}
        </span>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {state.status === "success" ? state.message : ""}
      </span>

      {/* The resulting figure, previewed before committing. */}
      {delta && Number(delta) !== 0 ? (
        <span
          className={cn(
            "w-12 text-right text-xs tabular-nums",
            Number(delta) > 0 ? "text-leaf-300" : "text-[#e0a19c]",
          )}
        >
          → {Math.max(0, onHand + Number(delta))}
        </span>
      ) : (
        <span className="w-12" aria-hidden />
      )}
    </form>
  );
}

function Apply({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="border border-white/20 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.1em] text-cream-200 transition-colors hover:border-cream-100 disabled:opacity-30"
    >
      {pending ? "…" : "Apply"}
    </button>
  );
}
