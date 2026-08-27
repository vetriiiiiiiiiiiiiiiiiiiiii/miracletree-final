"use client";

import Link from "next/link";
import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { magneticButton } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-emerald-500 text-cream-50 hover:bg-emerald-400 disabled:hover:bg-emerald-500",
  secondary:
    "border border-white/25 text-cream-100 hover:border-cream-100 hover:bg-white/[0.04]",
  ghost: "text-cream-200 hover:text-cream-50 hover:bg-white/[0.04]",
  gold: "bg-gold-400 text-ink hover:bg-gold-300 disabled:hover:bg-gold-400",
  danger: "bg-danger text-cream-50 hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.7rem] tracking-[0.14em]",
  md: "h-11 px-6 text-[0.72rem] tracking-[0.16em]",
  lg: "h-14 px-9 text-[0.75rem] tracking-[0.18em]",
};

const BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-none font-medium uppercase " +
  "transition-colors duration-300 ease-[var(--ease-swift)] " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold-400";

/**
 * Magnetic pull is opt-in and automatically inert on touch devices and under
 * reduced-motion, so it can be left on for primary calls to action everywhere.
 */
function useMagnetic(enabled: boolean, strength: number) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    return magneticButton(ref.current, { strength });
  }, [enabled, strength]);

  return ref;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  magneticStrength?: number;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
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
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  magneticStrength?: number;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  prefetch?: boolean;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  const magneticRef = useMagnetic(magnetic, magneticStrength);
  const isExternal = /^https?:\/\//.test(href);

  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (isExternal) {
    return (
      <a
        ref={magneticRef as React.Ref<HTMLAnchorElement>}
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
      ref={magneticRef as React.Ref<HTMLAnchorElement>}
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
export function UnderlineLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
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
