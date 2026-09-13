import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
/**
 * The site's empty and error states. Each one names what happened and offers a
 * way forward — a dead end with a shrug is the one thing they must never be.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  icon = "leaf",
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 border border-border-subtle px-8 py-20 text-center",
        className,
      )}
    >
      <Glyph name={icon} />

      <div className="max-w-[46ch]">
        <h2 className="text-title text-cream-50">{title}</h2>
        <p className="mt-4 leading-relaxed text-cream-400">{body}</p>
      </div>

      {actionLabel && actionHref ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <LinkButton href={actionHref} size="md" magnetic>
            {actionLabel}
          </LinkButton>
          {secondaryLabel && secondaryHref ? (
            <LinkButton href={secondaryHref} variant="secondary" size="md">
              {secondaryLabel}
            </LinkButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
function Glyph({ name }) {
  const paths = {
    leaf: (
      <>
        <path d="M20 34C20 34 6 28 6 16C6 9 12 4 20 4C28 4 34 9 34 16C34 28 20 34 20 34Z" />
        <path d="M20 34V10" />
      </>
    ),
    bag: (
      <>
        <path d="M9 12h22l-2 22H11L9 12z" />
        <path d="M15.5 12V9.5a4.5 4.5 0 0 1 9 0V12" />
      </>
    ),
    search: (
      <>
        <circle cx="17" cy="17" r="11" />
        <path d="M25 25l9 9" />
      </>
    ),
    heart: (
      <path d="M20 33s-13-8.2-13-17.6A7.6 7.6 0 0 1 20 11a7.6 7.6 0 0 1 13 4.4C33 24.8 20 33 20 33z" />
    ),
  };
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-border-subtle"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
