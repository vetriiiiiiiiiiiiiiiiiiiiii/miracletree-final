"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Strokes that draw themselves.
 *
 * The reference this page is modelled on uses Vara.js to animate handwriting.
 * That library rasterises its own font and injects SVG outside React's control,
 * which is exactly the class of DOM mutation that has already bitten this
 * codebase once. So the effect is rebuilt directly: measure each path, set
 * `stroke-dasharray` to its own length, and release the offset when it scrolls
 * into view. Same result, no dependency, and React keeps ownership of the tree.
 *
 * Everything is inert under `prefers-reduced-motion` — the CSS in globals.css
 * pins the offset to zero, so the drawing is simply already finished.
 */
export function useDrawOnScroll<T extends SVGSVGElement | HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const paths = [
      ...root.querySelectorAll<SVGPathElement | SVGLineElement>("[data-draw]"),
    ];
    if (!paths.length) return;

    // Each stroke gets its own length, so a long flourish and a short tick take
    // the same time rather than the same speed.
    for (const path of paths) {
      const length = typeof path.getTotalLength === "function" ? path.getTotalLength() : 0;
      path.style.setProperty("--len", String(Math.ceil(length) || 1000));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          const delay = Number(target.dataset.drawDelay ?? 0);
          window.setTimeout(() => target.classList.add("is-drawn"), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );

    for (const path of paths) observer.observe(path);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/** Text with a hand-drawn rule under it that draws in on scroll. */
export function Underlined({
  children,
  className,
  tone = "ink",
}: {
  children: ReactNode;
  className?: string;
  tone?: "ink" | "gold" | "leaf";
}) {
  const ref = useDrawOnScroll<HTMLSpanElement>();

  const stroke = { ink: "#3d5136", gold: "#a3822c", leaf: "#4f7c4a" }[tone];

  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      {children}
      <svg
        className="absolute -bottom-2 left-0 w-full"
        height="10"
        viewBox="0 0 200 10"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        {/* Two passes, as a pen would: the second slightly off the first. */}
        <path
          data-draw
          d="M2 6.2C34 3.4 78 2.6 122 3.8C152 4.6 178 5.8 198 4.4"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          data-draw
          data-draw-delay="220"
          d="M8 8.4C46 6.6 96 6 138 6.8C160 7.2 180 7.8 194 7"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    </span>
  );
}

/** A drawn box around something, as though ringed in pen. */
export function Circled({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useDrawOnScroll<HTMLSpanElement>();

  return (
    <span ref={ref} className={cn("relative inline-block px-3 py-1", className)}>
      {children}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 220 60"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        <path
          data-draw
          d="M18 8C64 3 142 3 196 7C214 8.5 216 22 214 34C212 48 200 54 168 56C120 59 52 58 20 54C6 52 3 38 5 26C6.5 16 10 10 18 8Z"
          stroke="#a3822c"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </span>
  );
}

/**
 * Hand-drawn moringa botany. Line art rather than a photograph, because a field
 * notebook is where you draw the thing you are looking at.
 */
export function BotanicalPlate({
  subject,
  className,
  label,
}: {
  subject: "leaf" | "pod" | "flower" | "seed";
  className?: string;
  label?: string;
}) {
  const ref = useDrawOnScroll<SVGSVGElement>();

  const plates = {
    // A compound leaf: central rachis with opposite leaflets.
    leaf: (
      <>
        <path data-draw d="M100 190C100 150 100 90 100 26" />
        <path data-draw data-draw-delay="120" d="M100 60C86 52 72 50 58 54C64 66 78 72 100 70" />
        <path data-draw data-draw-delay="160" d="M100 60C114 52 128 50 142 54C136 66 122 72 100 70" />
        <path data-draw data-draw-delay="200" d="M100 96C86 88 72 86 58 90C64 102 78 108 100 106" />
        <path data-draw data-draw-delay="240" d="M100 96C114 88 128 86 142 90C136 102 122 108 100 106" />
        <path data-draw data-draw-delay="280" d="M100 132C88 124 76 122 64 126C70 138 82 144 100 142" />
        <path data-draw data-draw-delay="320" d="M100 132C112 124 124 122 136 126C130 138 118 144 100 142" />
        <path data-draw data-draw-delay="360" d="M100 26C93 32 90 40 91 48" />
      </>
    ),
    // The drumstick: long, ribbed, tapering.
    pod: (
      <>
        <path data-draw d="M96 14C90 60 88 118 92 176C93 188 97 194 102 194C107 194 111 187 112 175C117 117 114 58 108 14" />
        <path data-draw data-draw-delay="160" d="M100 20C97 70 96 130 99 186" />
        <path data-draw data-draw-delay="220" d="M92 34C104 31 112 31 114 33" />
        <path data-draw data-draw-delay="240" d="M90 78C104 75 112 75 115 77" />
        <path data-draw data-draw-delay="260" d="M89 124C103 121 112 121 115 123" />
        <path data-draw data-draw-delay="280" d="M91 162C104 159 112 159 114 161" />
        <path data-draw data-draw-delay="320" d="M96 14C99 8 105 8 108 14" />
      </>
    ),
    // Cream blossom, five petals.
    flower: (
      <>
        <path data-draw d="M100 118C100 140 100 168 100 192" />
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <ellipse
            key={angle}
            data-draw
            data-draw-delay={80 + i * 70}
            cx="100"
            cy="86"
            rx="13"
            ry="26"
            transform={`rotate(${angle} 100 108)`}
          />
        ))}
        <circle data-draw data-draw-delay="460" cx="100" cy="108" r="7" />
        <path data-draw data-draw-delay="520" d="M100 150C90 144 82 146 76 152" />
      </>
    ),
    // The winged seed the whole story starts from.
    seed: (
      <>
        <ellipse data-draw cx="100" cy="112" rx="34" ry="42" />
        <path data-draw data-draw-delay="140" d="M100 70C82 80 72 96 70 116" />
        <path data-draw data-draw-delay="180" d="M100 70C118 80 128 96 130 116" />
        <path data-draw data-draw-delay="220" d="M100 154C90 142 86 128 87 114" />
        <path data-draw data-draw-delay="300" d="M100 70C100 58 100 48 100 40" />
      </>
    ),
  };

  return (
    <figure className={cn("relative", className)}>
      <svg
        ref={ref}
        viewBox="0 0 200 210"
        fill="none"
        stroke="#415139"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full"
        aria-hidden
      >
        {plates[subject]}
      </svg>
      {label ? (
        <figcaption className="margin-note mt-2 text-center">{label}</figcaption>
      ) : null}
    </figure>
  );
}
