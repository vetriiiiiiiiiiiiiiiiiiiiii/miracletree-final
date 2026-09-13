"use client";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { stripHtml } from "@/lib/utils";
const COMMANDS = [
  { label: "H2", title: "Heading", wrap: ["<h2>", "</h2>"], block: true },
  { label: "H3", title: "Subheading", wrap: ["<h3>", "</h3>"], block: true },
  { label: "P", title: "Paragraph", wrap: ["<p>", "</p>"], block: true },
  { label: "B", title: "Bold", wrap: ["<strong>", "</strong>"] },
  { label: "I", title: "Italic", wrap: ["<em>", "</em>"] },
  { label: "Link", title: "Link", wrap: ['<a href="">', "</a>"] },
  {
    label: "List",
    title: "Bulleted list",
    wrap: ["<ul>\n  <li>", "</li>\n</ul>"],
    block: true,
  },
  {
    label: "Quote",
    title: "Quote",
    wrap: ["<blockquote>", "</blockquote>"],
    block: true,
  },
];
/**
 * A deliberately small HTML editor.
 *
 * It writes the same limited markup the sanitiser allows, so what an editor
 * types is exactly what renders — no invisible spans, no pasted Word styling,
 * no WYSIWYG library shipping 200KB to the admin bundle. The preview shows the
 * real storefront prose styles.
 */
export function RichTextEditor({ label, value, onChange, rows = 14 }) {
  const id = useId();
  const textareaRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const apply = (command) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const selected = value.slice(start, end);
    const [open, close] = command.wrap;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const prefix = command.block && before && !before.endsWith("\n") ? "\n" : "";
    const next = `${before}${prefix}${open}${selected}${close}${after}`;
    onChange(next);
    // Put the caret inside the new tags so typing continues naturally.
    requestAnimationFrame(() => {
      const caret = start + prefix.length + open.length + selected.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };
  const words = stripHtml(value).split(/\s+/).filter(Boolean).length;
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={id} className="eyebrow text-cream-400">
          {label}
        </label>
        <div className="flex items-center gap-3 text-xs text-cream-400">
          <span className="tabular-nums">{words} words</span>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="underline underline-offset-4 hover:text-cream-100"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      {!preview ? (
        <>
          <div className="flex flex-wrap gap-1 border border-b-0 border-border-subtle bg-white/[0.02] p-1.5">
            {COMMANDS.map((command) => (
              <button
                key={command.label}
                type="button"
                title={command.title}
                onClick={() => apply(command)}
                className="border border-transparent px-2.5 py-1.5 text-xs text-cream-300 transition-colors hover:border-border-subtle hover:text-cream-50"
              >
                {command.label}
              </button>
            ))}
          </div>

          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={rows}
            spellCheck
            className={cn(
              "w-full border border-border-subtle bg-white/[0.03] px-4 py-3 font-mono text-[0.82rem] leading-relaxed",
              "text-cream-100 focus:border-emerald-400 focus:outline-none",
            )}
          />

          <p className="text-xs text-cream-400">
            Allowed: headings, paragraphs, lists, links, emphasis, quotes, tables and
            images. Anything else is stripped when saved.
          </p>
        </>
      ) : (
        <div className="min-h-[16rem] border border-border-subtle bg-white/[0.02] p-6">
          {value.trim() ? (
            <div
              className="prose-botanical"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <p className="text-sm text-cream-400">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
