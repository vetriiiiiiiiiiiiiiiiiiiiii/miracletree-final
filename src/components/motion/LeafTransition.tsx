"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Route changes wipe through a leaf rather than cutting.
 *
 * A row of leaflets sweeps across, meets in the middle to cover the seam, then
 * parts again — the same shape as the cursor, so the site keeps one vocabulary.
 *
 * Two constraints shaped this.
 *
 * It never blocks. The overlay is `pointer-events-none` for its whole life and
 * is driven purely by CSS animation, so a transition that fails to finish — a
 * dropped frame, a backgrounded tab, a route that errors — cannot leave the
 * page uninteractive. A page transition that can trap a shopper is worse than
 * no page transition.
 *
 * And it does not re-run React. It listens to the pathname and animates a fixed
 * overlay; it does not wrap children, hold them back, or clone them. Every
 * previous attempt in this codebase at animating around React-owned DOM ended
 * in `removeChild: node is not a child`.
 */

/** How long the sweep runs. Kept short: this sits between a click and content. */
const SWEEP_MS = 620;

/** Leaflets across the screen. Odd, so one is centred. */
const BLADES = 9;

export function LeafTransition() {
  const pathname = usePathname();
  const [running, setRunning] = useState(false);
  const first = useRef(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    // Nothing on first paint — the arrival is not a transition.
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;

    setRunning(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRunning(false), SWEEP_MS);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [pathname]);

  if (!running) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
    >
      {Array.from({ length: BLADES }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 h-full origin-bottom"
          style={{
            left: `${(i / BLADES) * 100}%`,
            width: `${100 / BLADES + 0.4}%`,
            background:
              "linear-gradient(180deg, #16240f 0%, #24401a 45%, #16240f 100%)",
            // Each blade leaves and returns a beat after the one before it, so
            // the wipe reads as a sweep rather than a shutter.
            animation: `leaf-wipe ${SWEEP_MS}ms cubic-bezier(0.65, 0, 0.35, 1) ${
              i * 22
            }ms both`,
            clipPath:
              "polygon(50% 0%, 100% 22%, 100% 78%, 50% 100%, 0% 78%, 0% 22%)",
          }}
        />
      ))}
    </div>
  );
}
