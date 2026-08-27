"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Toast = {
  id: number;
  tone: "success" | "error" | "info";
  message: string;
};

/** Toast queue. Kept tiny and dependency-free — this is the only notifier. */
export function useToastState() {
  const [items, setItems] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = nextId.current++;
    setItems((current) => [...current.slice(-2), { ...toast, id }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((t) => t.id !== id));
    }, 4600);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((t) => t.id !== id));
  }, []);

  return { items, push, dismiss };
}

export function Toasts({
  items,
  onDismiss,
}: {
  items: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      // `polite` so an add-to-bag confirmation does not interrupt a screen
      // reader mid-sentence; errors still reach the user immediately after.
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[300] flex w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 md:bottom-8"
    >
      {items.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const tones = {
    success: "border-emerald-400/40 bg-forest-800/95 text-leaf-200",
    error: "border-danger/50 bg-[#2a1212]/95 text-[#f0b8b5]",
    info: "border-white/15 bg-ink-800/95 text-cream-200",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 border px-4 py-3 text-sm backdrop-blur-md",
        "transition-all duration-400 ease-[var(--ease-organic)]",
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        tones[toast.tone],
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 shrink-0 p-1 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </div>
  );
}
