"use client";

import { useEffect, useRef } from "react";
import { initMotion, parallax, prefersReducedMotion } from "@/lib/motion";

/**
 * Lets a block drift against the scroll so it reads as sitting slightly off
 * the page rather than glued to it.
 *
 * The travel is deliberately small. `parallax()` moves in `yPercent` — a
 * share of the element's own height, not pixels — so a value that looks
 * modest is not: 14 would slide a tall card almost a third of its height and
 * tear it away from whatever it sits beside. Three percent is enough to be
 * felt and not enough to be caught.
 *
 * It wraps the existing `parallax()` factory rather than reimplementing it, so
 * there is still one place where ScrollTrigger is configured, and it does
 * nothing at all under reduced motion.
 */
export function Floating({
  children,
  amount = 3,
  className,
}: {
  children: React.ReactNode;
  /** Travel as a percentage of the element's own height, each way. */
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const node = ref.current;
    if (!node) return;

    initMotion();
    const trigger = parallax(node, { amount, trigger: node });
    return () => trigger?.kill();
  }, [amount]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
