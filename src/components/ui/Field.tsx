"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Form controls. Every one is label-bound, and errors are wired through
 * aria-describedby + aria-invalid so screen readers announce them on focus.
 */

const CONTROL =
  "w-full rounded-none border border-border-subtle bg-ink-800 px-4 py-3 text-[0.95rem] " +
  "text-cream-50 placeholder:text-cream-400 transition-colors duration-200 " +
  "hover:border-border-strong focus:border-emerald-400 focus:bg-ink-700 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-[invalid=true]:border-danger";

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="eyebrow text-cream-400">
        {label}
        {required ? <span className="ml-1 text-gold-400">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-cream-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function Input({
  label,
  hint,
  error,
  id,
  className,
  wrapperClassName,
  required,
  ...props
}: InputProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <input
        id={fieldId}
        className={cn(CONTROL, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function Textarea({
  label,
  hint,
  error,
  id,
  className,
  wrapperClassName,
  required,
  rows = 5,
  ...props
}: TextareaProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <textarea
        id={fieldId}
        rows={rows}
        className={cn(CONTROL, "resize-y", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  wrapperClassName?: string;
};

export function Select({
  label,
  hint,
  error,
  options,
  id,
  className,
  wrapperClassName,
  required,
  ...props
}: SelectProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          id={fieldId}
          className={cn(CONTROL, "appearance-none pr-10", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          required={required}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-ink-800">
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-cream-400"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </FieldShell>
  );
}

export function Checkbox({
  label,
  id,
  className,
  description,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: string }) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={fieldId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border-strong bg-ink-800 transition-colors checked:border-emerald-400 checked:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-gold-400"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23faf8f2' stroke-width='2.5'%3E%3Cpath d='M3 8.5l3.2 3.2L13 5'/%3E%3C/svg%3E\")",
          backgroundSize: "0.85rem",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        {...props}
      />
      <label htmlFor={fieldId} className="cursor-pointer text-sm leading-snug text-cream-200">
        {label}
        {description ? (
          <span className="mt-0.5 block text-xs text-cream-400">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

/** Non-blocking form-level message, used for both success and failure. */
export function FormMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  if (!children) return null;
  // These were written for the dark ground: a pale pink error text and a white
  // wash that are both invisible on paper. Semantic tokens flip with the theme.
  const tones = {
    error: "border-danger/40 bg-danger/10 text-danger",
    success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-400",
    info: "border-border-subtle bg-ink-800 text-cream-200",
  };

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("border px-4 py-3 text-sm", tones[tone])}
    >
      {children}
    </p>
  );
}
