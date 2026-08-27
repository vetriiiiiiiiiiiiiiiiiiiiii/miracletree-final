"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type MediaItem = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  folder: string | null;
  createdAt: string;
};

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    for (const file of [...files]) {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", "library");

      try {
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? "That upload failed.");
          break;
        }
      } catch {
        setError("The upload failed. Check your connection and try again.");
        break;
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => router.refresh());
  };

  const copy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(item.id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard access can be blocked; the URL is selectable underneath.
      setError("Copying was blocked. Select the URL below the image instead.");
    }
  };

  const remove = async (item: MediaItem) => {
    setDeleting(null);
    const response = await fetch(`/api/admin/upload?id=${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not remove that file from the library.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-5">
      {error ? <FormMessage>{error}</FormMessage> : null}

      <Card
        title="Library"
        description={`${items.length} file${items.length === 1 ? "" : "s"}`}
        actions={
          <>
            <input
              ref={inputRef}
              id="media-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              multiple
              onChange={(event) => void upload(event.target.files)}
              className="sr-only"
            />
            <label
              htmlFor="media-upload"
              className={cn(
                "cursor-pointer border border-white/20 px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              {uploading ? "Uploading…" : "Upload files"}
            </label>
          </>
        }
      >
        {items.length === 0 ? (
          <p className="py-14 text-center text-sm text-cream-400">
            Nothing uploaded yet. Images added from a product page appear here too.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <li key={item.id} className="group border border-white/10">
                <div className="relative aspect-square bg-ink-700">
                  <Image
                    src={item.url}
                    alt={item.alt ?? ""}
                    fill
                    sizes="200px"
                    className="object-contain p-2"
                  />
                </div>

                <div className="border-t border-white/10 p-3">
                  <p className="truncate text-[0.7rem] text-cream-400" title={item.url}>
                    {item.url.split("/").pop()}
                  </p>
                  <p className="mt-1 text-[0.62rem] tabular-nums text-cream-400/70">
                    {item.width}×{item.height}
                    {item.sizeBytes ? ` · ${Math.round(item.sizeBytes / 1024)}KB` : ""}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-cream-400/70">
                    {formatDate(item.createdAt)}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void copy(item)}
                      className="text-[0.62rem] uppercase tracking-[0.1em] text-cream-300 underline underline-offset-2 hover:text-cream-50"
                    >
                      {copied === item.id ? "Copied" : "Copy URL"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(item)}
                      className="text-[0.62rem] uppercase tracking-[0.1em] text-cream-400 underline underline-offset-2 hover:text-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove from library?"
        body="This removes the entry from the media library. The file itself stays on the server, because a product or article may still reference the same URL."
        confirmLabel="Remove"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void remove(deleting);
        }}
      />
    </div>
  );
}
