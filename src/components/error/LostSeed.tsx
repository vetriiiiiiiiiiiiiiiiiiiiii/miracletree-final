"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * A seed drifting on nothing. Used on the 404 and error screens — the same
 * botanical language as the hero, at the other end of the outcome.
 */
export function LostSeed() {
  const rootRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const seed = root.querySelector("[data-seed]");
    const dust = root.querySelectorAll("[data-dust]");

    const tl = gsap.timeline();

    tl.fromTo(
      seed,
      { opacity: 0, y: -30, rotation: -14 },
      { opacity: 1, y: 0, rotation: 0, duration: 1.4, ease: "power3.out" },
    ).to(seed, {
      y: "+=14",
      rotation: 6,
      duration: 3.6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    const dustTweens = [...dust].map((particle, index) =>
      gsap.to(particle, {
        y: `-=${18 + index * 6}`,
        x: `+=${index % 2 === 0 ? 10 : -10}`,
        opacity: 0.15,
        duration: 4 + index * 0.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: index * 0.25,
      }),
    );

    return () => {
      tl.kill();
      dustTweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 300 300"
      fill="none"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient id="lost-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2f9a5f" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2f9a5f" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="150" cy="150" r="120" fill="url(#lost-glow)" />

      {/* Cracked, dry ground — nothing to root into */}
      <g stroke="#b3a992" strokeOpacity="0.22" strokeWidth="1">
        <path d="M40 232h220" />
        <path d="M96 232l-12 26M150 232v30M204 232l12 26" />
        <path d="M124 246l-8 16M180 246l8 16" />
      </g>

      {/* Drifting dust */}
      {[
        [88, 108],
        [214, 92],
        [122, 68],
        [186, 148],
        [70, 168],
        [232, 176],
      ].map(([x, y], index) => (
        <circle
          key={index}
          data-dust
          cx={x}
          cy={y}
          r={index % 2 === 0 ? 2 : 1.4}
          fill="#d9bc6a"
          fillOpacity="0.4"
        />
      ))}

      {/* The seed */}
      <g data-seed style={{ transformOrigin: "150px 160px" }}>
        <ellipse
          cx="150"
          cy="160"
          rx="26"
          ry="32"
          fill="#17211a"
          stroke="#b3a992"
          strokeWidth="1.3"
          strokeOpacity="0.7"
        />
        <path d="M150 132c-14 6-22 18-24 32" stroke="#b3a992" strokeWidth="0.9" strokeOpacity="0.45" />
        <path d="M150 132c14 6 22 18 24 32" stroke="#b3a992" strokeWidth="0.9" strokeOpacity="0.45" />
        <path d="M150 192c-7-8-10-18-10-28" stroke="#b3a992" strokeWidth="0.9" strokeOpacity="0.45" />
      </g>
    </svg>
  );
}
