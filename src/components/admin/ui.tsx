import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The admin design system.
 *
 * Denser and more neutral than the storefront — this is a working tool, so it
 * favours legibility and scanning over atmosphere. It shares the storefront's
 * palette and type so the two never feel like different products.
 */

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className="mb-9">
      {breadcrumb?.length ? (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-2 text-[0.66rem] uppercase tracking-[0.14em] text-cream-400">
            {breadcrumb.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-cream-100">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-cream-200">{crumb.label}</span>
                )}
                {index < breadcrumb.length - 1 ? (
                  <span aria-hidden className="text-border-strong">
                    /
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem] leading-tight text-cream-50" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-cream-400">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Card({
  children,
  className,
  title,
  description,
  actions,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={cn("border border-border-subtle bg-ink-800/60", className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div>
            {title ? <h2 className="text-[0.95rem] text-cream-50">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-xs text-cream-400">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: { value: number; label: string };
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const tones = {
    default: "border-border-subtle",
    warning: "border-gold-400/35",
    danger: "border-danger/40",
  };

  const body = (
    <>
      <p className="eyebrow text-cream-400">{label}</p>
      <p className="mt-3 text-[1.85rem] leading-none tabular-nums text-cream-50">{value}</p>

      {delta ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 text-xs tabular-nums",
            delta.value > 0 ? "text-leaf-300" : delta.value < 0 ? "text-[#e0a19c]" : "text-cream-400",
          )}
        >
          <span aria-hidden>{delta.value > 0 ? "▲" : delta.value < 0 ? "▼" : "—"}</span>
          {Math.abs(delta.value)}% {delta.label}
        </p>
      ) : null}

      {hint ? <p className="mt-3 text-xs text-cream-400">{hint}</p> : null}
    </>
  );

  return (
    <div
      className={cn(
        "border bg-ink-800/60 p-5 transition-colors",
        tones[tone],
        href && "hover:bg-ink-700/60",
      )}
    >
      {href ? (
        <Link href={href} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

export function Table({
  head,
  children,
  empty,
  className,
}: {
  head: (string | { label: string; align?: "left" | "right" | "center"; width?: string })[];
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            {head.map((column, index) => {
              const config = typeof column === "string" ? { label: column } : column;
              return (
                <th
                  key={`${config.label}-${index}`}
                  scope="col"
                  style={config.width ? { width: config.width } : undefined}
                  className={cn(
                    "px-4 py-3 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-cream-400",
                    config.align === "right" && "text-right",
                    config.align === "center" && "text-center",
                    (!config.align || config.align === "left") && "text-left",
                  )}
                >
                  {config.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">{children}</tbody>
      </table>

      {empty}
    </div>
  );
}

export function Td({
  children,
  align = "left",
  className,
  colSpan,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-4 py-3.5 align-middle text-cream-200",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("transition-colors hover:bg-white/[0.02]", className)}>{children}</tr>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "border-border-strong text-cream-300",
    success: "border-emerald-400/45 text-leaf-200",
    warning: "border-gold-400/45 text-gold-300",
    danger: "border-danger/45 text-[#e0a19c]",
    info: "border-border-strong text-cream-200",
  };

  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center text-sm text-cream-400">
        {children}
      </td>
    </tr>
  );
}

/** Section divider inside long admin forms. */
export function FieldGroup({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("grid gap-5 border-t border-border-subtle pt-7 first:border-t-0 first:pt-0", className)}>
      <legend className="sr-only">{title}</legend>
      <div>
        <h3 className="text-[0.95rem] text-cream-50">{title}</h3>
        {description ? (
          <p className="mt-1.5 max-w-[68ch] text-xs leading-relaxed text-cream-400">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </fieldset>
  );
}
