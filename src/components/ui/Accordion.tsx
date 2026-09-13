"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Accordion built on measured height rather than `height: auto` transitions, so
 * the open/close animation is smooth without a layout-thrashing keyframe.
 * Buttons carry aria-expanded/aria-controls, so it works from the keyboard.
 */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen,
  className,
}: {
  items: { id: string; question: ReactNode; answer: ReactNode; meta?: ReactNode }[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}) {
  const [open, setOpen] = useState<string[]>(defaultOpen ?? []);

  const toggle = (id: string) => {
    setOpen((current) => {
      if (current.includes(id)) return current.filter((c) => c !== id);
      return allowMultiple ? [...current, id] : [id];
    });
  };

  return (
    <div className={cn("divide-y divide-border-subtle border-y border-border-subtle", className)}>
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          question={item.question}
          answer={item.answer}
          meta={item.meta}
          isOpen={open.includes(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  );
}

function AccordionRow({
  question,
  answer,
  meta,
  isOpen,
  onToggle,
}: {
  question: ReactNode;
  answer: ReactNode;
  meta?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId();

  return (
    <div className="group">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-cream-50"
        >
          <span className="flex-1 text-[1.05rem] leading-snug text-cream-100 md:text-[1.15rem]">
            {question}
          </span>
          <span
            className={cn(
              "relative mt-1.5 h-3 w-3 shrink-0 transition-transform duration-500 ease-[var(--ease-organic)]",
              isOpen && "rotate-45",
            )}
            aria-hidden
          >
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gold-400" />
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gold-400" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className="overflow-hidden transition-[height,opacity] duration-500 ease-[var(--ease-organic)]"
        style={{
          height: isOpen ? contentRef.current?.scrollHeight ?? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pb-7 pr-10">
          <div className="prose-botanical text-[0.95rem]">{answer}</div>
          {meta ? <div className="mt-3 text-xs text-cream-400">{meta}</div> : null}
        </div>
      </div>
    </div>
  );
}
