"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Seed → crack → sprout → leaf, drawn rather than modelled.
 *
 * Botanical line art is the honest way to show germination at this scale: it is
 * precise, it stays crisp at any size, it weighs a few kilobytes, and it does
 * not look like procedurally generated 3D. The sequence animates by drawing the
 * strokes (dash-offset) and easing the leaf pair open, which are both
 * compositor-friendly.
 *
 * Under reduced motion the final state renders immediately — the sprouted form,
 * not an empty frame.
 */
export function BotanicalSeed({ className }: { className?: string }) {
  const rootRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const seed = root.querySelector("[data-seed]");
    const crack = root.querySelector("[data-crack]");
    const stem = root.querySelector<SVGPathElement>("[data-stem]");
    const leaves = root.querySelectorAll("[data-leaf]");
    const halo = root.querySelector("[data-halo]");

    if (prefersReducedMotion()) {
      gsap.set([seed, crack, stem, halo], { opacity: 1 });
      gsap.set(leaves, { opacity: 1, scale: 1 });
      if (stem) stem.style.strokeDashoffset = "0";
      return;
    }

    const stemLength = stem?.getTotalLength() ?? 100;
    gsap.set(stem, { strokeDasharray: stemLength, strokeDashoffset: stemLength, opacity: 1 });
    gsap.set(leaves, { opacity: 0, scale: 0.2, transformOrigin: "0% 100%" });
    gsap.set(crack, { opacity: 0, scaleY: 0, transformOrigin: "50% 50%" });
    gsap.set(halo, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ delay: 0.35 });

    tl.fromTo(
      seed,
      { opacity: 0, scale: 0.55, transformOrigin: "50% 50%" },
      { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out" },
    )
      // Light gathers inside the seed before anything visibly happens to it.
      .to(halo, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" }, "-=0.6")
      .to(crack, { opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.in" }, "-=0.5")
      .to(stem, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, "-=0.15")
      .to(
        leaves,
        { opacity: 1, scale: 1, duration: 0.9, stagger: 0.14, ease: "back.out(1.6)" },
        "-=0.75",
      )
      .to(halo, { opacity: 0.55, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 200 260"
      fill="none"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="seed-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d9bc6a" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#2f9a5f" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#2f9a5f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Light from inside the seed */}
      <circle data-halo cx="100" cy="196" r="62" fill="url(#seed-halo)" />

      {/* Stem */}
      <path
        data-stem
        d="M100 196 C100 176 100 150 100 128 C100 108 99 92 100 74"
        stroke="#5fae76"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Leaf pair — moringa leaflets are small, rounded and opposite */}
      <g data-leaf>
        <path
          d="M100 122 C100 104 87 92 68 90 C69 110 82 122 100 122 Z"
          fill="#2f9a5f"
          fillOpacity="0.22"
          stroke="#5fae76"
          strokeWidth="1.3"
        />
        <path d="M100 122 C92 116 84 104 78 96" stroke="#8cc79b" strokeWidth="0.8" strokeOpacity="0.7" />
      </g>
      <g data-leaf>
        <path
          d="M100 104 C100 86 113 74 132 72 C131 92 118 104 100 104 Z"
          fill="#2f9a5f"
          fillOpacity="0.22"
          stroke="#5fae76"
          strokeWidth="1.3"
        />
        <path d="M100 104 C108 98 116 86 122 78" stroke="#8cc79b" strokeWidth="0.8" strokeOpacity="0.7" />
      </g>
      <g data-leaf>
        <path
          d="M100 82 C100 68 91 58 76 56 C77 72 87 82 100 82 Z"
          fill="#2f9a5f"
          fillOpacity="0.18"
          stroke="#5fae76"
          strokeWidth="1.1"
        />
      </g>

      {/* Seed coat */}
      <g data-seed>
        <ellipse
          cx="100"
          cy="204"
          rx="26"
          ry="32"
          fill="#17211a"
          stroke="#b3a992"
          strokeWidth="1.4"
          strokeOpacity="0.75"
        />
        {/* The three papery wings of a moringa seed */}
        <path
          d="M100 176 C86 182 78 194 76 208"
          stroke="#b3a992"
          strokeWidth="0.9"
          strokeOpacity="0.5"
        />
        <path
          d="M100 176 C114 182 122 194 124 208"
          stroke="#b3a992"
          strokeWidth="0.9"
          strokeOpacity="0.5"
        />
        <path
          d="M100 236 C93 228 90 218 90 208"
          stroke="#b3a992"
          strokeWidth="0.9"
          strokeOpacity="0.5"
        />
      </g>

      {/* The split */}
      <path
        data-crack
        d="M100 178 L100 232"
        stroke="#d9bc6a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
