"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * The order-confirmation moment: leaves drifting down, once, and then gone.
 *
 * Botanical rather than confetti, brief rather than looping, and entirely
 * skipped under reduced motion — a celebration that will not stop is a
 * distraction from the receipt underneath it.
 */
export function OrderCelebration() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;

    const leaves = [...container.querySelectorAll<SVGElement>("[data-leaf]")];
    const timeline = gsap.timeline();

    leaves.forEach((leaf, index) => {
      const drift = gsap.utils.random(-90, 90);
      const spin = gsap.utils.random(-220, 220);
      const duration = gsap.utils.random(3.4, 5.6);

      gsap.set(leaf, {
        x: gsap.utils.random(-40, 40),
        y: -80,
        rotation: gsap.utils.random(0, 360),
        opacity: 0,
      });

      timeline.to(
        leaf,
        {
          y: "110vh",
          x: `+=${drift}`,
          rotation: `+=${spin}`,
          opacity: 1,
          duration,
          ease: "none",
          delay: index * 0.16,
        },
        0,
      );

      // Fade out before landing, so nothing piles up at the bottom edge.
      timeline.to(leaf, { opacity: 0, duration: 0.8 }, duration * 0.72 + index * 0.16);
    });

    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {Array.from({ length: 14 }).map((_, index) => (
        <svg
          key={index}
          data-leaf
          width="18"
          height="12"
          viewBox="0 0 18 12"
          fill="none"
          className="absolute top-0"
          style={{ left: `${6 + index * 6.6}%`, opacity: 0 }}
        >
          <ellipse
            cx="9"
            cy="6"
            rx="9"
            ry="5.4"
            fill={index % 3 === 0 ? "#d9bc6a" : "#5fae76"}
            fillOpacity={index % 2 === 0 ? 0.7 : 0.45}
          />
          <path d="M0 6h18" stroke="#0b1a11" strokeOpacity="0.25" strokeWidth="0.6" />
        </svg>
      ))}
    </div>
  );
}
