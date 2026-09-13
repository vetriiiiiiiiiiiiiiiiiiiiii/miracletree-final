import { cn } from "@/lib/utils";
import { SplitText } from "@/components/motion/SplitText";
import type { ReactNode, Ref } from "react";

/**
 * DOM tags only, deliberately not React's `ElementType`.
 *
 * React Three Fiber merges its ~150 three.js elements into the global
 * `JSX.IntrinsicElements`. `ElementType` spans that whole union, and the
 * intersection of its props collapses `children` to `never` — so every
 * polymorphic component in the app stopped type-checking the moment R3F was
 * installed for the Our Story flight. These wrappers only ever render HTML.
 */
export type HtmlTag = keyof HTMLElementTagNameMap;

/**
 * One permissive signature for a polymorphic tag.
 *
 * Rendering `<Tag>` where Tag is a union of every HTML tag makes TypeScript
 * intersect their props, and `ref` then has to satisfy HTMLObjectElement and
 * HTMLElement at once, which nothing does. These components genuinely accept
 * any HTML element and a matching ref, so the cast states that once rather than
 * spreading `any` through the call sites.
 */
export type PolymorphicTag = React.ComponentType<
  React.HTMLAttributes<HTMLElement> & {
    ref?: React.Ref<HTMLElement>;
    id?: string;
    "aria-label"?: string;
    "data-reveal-root"?: boolean;
    dangerouslySetInnerHTML?: { __html: string };
  }
>;


export function Container({
  children,
  className,
  size = "default",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide" | "full";
  as?: HtmlTag;
}) {
  const sizes = {
    narrow: "max-w-3xl",
    default: "max-w-[88rem]",
    wide: "max-w-[100rem]",
    full: "max-w-none",
  };

  const El = Tag as unknown as PolymorphicTag;

  return (
    <El className={cn("mx-auto w-full gutter", sizes[size], className)}>{children}</El>
  );
}

export function Section({
  children,
  className,
  id,
  tone = "default",
  spacing = "default",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "raised" | "forest" | "cream";
  spacing?: "none" | "tight" | "default" | "loose";
  as?: HtmlTag;
  /** React 19 passes refs to function components as an ordinary prop. */
  ref?: Ref<HTMLElement>;
  "aria-label"?: string;
}) {
  const tones = {
    default: "bg-ink text-cream-100",
    raised: "bg-ink-800 text-cream-100",
    forest: "bg-forest-900 text-cream-100",
    cream: "bg-cream-100 text-ink-900",
  };

  const spacings = {
    none: "",
    tight: "py-16 md:py-20",
    default: "py-24 md:py-32",
    loose: "py-32 md:py-48",
  };

  const El = Tag as unknown as PolymorphicTag;

  return (
    <El id={id} className={cn(tones[tone], spacings[spacing], className)} {...rest}>
      {children}
    </El>
  );
}

/**
 * The recurring section header: numbered eyebrow, display title, lede.
 * Numbering reinforces the homepage's chapter structure.
 */
export function SectionHeading({
  title,
  lede,
  align = "left",
  className,
  children,
}: {
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {/* A plain string can be taken apart and animated word by word; a
          composed node (a highlighted fragment, a line break) cannot be, and
          is rendered as given rather than guessed at. */}
      {typeof title === "string" ? (
        <SplitText as="h2" text={title} className="max-w-[18ch] text-title text-cream-50" />
      ) : (
        <h2 className="max-w-[18ch] text-title text-cream-50">{title}</h2>
      )}

      {lede ? (
        <p
          className={cn(
            "max-w-[52ch] text-[1.05rem] leading-relaxed text-cream-300",
            align === "center" && "mx-auto",
          )}
        >
          {lede}
        </p>
      ) : null}

      {children}
    </div>
  );
}

/** A hairline rule that only exists to give a section a top edge. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border-subtle", className)} aria-hidden />;
}
