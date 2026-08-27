"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  addProductImageAction,
  deleteProductImageAction,
  reorderProductImagesAction,
} from "@/app/actions/admin/products";

export type ManagedImage = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Product gallery management: upload, reorder by drag, remove.
 *
 * The first image is the one used on cards, in search and as the Open Graph
 * fallback, so position is meaningful and is stated in the UI rather than left
 * for the user to discover.
 */
export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ManagedImage[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  const ordered = order
    ? (order.map((id) => images.find((i) => i.id === id)).filter(Boolean) as ManagedImage[])
    : images;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    for (const [index, file] of [...files].entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}…`);
      const body = new FormData();
      body.set("file", file);
      body.set("folder", "products");

      try {
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "That upload failed.");
          break;
        }

        const result = await addProductImageAction({ productId, url: data.url });
        if (!result.ok) {
          setError(result.error ?? "Could not attach that image.");
          break;
        }
      } catch {
        setError("The upload failed. Check your connection and try again.");
        break;
      }
    }

    setUploading(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => router.refresh());
  };

  const remove = async (imageId: string) => {
    const result = await deleteProductImageAction(imageId);
    if (!result.ok) {
      setError(result.error ?? "Could not remove that image.");
      return;
    }
    setOrder(null);
    startTransition(() => router.refresh());
  };

  const onDrop = async (targetId: string) => {
    if (!dragging || dragging === targetId) return;

    const current = ordered.map((i) => i.id);
    const from = current.indexOf(dragging);
    const to = current.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...current];
    next.splice(to, 0, ...next.splice(from, 1));
    setOrder(next);
    setDragging(null);

    const result = await reorderProductImagesAction(productId, next);
    if (!result.ok) {
      setOrder(null);
      setError(result.error ?? "Could not save the new order.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-5">
      {error ? (
        <p className="border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-[#f0b3b0]" role="alert">
          {error}
        </p>
      ) : null}

      {ordered.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {ordered.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={() => setDragging(image.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void onDrop(image.id)}
              onDragEnd={() => setDragging(null)}
              className={cn(
                "group relative aspect-square cursor-grab overflow-hidden border bg-ink-700 active:cursor-grabbing",
                dragging === image.id ? "border-gold-400 opacity-50" : "border-white/12",
              )}
            >
              <Image
                src={image.url}
                alt={image.alt ?? ""}
                fill
                sizes="140px"
                className="object-contain p-2"
              />

              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 bg-gold-400 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.1em] text-ink">
                  Main
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => void remove(image.id)}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center bg-ink/85 text-cream-300 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-white/15 px-5 py-10 text-center text-sm text-cream-400">
          No images yet. The first one you add becomes the main image.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          onChange={(event) => void upload(event.target.files)}
          className="sr-only"
          id={`upload-${productId}`}
        />
        <label
          htmlFor={`upload-${productId}`}
          className={cn(
            "cursor-pointer border border-white/20 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-200 transition-colors hover:border-cream-100",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (progress ?? "Uploading…") : "Upload images"}
        </label>

        <p className="text-xs text-cream-400">
          JPEG, PNG, WebP, AVIF or GIF up to 8MB. Converted to WebP and resized
          automatically. Drag to reorder.
        </p>
      </div>
    </div>
  );
}
