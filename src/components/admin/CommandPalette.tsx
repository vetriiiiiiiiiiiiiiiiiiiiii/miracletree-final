"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/money";

export type Command = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  run: () => void;
};

type SearchResult = {
  kind: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  price: number | null;
};

/**
 * ⌘K palette.
 *
 * Static commands (navigation, "new product") are matched locally and appear
 * instantly; product and content matches are fetched from the same search
 * endpoint the storefront uses, so admin search and shopper search never drift
 * apart.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  // See Drawer: portals must not appear on the first client render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActive(0);
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  // Remote lookup for catalogue and content, debounced and abortable.
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setResults((data.hits ?? []).slice(0, 6));
      } catch {
        setResults([]);
      }
    }, 200);

    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
  }, [query, open]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.group}`.toLowerCase().includes(term),
    );
  }, [commands, query]);

  const entries = useMemo(
    () => [
      ...filtered.map((command) => ({ type: "command" as const, command })),
      ...results.map((result) => ({ type: "result" as const, result })),
    ],
    [filtered, results],
  );

  useEffect(() => setActive(0), [entries.length]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => Math.min(i + 1, entries.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const entry = entries[active];
        if (!entry) return;
        onClose();
        if (entry.type === "command") entry.command.run();
        else router.push(adminHref(entry.result));
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, entries, active, onClose, router]);

  if (!open || !mounted) return null;

  let lastGroup = "";

  return createPortal(
    <div className="fixed inset-0 z-[400]">
      <div className="absolute inset-0 bg-ink/75 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="absolute left-1/2 top-[12vh] w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2 border border-white/12 bg-ink-900/95 shadow-[0_0_80px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden className="text-cream-400">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, orders, pages…"
            aria-label="Search"
            className="w-full bg-transparent text-[0.95rem] text-cream-50 placeholder:text-cream-400/60 focus:outline-none"
          />
          <kbd className="shrink-0 border border-white/15 px-1.5 py-0.5 text-[0.6rem] text-cream-400">
            Esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-2">
          {entries.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-cream-400">
              Nothing matched &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul role="listbox" aria-label="Results">
              {entries.map((entry, index) => {
                const group = entry.type === "command" ? entry.command.group : "Catalogue";
                const showGroup = group !== lastGroup;
                lastGroup = group;

                const label =
                  entry.type === "command" ? entry.command.label : entry.result.title;
                const subtitle =
                  entry.type === "command"
                    ? entry.command.hint
                    : entry.result.subtitle;

                return (
                  <li key={`${entry.type}-${index}`}>
                    {showGroup ? (
                      <p className="px-4 pb-1.5 pt-3 text-[0.58rem] uppercase tracking-[0.18em] text-cream-400/60">
                        {group}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => {
                        onClose();
                        if (entry.type === "command") entry.command.run();
                        else router.push(adminHref(entry.result));
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        index === active ? "bg-white/[0.06] text-cream-50" : "text-cream-200",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{label}</span>
                        {subtitle ? (
                          <span className="block truncate text-xs text-cream-400">
                            {subtitle}
                          </span>
                        ) : null}
                      </span>

                      {entry.type === "result" && entry.result.price !== null ? (
                        <span className="shrink-0 text-xs tabular-nums text-cream-400">
                          {formatPrice(entry.result.price)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center gap-4 border-t border-white/10 px-4 py-2.5 text-[0.62rem] text-cream-400">
          <span>↑↓ to navigate</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/** Search returns storefront URLs; admin wants the editing screen instead. */
function adminHref(result: SearchResult): string {
  if (result.kind === "product") {
    const slug = result.href.replace("/product/", "");
    return `/admin/products?q=${encodeURIComponent(slug)}`;
  }
  if (result.kind === "article") return "/admin/journal";
  if (result.kind === "faq") return "/admin/content/faqs";
  return result.href;
}
