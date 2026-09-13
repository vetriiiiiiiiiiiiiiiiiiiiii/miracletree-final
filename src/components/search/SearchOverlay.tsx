"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import type { SearchHit } from "@/app/api/search/route";

const RECENT_KEY = "mt_recent_searches";

/**
 * Global search. Results arrive as you type (debounced, with the previous
 * request aborted), and the list is fully keyboard-navigable: ↑/↓ to move,
 * Enter to open, Escape to close.
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [fallback, setFallback] = useState<SearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<{ label: string; href: string }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 5));
    } catch {
      setRecent([]);
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const id = window.setTimeout(async () => {
      setLoading(term.trim().length >= 2);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setHits(data.hits ?? []);
        setFallback(data.fallback ?? []);
        setSuggestions(data.suggestions ?? []);
        setActive(0);
        if (term.trim().length >= 2) {
          analytics.search(term.trim(), (data.hits ?? []).length);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
  }, [term, open]);

  const remember = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    try {
      const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {
      // Private browsing — recent searches are a convenience, not a requirement.
    }
  }, [recent]);

  const go = useCallback(
    (href: string) => {
      remember(term);
      onClose();
      router.push(href);
    },
    [onClose, remember, router, term],
  );

  const results = hits.length ? hits : fallback;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[active];
      if (target) go(target.href);
      else if (term.trim()) go(`/shop?q=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Search" side="top" className="max-h-[92dvh]">
      <div className="border-b border-border-subtle px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 text-cream-400">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            type="search"
            placeholder="Search products, ingredients, articles…"
            aria-label="Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `search-hit-${results[active].id}` : undefined}
            className="w-full bg-transparent py-3 text-lg text-cream-50 placeholder:text-cream-400 focus:outline-none md:text-xl"
          />
          {loading ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border border-cream-400 border-t-transparent" aria-hidden />
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-border-subtle px-2 py-1 text-[0.65rem] uppercase tracking-widest text-cream-400 hover:text-cream-100"
          >
            Esc
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          {term.trim().length < 2 ? (
            <div className="grid gap-8">
              {recent.length ? (
                <Group title="Recent">
                  <div className="flex flex-wrap gap-2">
                    {recent.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTerm(item)}
                        className="border border-border-subtle px-3 py-1.5 text-sm text-cream-300 hover:border-border-strong hover:text-cream-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </Group>
              ) : null}

              <Group title="Browse">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.href}
                      type="button"
                      onClick={() => go(s.href)}
                      className="border border-border-subtle px-3 py-1.5 text-sm text-cream-300 hover:border-border-strong hover:text-cream-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Group>
            </div>
          ) : (
            <>
              {hits.length === 0 && !loading ? (
                <p className="mb-6 text-sm text-cream-400">
                  Nothing matched &ldquo;{term}&rdquo;. Here is what people buy most.
                </p>
              ) : null}

              <ul id="search-results" role="listbox" aria-label="Search results" className="grid gap-1">
                {results.map((hit, index) => (
                  <li key={`${hit.kind}-${hit.id}`}>
                    <button
                      type="button"
                      id={`search-hit-${hit.id}`}
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(hit.href)}
                      className={cn(
                        "flex w-full items-center gap-4 border border-transparent px-3 py-3 text-left transition-colors",
                        index === active ? "border-border-subtle bg-white/[0.05]" : "hover:bg-white/[0.03]",
                      )}
                    >
                      <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden bg-ink-800">
                        {hit.image ? (
                          <Image src={hit.image} alt="" fill sizes="48px" className="object-contain p-1" />
                        ) : (
                          <KindIcon kind={hit.kind} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-cream-50">{hit.title}</span>
                        {hit.subtitle ? (
                          <span className="block truncate text-xs text-cream-400">{hit.subtitle}</span>
                        ) : null}
                      </span>
                      {hit.price !== null ? (
                        <span className="shrink-0 text-sm tabular-nums text-cream-200">
                          {formatPrice(hit.price)}
                        </span>
                      ) : (
                        <span className="eyebrow shrink-0 text-cream-400">{hit.kind}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {term.trim().length >= 2 ? (
                <button
                  type="button"
                  onClick={() => go(`/shop?q=${encodeURIComponent(term.trim())}`)}
                  className="mt-6 w-full border border-border-subtle py-3 text-center text-[0.7rem] uppercase tracking-[0.16em] text-cream-300 hover:border-border-strong hover:text-cream-50"
                >
                  See all results for &ldquo;{term.trim()}&rdquo;
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="eyebrow mb-3 text-cream-400">{title}</h3>
      {children}
    </section>
  );
}

function KindIcon({ kind }: { kind: SearchHit["kind"] }) {
  const glyphs: Record<SearchHit["kind"], string> = {
    product: "M4 6h12l-1 11H5L4 6z",
    article: "M4 3h12v14H4zM7 7h6M7 10h6M7 13h4",
    faq: "M7 7a3 3 0 1 1 3 3v2M10 15.5v.5",
    category: "M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z",
    ingredient: "M10 17V7M10 12c0-3-2.2-5-5.2-5.2C4.6 9.8 6.8 12 10 12z",
  };

  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="text-cream-400">
      <path d={glyphs[kind]} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
