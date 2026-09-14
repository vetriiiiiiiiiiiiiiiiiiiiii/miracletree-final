"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteProductAction,
  duplicateProductAction,
  setProductStatusAction,
} from "@/app/actions/admin/products";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { cn } from "@/lib/utils";
export function ProductRowActions({ productId, slug, status }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    setOpen(false);
    if (!result.ok) {
      setError(result.error ?? "That didn't work.");
      return;
    }
    startTransition(() => router.refresh());
  };
  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Product actions"
        disabled={busy}
        className="grid h-8 w-8 place-items-center text-cream-400 transition-colors hover:text-cream-50 disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <circle cx="8" cy="3" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="8" cy="13" r="1.3" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-52 border border-border-subtle bg-ink-800 py-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <MenuLink href={`/admin/products/${productId}`}>Edit</MenuLink>
          <MenuLink href={`/product/${slug}`} external>
            View on store
          </MenuLink>

          <hr className="my-1 border-border-subtle" />

          {status !== "published" ? (
            <MenuButton
              onClick={() =>
                run(() => setProductStatusAction([productId], "published"))
              }
            >
              Publish
            </MenuButton>
          ) : (
            <MenuButton
              onClick={() => run(() => setProductStatusAction([productId], "draft"))}
            >
              Unpublish
            </MenuButton>
          )}

          <MenuButton
            onClick={() =>
              run(async () => {
                const result = await duplicateProductAction(productId);
                if (result.ok && result.id) router.push(`/admin/products/${result.id}`);
                return result;
              })
            }
          >
            Duplicate
          </MenuButton>

          {status !== "archived" ? (
            <MenuButton
              onClick={() => run(() => setProductStatusAction([productId], "archived"))}
            >
              Archive
            </MenuButton>
          ) : null}

          <hr className="my-1 border-border-subtle" />

          <MenuButton
            tone="danger"
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
          >
            Delete
          </MenuButton>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="absolute right-0 top-9 z-40 w-64 border border-danger/40 bg-[#2a1212] px-3 py-2 text-left text-xs text-[#f0b3b0]"
        >
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-1.5 block underline underline-offset-2"
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title="Delete this product?"
        body="This removes the product, its variants, images and stock records permanently. Products that appear in past orders cannot be deleted — archive those instead."
        confirmLabel="Delete permanently"
        tone="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          setConfirming(false);
          await run(() => deleteProductAction(productId));
        }}
      />
    </div>
  );
}
function MenuLink({ href, children, external }) {
  return (
    <Link
      href={href}
      role="menuitem"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block px-4 py-2 text-left text-sm text-cream-200 transition-colors hover:bg-white/[0.05] hover:text-cream-50"
    >
      {children}
    </Link>
  );
}
function MenuButton({ onClick, children, tone }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/[0.05]",
        tone === "danger"
          ? "text-[#e0a19c] hover:text-[#f0b3b0]"
          : "text-cream-200 hover:text-cream-50",
      )}
    >
      {children}
    </button>
  );
}
