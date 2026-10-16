"use client";
import Link from "next/link";
import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { magneticButton } from "@/lib/motion";
// Rounded, bold, sentence-case buttons in the D2C style. "gold" is kept as a
// name because pages ask for it, but it now paints the berry offer colour —
// the second call to action next to the green primary (e.g. "Buy now").
const VARIANTS = {
  primary:
    "bg-emerald-500 text-on-accent shadow-sm hover:bg-emerald-600 disabled:hover:bg-emerald-500",
  secondary:
    "border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-on-accent",
  ghost: "text-cream-200 hover:text-cream-50 hover:bg-ink-800",
  gold: "bg-berry-500 text-white shadow-sm hover:bg-berry-400 disabled:hover:bg-berry-500",
  danger: "bg-danger text-white hover:brightness-110",
};
const SIZES = {
  sm: "h-9 px-4 text-[0.8rem]",
  md: "h-11 px-6 text-[0.88rem]",
  lg: "h-13 px-8 text-[0.95rem]",
};
const BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-bold " +
  "transition-colors duration-300 ease-[var(--ease-swift)] " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold-400";
/**
 * Magnetic pull is opt-in and automatically inert on touch devices and under
 * reduced-motion, so it can be left on for primary calls to action everywhere.
 */
function useMagnetic(enabled, strength) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    return magneticButton(ref.current, { strength });
  }, [enabled, strength]);
  return ref;
}
export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    magnetic = false,
    magneticStrength = 0.25,
    loading = false,
    icon,
    className,
    children,
    disabled,
    ...props
  },
  forwardedRef,
) {
  const magneticRef = useMagnetic(magnetic, magneticStrength);
  return (
    <button
      ref={(node) => {
        magneticRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
    </button>
  );
});
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  magnetic = false,
  magneticStrength = 0.25,
  className,
  children,
  icon,
  prefetch,
  ...props
}) {
  const magneticRef = useMagnetic(magnetic, magneticStrength);
  const isExternal = /^https?:\/\//.test(href);
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);
  if (isExternal) {
    return (
      <a
        ref={magneticRef}
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
      >
        {icon}
        <span>{children}</span>
      </a>
    );
  }
  return (
    <Link
      ref={magneticRef}
      href={href}
      prefetch={prefetch}
      className={classes}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
function Spinner() {
  return (
    <span
      className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
      aria-hidden
    />
  );
}
/**
 * A text link with a rule that wipes in from the left on hover. Used for
 * inline navigation where a full button would be too loud.
 */
export function UnderlineLink({ href, children, className }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center text-cream-200 transition-colors hover:text-cream-50",
        className,
      )}
    >
      <span>{children}</span>
      <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-gold-400 transition-transform duration-500 ease-[var(--ease-organic)] group-hover:origin-left group-hover:scale-x-100" />
    </Link>
  );
}
