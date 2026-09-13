"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
/**
 * Confirmation for destructive admin actions. Focus lands on Cancel, not on the
 * destructive button — an accidental Enter should never delete anything.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  // See Drawer: portals must not appear on the first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => cancelRef.current?.focus(), 40);
    const onKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[500] grid place-items-center px-5">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onCancel} />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="relative w-full max-w-md border border-border-subtle bg-ink-800 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <h2 id="confirm-title" className="text-[1.15rem] text-cream-50">
          {title}
        </h2>
        <p id="confirm-body" className="mt-3 text-sm leading-relaxed text-cream-400">
          {body}
        </p>

        <div className="mt-7 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="border border-border-strong px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-200 transition-colors hover:border-cream-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className={cn(
              "px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-50 transition-colors",
              tone === "danger"
                ? "bg-danger hover:brightness-110"
                : "bg-emerald-500 hover:bg-emerald-400",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
