"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { initMotion, prefersReducedMotion, treeGrowth } from "@/lib/motion";

/**
 * The moringa, grown by scrolling.
 *
 * A single pinned stage whose scroll progress drives one continuous drawing:
 * seed, stem, branches, leaflets, flowers, pods, harvest. Everything is one
 * inline SVG whose stroke dash offsets and opacities are set from progress —
 * no per-frame layout, no images, no WebGL. That is what lets it hold 60fps
 * while pinned.
 *
 * Under reduced motion the section un-pins and shows the fully grown tree with
 * the stages listed as static text, which is the same information without the
 * scroll hijack.
 */

const STAGES = [
  { id: "seed", label: "Seed", note: "A winged seed, sown at the start of the rains." },
  { id: "stem", label: "Stem", note: "Fast and soft-wooded — head height inside a year." },
  { id: "branch", label: "Branches", note: "Thin, brittle limbs that fork low and wide." },
  { id: "leaf", label: "Leaves", note: "Small oval leaflets in opposite pairs. The harvest." },
  { id: "flower", label: "Flowers", note: "Cream blossoms in a short window after the rains." },
  { id: "pod", label: "Pods", note: "The drumstick itself, up to half a metre long." },
  { id: "harvest", label: "Harvest", note: "Picked at first light, in shade within the hour." },
] as const;

export function TreeGrowth({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string | null;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    initMotion();
    setReduced(prefersReducedMotion());

    const section = sectionRef.current;
    if (!section) return;

    // Sticky stage rather than a GSAP pin — see stickyProgress in lib/motion.
    const trigger = treeGrowth(section, setProgress);
    return () => trigger?.kill();
  }, []);

  // Progress is split across the stages, with a little overlap so one grows
  // into the next rather than switching.
  const stageProgress = (index: number) => {
    const span = 1 / STAGES.length;
    const start = index * span;
    return clamp((progress - start) / (span * 1.35));
  };

  const activeStage = Math.min(
    STAGES.length - 1,
    Math.floor(progress * STAGES.length + 0.0001),
  );

  return (
    <section
      ref={sectionRef}
      id="the-tree"
      className="relative grain bg-forest-900 lg:h-[340svh]"
      aria-label={title}
    >
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 92%, rgba(35,122,75,0.22) 0%, rgba(11,26,17,0) 68%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[100rem] items-center gap-12 gutter lg:grid-cols-[0.9fr_1.1fr]">
        {/* Copy + stage list */}
        <div className="order-2 lg:order-1">
          <p className="eyebrow mb-6 flex items-center gap-3 text-gold-400">
            <span className="tabular-nums">02</span>
            <span className="h-px w-8 bg-gold-400/40" aria-hidden />
            <span className="text-cream-400">The tree</span>
          </p>

          <h2 className="max-w-[16ch] text-display text-cream-50">{title}</h2>
          {subtitle ? (
            <p className="mt-6 max-w-[46ch] leading-relaxed text-cream-300">{subtitle}</p>
          ) : null}

          <ol className="mt-12 grid gap-0">
            {STAGES.map((stage, index) => {
              const isActive = !reduced && index === activeStage;
              const isPast = !reduced && index < activeStage;

              return (
                <li
                  key={stage.id}
                  className={cn(
                    "grid grid-cols-[3rem_1fr] items-baseline gap-4 border-t border-border-subtle py-4 transition-colors duration-500",
                    reduced || isActive
                      ? "text-cream-50"
                      : isPast
                        ? "text-cream-300"
                        : "text-cream-400",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "text-[0.68rem] tabular-nums tracking-[0.16em] transition-colors duration-500",
                      isActive ? "text-gold-400" : "text-current",
                    )}
                  >
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-[1.05rem] leading-tight">{stage.label}</p>
                    <p
                      className={cn(
                        "overflow-hidden text-sm leading-relaxed text-cream-400 transition-all duration-500 ease-[var(--ease-organic)]",
                        reduced || isActive
                          ? "mt-1.5 max-h-16 opacity-100"
                          : "max-h-0 opacity-0",
                      )}
                    >
                      {stage.note}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* The tree */}
        <div className="relative order-1 mx-auto aspect-[3/4] w-full max-w-[34rem] lg:order-2">
          <MoringaTree
            stageProgress={reduced ? () => 1 : stageProgress}
            overall={reduced ? 1 : progress}
          />

          {!reduced ? (
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center gap-3"
              aria-hidden
            >
              <span className="text-[0.62rem] tabular-nums tracking-[0.18em] text-cream-400">
                {String(Math.round(progress * 100)).padStart(3, "0")}
              </span>
              <span className="h-px flex-1 bg-border-subtle">
                <span
                  className="block h-px bg-gold-400"
                  style={{ width: `${progress * 100}%` }}
                />
              </span>
            </div>
          ) : null}
        </div>
      </div>
      </div>
    </section>
  );
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * The drawing. Each group's visibility is a pure function of progress, so the
 * whole illustration is reversible and correct at any scroll position.
 */
function MoringaTree({
  stageProgress,
  overall,
}: {
  stageProgress: (index: number) => number;
  overall: number;
}) {
  const seed = stageProgress(0);
  const stem = stageProgress(1);
  const branch = stageProgress(2);
  const leaf = stageProgress(3);
  const flower = stageProgress(4);
  const pod = stageProgress(5);
  const harvest = stageProgress(6);

  const dash = (length: number, p: number) => ({
    strokeDasharray: length,
    strokeDashoffset: length * (1 - p),
  });

  return (
    <svg viewBox="0 0 400 520" fill="none" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="tree-glow" cx="50%" cy="88%" r="55%">
          <stop offset="0%" stopColor="#2f9a5f" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2f9a5f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b3a992" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#b3a992" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="200" cy="470" rx="170" ry="60" fill="url(#tree-glow)" opacity={overall} />

      {/* Ground line */}
      <path d="M40 468 H360" stroke="url(#soil)" strokeWidth="1.2" />

      {/* 01 Seed */}
      <g opacity={seed} style={{ transition: "opacity 220ms linear" }}>
        <ellipse
          cx="200"
          cy="478"
          rx="9"
          ry="11"
          fill="#17211a"
          stroke="#b3a992"
          strokeWidth="1.1"
          strokeOpacity="0.8"
        />
        <path d="M200 468v20" stroke="#d9bc6a" strokeWidth="1" strokeOpacity={seed} />
      </g>

      {/* 02 Trunk */}
      <path
        d="M200 470 C200 420 198 372 200 330 C202 292 199 258 200 226"
        stroke="#8cc79b"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeOpacity="0.9"
        style={dash(250, stem)}
      />

      {/* 03 Branches — thin, forking, characteristically brittle */}
      <g stroke="#8cc79b" strokeWidth="1.7" strokeLinecap="round" strokeOpacity="0.85">
        <path d="M200 320 C168 306 140 288 116 262" style={dash(120, branch)} />
        <path d="M200 296 C232 282 262 264 288 238" style={dash(126, branch)} />
        <path d="M200 262 C176 246 156 226 142 200" style={dash(100, branch)} />
        <path d="M200 244 C224 228 246 208 258 182" style={dash(100, branch)} />
        <path d="M200 226 C196 204 198 184 200 162" style={dash(66, branch)} />
      </g>

      {/* 04 Leaflets — opposite pairs along each branch */}
      <g opacity={leaf}>
        {LEAFLETS.map((l, i) => {
          const local = clamp((leaf - i * 0.012) * 1.4);
          return (
            <ellipse
              key={i}
              cx={l.x}
              cy={l.y}
              rx={l.r}
              ry={l.r * 0.66}
              transform={`rotate(${l.a} ${l.x} ${l.y}) scale(${local})`}
              style={{ transformOrigin: `${l.x}px ${l.y}px` }}
              fill="#2f9a5f"
              fillOpacity="0.42"
              stroke="#5fae76"
              strokeWidth="0.7"
            />
          );
        })}
      </g>

      {/* 05 Flowers */}
      <g opacity={flower}>
        {[
          [150, 232],
          [252, 208],
          [186, 186],
          [268, 262],
          [128, 276],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${clamp(flower * 1.3 - i * 0.05)})`}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx="0"
                cy="-3.4"
                rx="1.9"
                ry="3.4"
                transform={`rotate(${angle})`}
                fill="#faf8f2"
                fillOpacity="0.85"
              />
            ))}
            <circle r="1.5" fill="#d9bc6a" />
          </g>
        ))}
      </g>

      {/* 06 Pods */}
      <g opacity={pod} stroke="#5fae76" strokeWidth="1.5" strokeLinecap="round">
        {[
          "M154 240 C150 288 150 330 154 366",
          "M256 216 C262 260 262 298 256 332",
          "M192 194 C188 240 188 274 192 306",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            style={dash(140, clamp(pod * 1.25 - i * 0.1))}
            strokeOpacity="0.9"
          />
        ))}
      </g>

      {/* 07 Harvest — leaves lift away toward the top of the frame */}
      <g opacity={harvest}>
        {[
          [112, 200],
          [292, 176],
          [206, 132],
          [156, 158],
          [252, 140],
          [180, 104],
        ].map(([x, y], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y - harvest * (26 + i * 8)}
            rx="5.4"
            ry="3.5"
            transform={`rotate(${-24 + i * 15} ${x} ${y})`}
            fill="#8cc79b"
            fillOpacity={0.75 * (1 - harvest * 0.45)}
          />
        ))}
      </g>
    </svg>
  );
}

/** Leaflet positions, laid out in opposite pairs along the branch paths. */
const LEAFLETS: { x: number; y: number; r: number; a: number }[] = [
  { x: 176, y: 312, r: 7, a: -22 },
  { x: 158, y: 300, r: 7, a: -28 },
  { x: 140, y: 288, r: 6.4, a: -34 },
  { x: 124, y: 272, r: 6, a: -40 },
  { x: 168, y: 328, r: 6.6, a: -14 },
  { x: 148, y: 316, r: 6.2, a: -20 },

  { x: 224, y: 288, r: 7, a: 22 },
  { x: 244, y: 276, r: 7, a: 28 },
  { x: 264, y: 262, r: 6.4, a: 34 },
  { x: 280, y: 246, r: 6, a: 40 },
  { x: 232, y: 302, r: 6.6, a: 16 },
  { x: 252, y: 292, r: 6.2, a: 22 },

  { x: 184, y: 252, r: 6.4, a: -26 },
  { x: 168, y: 236, r: 6, a: -32 },
  { x: 152, y: 218, r: 5.6, a: -38 },
  { x: 176, y: 266, r: 6, a: -18 },

  { x: 216, y: 236, r: 6.4, a: 26 },
  { x: 232, y: 220, r: 6, a: 32 },
  { x: 248, y: 200, r: 5.6, a: 38 },
  { x: 224, y: 250, r: 6, a: 18 },

  { x: 192, y: 206, r: 5.8, a: -10 },
  { x: 208, y: 194, r: 5.8, a: 10 },
  { x: 196, y: 176, r: 5.4, a: -8 },
  { x: 206, y: 164, r: 5.2, a: 8 },
];
