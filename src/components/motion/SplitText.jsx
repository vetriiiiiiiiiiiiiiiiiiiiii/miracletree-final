"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
/**
 * A heading that rises into place a word at a time.
 *
 * Each word sits in its own clipping box and starts below it, so the line
 * appears to be uncovered rather than to fade in — the difference between a
 * title that arrives and one that merely becomes opaque.
 *
 * Three things keep it from being the usual liability:
 *
 * - The real string stays on the wrapper as `aria-label` and every fragment is
 *   `aria-hidden`, so a screen reader reads one heading rather than eleven
 *   disconnected words.
 * - Word boundaries are preserved as real spaces, so selecting and copying the
 *   heading yields the sentence, not `Fromthemiracletree`.
 * - Nothing is hidden until the effect has confirmed motion is wanted. If the
 *   JavaScript never runs, or the visitor asked for less motion, the words are
 *   simply there.
 */
export function SplitText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 0.045,
}) {
  const ref = useRef(null);
  const [play, setPlay] = useState(false);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    setArmed(true);
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setPlay(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlay(true);
          observer.disconnect();
        }
      },
      // A heading should be committed to before it is fully on screen,
      // otherwise it finishes animating after the reader has reached it.
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const words = text.split(/(\s+)/);
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => {
        if (/^\s+$/.test(word)) return " ";
        return (
          <span
            key={`${word}-${i}`}
            aria-hidden
            // `inline-block` on the clip box would break the baseline of a
            // wrapped heading, so the clip is only applied while animating.
            className={cn("inline-block", armed && "overflow-hidden align-bottom")}
          >
            <span
              className="inline-block"
              style={
                armed
                  ? {
                      transform: play ? "none" : "translate3d(0, 110%, 0)",
                      opacity: play ? 1 : 0,
                      transition: `transform 0.75s var(--ease-organic) ${delay + i * stagger * 0.5}s, opacity 0.5s linear ${delay + i * stagger * 0.5}s`,
                    }
                  : undefined
              }
            >
              {word}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
