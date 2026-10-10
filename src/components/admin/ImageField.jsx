"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
/**
 * An image form field: upload a file, pick one already in the media library,
 * or paste a path — with a preview of whatever is chosen.
 *
 * The value travels in a hidden input under `name`, so it drops into any
 * server-action form (RecordManager included) in place of a plain text field.
 * Uploads go through /api/admin/upload, which re-encodes to WebP, strips EXIF
 * and records the file in the media library.
 */
export async function uploadImage(file, folder) {
  const body = new FormData();
  body.set("file", file);
  body.set("folder", folder);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "That upload failed.");
  return data; // { id, url, width, height }
}
const isUpload = (url) => typeof url === "string" && url.startsWith("/uploads/");
export function ImageField({
  name,
  label,
  hint,
  error,
  defaultValue = "",
  folder = "library",
  aspect = "aspect-4/5",
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);
  const [library, setLibrary] = useState(null);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setProblem(null);
    try {
      const data = await uploadImage(file, folder);
      setUrl(data.url);
    } catch (e) {
      setProblem(e.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const openLibrary = async () => {
    if (library) {
      setLibrary(null);
      return;
    }
    setProblem(null);
    try {
      const response = await fetch("/api/admin/upload");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLibrary(data.items ?? []);
    } catch {
      setProblem("Could not load the media library.");
    }
  };
  const shown = error ?? problem;
  return (
    <div className="grid gap-2">
      <span className="eyebrow text-cream-400">{label}</span>
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "relative w-32 shrink-0 overflow-hidden border border-border-subtle bg-ink-700",
            aspect,
          )}
        >
          {url ? (
            <Image
              src={url}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              unoptimized={isUpload(url)}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[0.62rem] uppercase tracking-[0.12em] text-cream-400">
              No image
            </span>
          )}
        </div>

        <div className="grid min-w-0 flex-1 gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id={`${id}-file`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={(event) => void upload(event.target.files?.[0])}
              className="sr-only"
            />
            <label
              htmlFor={`${id}-file`}
              className={cn(
                "cursor-pointer border border-border-strong px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100",
                busy && "pointer-events-none opacity-60",
              )}
            >
              {busy ? "Uploading…" : url ? "Replace" : "Upload"}
            </label>
            <button
              type="button"
              onClick={() => void openLibrary()}
              className="border border-border-subtle px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-300 transition-colors hover:border-border-strong hover:text-cream-50"
            >
              {library ? "Close library" : "Choose from library"}
            </button>
            {url ? (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="px-2 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-400 underline underline-offset-4 hover:text-danger"
              >
                Remove
              </button>
            ) : null}
          </div>

          <input
            aria-label={`${label} path`}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="/uploads/… or https://cdn.shopify.com/…"
            maxLength={500}
            className="w-full border border-border-subtle bg-ink-800 px-3 py-2 text-xs text-cream-200 placeholder:text-cream-400 focus:border-emerald-400 focus:outline-none"
          />

          {shown ? (
            <p className="text-xs text-danger" role="alert">
              {shown}
            </p>
          ) : hint ? (
            <p className="text-xs text-cream-400">{hint}</p>
          ) : null}
        </div>
      </div>

      {library ? (
        library.length ? (
          <ul className="mt-2 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto border border-border-subtle p-2 sm:grid-cols-6 lg:grid-cols-8">
            {library.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setUrl(item.url);
                    setLibrary(null);
                  }}
                  className={cn(
                    "relative block aspect-square w-full overflow-hidden border bg-ink-700 transition-colors",
                    item.url === url
                      ? "border-gold-400"
                      : "border-border-subtle hover:border-cream-100",
                  )}
                  aria-label={`Use ${item.alt || item.url.split("/").pop()}`}
                >
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized={isUpload(item.url)}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-cream-400">
            The library is empty. Upload an image above instead.
          </p>
        )
      ) : null}
    </div>
  );
}
