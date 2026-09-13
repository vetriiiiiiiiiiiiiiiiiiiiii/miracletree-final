"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { Card, Pill } from "@/components/admin/ui";
import {
  reorderSectionsAction,
  saveSectionAction,
  toggleSectionAction,
} from "@/app/actions/admin/content";
import { cn } from "@/lib/utils";
const INITIAL = { status: "idle" };
/**
 * The homepage builder.
 *
 * Sections expand in place rather than opening a separate screen, so the
 * running order stays visible while any one of them is edited. Reordering is
 * done with explicit up/down buttons rather than drag — it works from the
 * keyboard, it works on touch, and there are only eleven rows.
 */
export function HomepageBuilder({ sections }) {
  const router = useRouter();
  const [order, setOrder] = useState(sections);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  useEffect(() => setOrder(sections), [sections]);
  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setOrder(next);
    setBusy(true);
    await reorderSectionsAction(next.map((section) => section.key));
    setBusy(false);
    startTransition(() => router.refresh());
  };
  const toggle = async (key, isActive) => {
    setBusy(true);
    setOrder((current) =>
      current.map((section) =>
        section.key === key ? { ...section, isActive } : section,
      ),
    );
    await toggleSectionAction(key, isActive);
    setBusy(false);
    startTransition(() => router.refresh());
  };
  return (
    <ol className="grid gap-3">
      {order.map((section, index) => (
        <li key={section.key}>
          <Card padded={false} className={cn(!section.isActive && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-4 px-5 py-4">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0 || busy}
                  aria-label={`Move ${section.label} up`}
                  className="grid h-5 w-5 place-items-center text-cream-400 transition-colors hover:text-cream-50 disabled:opacity-25"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path
                      d="M1 6.5L5 2.5l4 4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => void move(index, 1)}
                  disabled={index === order.length - 1 || busy}
                  aria-label={`Move ${section.label} down`}
                  className="grid h-5 w-5 place-items-center text-cream-400 transition-colors hover:text-cream-50 disabled:opacity-25"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path
                      d="M1 3.5L5 7.5l4-4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[0.95rem] text-cream-50">{section.label}</h2>
                  {!section.isActive ? <Pill>Hidden</Pill> : null}
                </div>
                <p className="mt-1 truncate text-xs text-cream-400">
                  {section.title || section.hint}
                </p>
              </div>

              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-cream-400">
                <span className="sr-only sm:not-sr-only">Visible</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={section.isActive}
                  aria-label={`${section.isActive ? "Hide" : "Show"} ${section.label}`}
                  disabled={busy}
                  onClick={() => void toggle(section.key, !section.isActive)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 border transition-colors",
                    section.isActive
                      ? "border-emerald-400 bg-emerald-600/50"
                      : "border-border-strong bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1/2 h-3 w-3 -translate-y-1/2 transition-all duration-300",
                      section.isActive
                        ? "left-[1.15rem] bg-leaf-200"
                        : "left-1 bg-cream-400",
                    )}
                    aria-hidden
                  />
                </button>
              </label>

              <button
                type="button"
                onClick={() => setOpen(open === section.key ? null : section.key)}
                aria-expanded={open === section.key}
                className="shrink-0 border border-border-strong px-4 py-2 text-[0.64rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100"
              >
                {open === section.key ? "Close" : "Edit"}
              </button>
            </div>

            {open === section.key ? (
              <SectionForm section={section} onSaved={() => router.refresh()} />
            ) : null}
          </Card>
        </li>
      ))}
    </ol>
  );
}
function SectionForm({ section, onSaved }) {
  const [state, action] = useActionState(saveSectionAction, INITIAL);
  useEffect(() => {
    if (state.status === "success") onSaved();
  }, [state, onSaved]);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  return (
    <form action={action} className="grid gap-5 border-t border-border-subtle p-5">
      <input type="hidden" name="key" value={section.key} />
      <input type="hidden" name="position" value={section.position} />
      <input
        type="hidden"
        name="isActive"
        value={section.isActive ? "true" : "false"}
      />

      <p className="text-xs leading-relaxed text-cream-400">{section.hint}</p>

      {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}
      {state.status === "success" ? (
        <FormMessage tone="success">{state.message}</FormMessage>
      ) : null}

      <Input label="Title" name="title" defaultValue={section.title} maxLength={200} />

      <Textarea
        label="Subtitle"
        name="subtitle"
        rows={2}
        maxLength={400}
        defaultValue={section.subtitle}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Button label" name="ctaLabel" defaultValue={section.ctaLabel} />
        <Input
          label="Button link"
          name="ctaHref"
          defaultValue={section.ctaHref}
          placeholder="/shop"
        />
      </div>

      <Input
        label="Image URL"
        name="mediaUrl"
        defaultValue={section.mediaUrl}
        hint="Optional. Leave blank to use the default product photography."
      />

      {section.key === "hero" ? (
        <Textarea
          label="Extra data (JSON)"
          name="data"
          rows={3}
          defaultValue={section.data}
          hint='Hero only. e.g. {"secondaryLabel":"Discover moringa","secondaryHref":"/moringa"}'
          error={errors.data}
        />
      ) : (
        <input type="hidden" name="data" value={section.data} />
      )}

      <SaveSection />
    </form>
  );
}
function SaveSection() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="justify-self-start bg-emerald-500 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save section"}
    </button>
  );
}
