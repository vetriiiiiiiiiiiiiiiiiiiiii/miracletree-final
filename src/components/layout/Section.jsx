import { cn } from "@/lib/utils";
import { SplitText } from "@/components/motion/SplitText";
export function Container({
  children,
  className,
  size = "default",
  as: Tag = "div",
}) {
  const sizes = {
    narrow: "max-w-3xl",
    default: "max-w-[88rem]",
    wide: "max-w-[100rem]",
    full: "max-w-none",
  };
  const El = Tag;
  return (
    <El className={cn("mx-auto w-full gutter", sizes[size], className)}>
      {children}
    </El>
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
}) {
  const tones = {
    default: "bg-ink text-cream-100",
    raised: "bg-ink-800 text-cream-100",
    forest: "bg-forest-900 text-cream-100",
    cream: "bg-cream-100 text-ink-900",
  };
  // Tightened for the D2C layout: the editorial spacing (up to 192px above
  // and below a section) left gaps that read as the end of the page.
  const spacings = {
    none: "",
    tight: "py-10 md:py-12",
    default: "py-12 md:py-16",
    loose: "py-16 md:py-20",
  };
  const El = Tag;
  return (
    <El
      id={id}
      className={cn(tones[tone], spacings[spacing], className)}
      {...rest}
    >
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
        <SplitText
          as="h2"
          text={title}
          className="max-w-[18ch] text-title text-cream-50"
        />
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
export function Rule({ className }) {
  return (
    <div
      className={cn("h-px w-full bg-border-subtle", className)}
      aria-hidden
    />
  );
}
