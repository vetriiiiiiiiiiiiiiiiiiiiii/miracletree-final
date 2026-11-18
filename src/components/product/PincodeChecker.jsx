"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
/**
 * "Check delivery to your PIN code" on the product page: whether we deliver
 * there, the estimated delivery date, cash on delivery, and the shipping cost.
 */
export function PincodeChecker({ variantId }) {
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState({ status: "idle" });
  const check = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setState({ status: "error", message: "Enter a 6-digit PIN code." });
      return;
    }
    setState({ status: "loading" });
    try {
      const response = await fetch(
        `/api/shipping/check?pincode=${pincode}${variantId ? `&variantId=${variantId}` : ""}`,
      );
      const data = await response.json();
      if (!data.ok) setState({ status: "error", message: data.error || "Couldn't check that PIN code." });
      else setState({ status: "done", result: data, pincode });
    } catch {
      setState({ status: "error", message: "Couldn't check right now. Please try again." });
    }
  };
  const result = state.status === "done" ? state.result : null;
  return (
    <div className="rounded-2xl border border-border-subtle p-4">
      <form onSubmit={check} className="flex items-center gap-2">
        <label htmlFor="pincode-check" className="sr-only">
          Delivery PIN code
        </label>
        <input
          id="pincode-check"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="Enter delivery PIN code"
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
          className="h-10 min-w-0 flex-1 border-b border-border-subtle bg-transparent text-sm text-cream-50 placeholder:text-cream-400 focus:border-emerald-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="h-10 shrink-0 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
        >
          {state.status === "loading" ? "Checking…" : "Check"}
        </button>
      </form>
      {state.status === "error" ? (
        <p role="alert" className="mt-2 text-sm text-[#e0a19c]">
          {state.message}
        </p>
      ) : null}
      {result ? (
        result.serviceable ? (
          <ul className="mt-3 grid gap-1.5 text-sm" aria-live="polite">
            <li className="text-leaf-300">
              {result.etd ? `Delivery to ${state.pincode} by ${result.etd}` : `We deliver to ${state.pincode}`}
              {result.days ? ` (${result.days} day${result.days === 1 ? "" : "s"})` : ""}
            </li>
            <li className={cn(result.codAvailable ? "text-cream-200" : "text-cream-400")}>
              {result.codAvailable ? "Cash on delivery available" : "Prepaid only — cash on delivery isn't available here"}
            </li>
            {result.live && result.shipping !== null ? (
              <li className="text-cream-300">
                Shipping {result.shipping === 0 ? "free" : formatPrice(result.shipping)} · free on orders above{" "}
                {formatPrice(result.freeAbove)}
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#e0a19c]" aria-live="polite">
            Sorry, we don&rsquo;t deliver to {state.pincode} yet.
          </p>
        )
      ) : null}
    </div>
  );
}
