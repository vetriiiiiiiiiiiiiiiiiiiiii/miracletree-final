"use client";

/**
 * The cursor's parts. All moringa, nothing else — no rings, no boxes, no text.
 *
 * This is the second attempt. The first drew the seed: a kernel inside its
 * papery husk. At 44px that resolved to a glossy green ball with a leaf on top,
 * which every eye reads as an apple, and a round blob gives a pointer no point —
 * you cannot tell precisely what you are aiming at.
 *
 * So the cursor is a leaflet instead. It is the part of the tree the brand
 * actually sells, it survives being 30px across because it is one clean
 * silhouette, and crucially it comes to a tip — which is placed exactly on the
 * pointer position, doing the job an arrowhead does.
 *
 * The tip sits at (6, 6) in a 64-unit box: 9.4% in from the top-left corner.
 * `TIP_RATIO` below is that number, and both the offset and the transform
 * origin are derived from it, so the artwork and the hotspot cannot drift apart.
 */

/** Where the tip sits inside the viewBox, as a fraction of its size. */
export const TIP_RATIO = 6 / 64;

/** Shared leaf silhouette: tip at (6,6), base at (44,50). */
const LEAF_PATH = "M6 6 C26 12 40 26 44 50 C22 44 12 30 6 6 Z";

function LeafDefs() {
  return (
    <defs>
      <linearGradient id="mt-leaf" x1="0.1" y1="0.1" x2="0.8" y2="0.9">
        <stop offset="0%" stopColor="#d8e9a8" />
        <stop offset="42%" stopColor="#7cae36" />
        <stop offset="100%" stopColor="#3f6b1e" />
      </linearGradient>
    </defs>
  );
}

/** The resting cursor: one leaflet, tip on the pointer. */
export function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <LeafDefs />

      <path d={LEAF_PATH} fill="url(#mt-leaf)" />
      {/* A hairline edge keeps the silhouette crisp against a photograph. */}
      <path
        d={LEAF_PATH}
        stroke="#2f4a17"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeOpacity="0.8"
      />

      {/* Midrib and two side veins — enough to read as a leaf, not a petal. */}
      <g stroke="#eaf7c2" strokeOpacity="0.62" strokeLinecap="round">
        <path d="M7 7 C20 22 34 36 43 49" strokeWidth="1.3" />
        <path d="M17 18 C22 20 27 23 31 27" strokeWidth="0.8" />
        <path d="M26 31 C30 33 34 36 37 40" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

/**
 * What happens over something you can open: the leaflet is joined by two more,
 * so a single leaf becomes the start of a compound one — the arrangement
 * moringa actually carries.
 *
 * Drawn in the same 64-unit box and anchored at the same tip, so it can sit
 * directly on top of `LeafMark` without shifting the hotspot by a pixel.
 */
export function SprigMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <LeafDefs />

      {/* The stem the new pair grows from. */}
      <path
        d="M44 50 C50 44 56 38 60 30"
        stroke="#6b9a2f"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />

      <g opacity="0.95">
        <path
          d="M50 42 C56 40 61 42 63 47 C57 50 51 48 50 42 Z"
          fill="url(#mt-leaf)"
        />
        <path
          d="M55 34 C58 28 63 25 64 26 C63 33 59 37 55 34 Z"
          fill="url(#mt-leaf)"
        />
      </g>
    </svg>
  );
}
