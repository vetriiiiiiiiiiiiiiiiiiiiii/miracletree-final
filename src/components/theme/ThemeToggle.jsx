"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
/**
 * The sun/moon switch in the header.
 *
 * It renders a fixed-size placeholder until mounted. The server cannot know
 * which theme the visitor pinned — the inline script decides that after the
 * HTML is sent — so drawing a real icon during SSR would mean hydrating the
 * wrong one, and reserving the space avoids the header re-flowing when the
 * right one arrives.
 *
 * The sun and moon are one shape morphing rather than two icons swapping: a
 * circle that shrinks behind an offset mask to become a crescent, with the rays
 * scaling out around it.
 */
export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span className={cn("inline-block h-10 w-10", className)} aria-hidden />;
  }
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={cn(
        "group inline-flex h-10 w-10 items-center justify-center text-cream-200 transition-colors hover:text-cream-50",
        className,
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="overflow-visible"
      >
        <defs>
          {/* The crescent is the disc minus a second disc sliding in from the
            top-right. Animating the cut-out's position is what turns the sun
            into a moon without a second path. */}
          <mask id="mt-theme-mask">
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <circle
              cx={isDark ? 17 : 26}
              cy={isDark ? 7 : -2}
              r="8"
              fill="black"
              style={{
                transition: "cx 0.5s var(--ease-organic), cy 0.5s var(--ease-organic)",
              }}
            />
          </mask>
        </defs>

        <circle
          cx="12"
          cy="12"
          r={isDark ? 8.5 : 5}
          fill="currentColor"
          mask="url(#mt-theme-mask)"
          style={{ transition: "r 0.5s var(--ease-organic)" }}
        />

        <g
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            transformOrigin: "center",
            transform: isDark ? "scale(0.4) rotate(-45deg)" : "scale(1) rotate(0deg)",
            opacity: isDark ? 0 : 1,
            transition:
              "transform 0.5s var(--ease-organic), opacity 0.35s var(--ease-swift)",
          }}
        >
          <path d="M12 1.6v2.2" />
          <path d="M12 20.2v2.2" />
          <path d="M22.4 12h-2.2" />
          <path d="M3.8 12H1.6" />
          <path d="M19.4 4.6 17.8 6.2" />
          <path d="M6.2 17.8 4.6 19.4" />
          <path d="M19.4 19.4 17.8 17.8" />
          <path d="M6.2 6.2 4.6 4.6" />
        </g>
      </svg>
    </button>
  );
}
/**
 * The three-way control — Light / Dark / System — for places with room to
 * explain themselves: the mobile menu and the footer. The header keeps the
 * one-tap toggle instead, because a segmented control at 40px tall is a worse
 * target than a single button.
 */
export function ThemeSegmented({ className }) {
  const { setting, setSetting } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const options = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-px rounded-full border border-border-subtle bg-ink-800/60 p-px",
        className,
      )}
    >
      {options.map((option) => {
        // Before mount nothing is marked active: the stored setting is not
        // knowable server-side, and guessing would flash the wrong pill.
        const active = mounted && setting === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setSetting(option.value)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
              active
                ? "bg-emerald-500 text-on-accent"
                : "text-cream-300 hover:text-cream-50",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
