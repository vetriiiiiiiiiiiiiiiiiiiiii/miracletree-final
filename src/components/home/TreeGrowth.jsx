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
  {
    id: "stem",
    label: "Stem",
    note: "Fast and soft-wooded — head height inside a year.",
  },
  {
    id: "branch",
    label: "Branches",
    note: "Thin, brittle limbs that fork low and wide.",
  },
  {
    id: "leaf",
    label: "Leaves",
    note: "Small oval leaflets in opposite pairs. The harvest.",
  },
  {
    id: "flower",
    label: "Flowers",
    note: "Cream blossoms in a short window after the rains.",
  },
  { id: "pod", label: "Pods", note: "The drumstick itself, up to half a metre long." },
  {
    id: "harvest",
    label: "Harvest",
    note: "Picked at first light, in shade within the hour.",
  },
];
export function TreeGrowth({ title, subtitle }) {
  const sectionRef = useRef(null);
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
  const stageProgress = (index) => {
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
              <p className="mt-6 max-w-[46ch] leading-relaxed text-cream-300">
                {subtitle}
              </p>
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
function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Per-item delay that still finishes. The first version subtracted a fixed
 * amount per index, which is fine for four items and wrong for eighteen: the
 * last frond reached 0.23 at full scroll and the outermost limbs never finished
 * drawing, which is most of why the tree looked broken. Normalising by the
 * count means item n starts later but every item still lands on exactly 1.
 */
function stagger(p, i, count, spread = 0.45) {
  return clamp((p - (i / count) * spread) / (1 - spread));
}
/**
 * The drawing. Each group's visibility is a pure function of progress, so the
 * whole illustration is reversible and correct at any scroll position.
 *
 * Redrawn because the first version was not recognisably this tree: loose
 * ellipses scattered near the branches, daisy-shaped flowers, and pods drawn
 * as bare strokes rising away from the canopy. Moringa oleifera is identifiable
 * from four things, and the drawing now carries all four —
 *
 *   the leaf     tripinnate, so what looks like a leaf is a frond: a rachis
 *                carrying paired leaflets, each pair smaller toward the tip,
 *                finishing on a single terminal leaflet;
 *   the canopy   open and umbrella-shaped, on slender limbs that droop at
 *                their ends rather than reaching up;
 *   the flowers  cream, in drooping panicles — sprays, not single blooms;
 *   the pods     the drumstick: long, ribbed, tapering, and hanging straight
 *                down under its own weight.
 *
 * Every part is still drawn from arithmetic rather than an image, so it stays
 * one inline SVG with no network cost and no per-frame layout.
 */
function MoringaTree({ stageProgress, overall }) {
  const seed = stageProgress(0);
  const stem = stageProgress(1);
  const branch = stageProgress(2);
  const leaf = stageProgress(3);
  const flower = stageProgress(4);
  const pod = stageProgress(5);
  const harvest = stageProgress(6);

  const dash = (length, p) => ({
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
        <linearGradient id="pod-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3f8d5c" stopOpacity="0.75" />
          <stop offset="55%" stopColor="#6fb886" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#3f8d5c" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      <ellipse
        cx="200"
        cy="470"
        rx="170"
        ry="60"
        fill="url(#tree-glow)"
        opacity={overall}
      />

      {/* Ground line */}
      <path d="M40 468 H360" stroke="url(#soil)" strokeWidth="1.2" />

      {/* 01 Seed — three papery wings, which is how it leaves the pod */}
      <g opacity={seed} style={{ transition: "opacity 220ms linear" }}>
        {[-52, 68, 184].map((angle) => (
          <ellipse
            key={angle}
            cx="200"
            cy="470"
            rx="8.5"
            ry="4.2"
            transform={`rotate(${angle} 200 470)`}
            fill="#b3a992"
            fillOpacity="0.16"
            stroke="#b3a992"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />
        ))}
        <circle cx="200" cy="470" r="4.6" fill="#17211a" stroke="#b3a992" strokeWidth="1" strokeOpacity="0.85" />
        <path d="M200 470v16" stroke="#d9bc6a" strokeWidth="1" strokeOpacity={seed} />
      </g>

      {/* 02 Trunk — soft-wooded and never quite straight */}
      <path
        d="M200 470 C201 424 197 386 200 348 C203 314 198 282 200 252"
        stroke="#8cc79b"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeOpacity="0.9"
        style={dash(222, stem)}
      />

      {/* 03 Branches — forking low, then drooping at the ends into an
          open umbrella rather than a dense crown */}
      <g stroke="#8cc79b" strokeLinecap="round" strokeOpacity="0.82">
        {BRANCHES.map((b, i) => (
          <path
            key={i}
            d={b.d}
            strokeWidth={b.w}
            style={dash(b.len, stagger(branch, i, BRANCHES.length, 0.35))}
          />
        ))}
      </g>

      {/* 04 Fronds — one compound leaf at each branch tip */}
      <g opacity={leaf}>
        {FRONDS.map((f, i) => (
          <Frond key={i} {...f} p={stagger(leaf, i, FRONDS.length, 0.5)} />
        ))}
      </g>

      {/* 05 Flowers — panicles hanging below the branch they grow from */}
      <g opacity={flower}>
        {PANICLES.map((n, i) => (
          <Panicle key={i} {...n} p={stagger(flower, i, PANICLES.length, 0.4)} />
        ))}
      </g>

      {/* 06 Pods — the drumstick, hanging straight down and ribbed */}
      <g opacity={pod}>
        {PODS.map((d, i) => (
          <Pod key={i} {...d} p={stagger(pod, i, PODS.length, 0.4)} />
        ))}
      </g>

      {/* 07 Harvest — leaflets lift away toward the top of the frame */}
      <g opacity={harvest}>
        {[
          [124, 214],
          [286, 190],
          [204, 146],
          [162, 170],
          [248, 156],
          [186, 118],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={leafletPath(4.6)}
            transform={`translate(${x} ${y - harvest * (26 + i * 8)}) rotate(${-24 + i * 15})`}
            fill="#8cc79b"
            fillOpacity={0.75 * (1 - harvest * 0.45)}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * One leaflet: an obovate blade, wider past the middle and rounded at the end,
 * which is the shape that separates a moringa leaflet from a plain ellipse.
 * Drawn around its own origin so a frond can place it by transform alone.
 */
function leafletPath(r) {
  const w = r * 0.72;
  return `M0 0 C ${w} ${r * 0.28}, ${w * 1.02} ${r * 1.24}, 0 ${r * 1.72} C ${-w * 1.02} ${r * 1.24}, ${-w} ${r * 0.28}, 0 0 Z`;
}

/**
 * A compound leaf. Moringa's is tripinnate, and that is the whole point of
 * drawing it this way: the rachis carries paired side-stems (pinnae), and each
 * of those carries its own paired leaflets. Drawing leaflets straight onto the
 * rachis — which the first version did — gives a stiff bar, not the airy frond
 * that makes the tree identifiable from across a field.
 *
 * It opens from the base outward, so the growth reads as unfurling and still
 * reverses cleanly on an upward scroll.
 */
function Frond({ x, y, angle, length, p }) {
  const PINNAE = 4;
  const rachis = `M0 0 C ${length * 0.34} ${length * 0.05}, ${length * 0.7} ${length * 0.12}, ${length} ${length * 0.24}`;
  const limbs = [];

  for (let i = 1; i <= PINNAE; i++) {
    const t = i / (PINNAE + 0.6);
    const local = clamp((p - t * 0.34) * 2);
    if (local <= 0) continue;
    // Follow the rachis curve rather than a straight line along x.
    const ax = t * length;
    const ay = length * (0.05 * 3 * t * (1 - t) * (1 - t) + 0.12 * 3 * t * t * (1 - t) + 0.24 * t * t * t);
    const span = 15 - t * 3.5;
    for (const side of [1, -1]) {
      limbs.push(
        <g key={`${i}${side}`} transform={`translate(${ax} ${ay}) rotate(${side * (54 - t * 10)}) scale(${local})`}>
          <Pinna length={span} p={local} />
        </g>,
      );
    }
  }

  const tip = clamp((p - 0.82) / 0.18);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        d={rachis}
        stroke="#5fae76"
        strokeWidth="0.85"
        strokeLinecap="round"
        strokeOpacity="0.75"
        style={{ strokeDasharray: length * 1.06, strokeDashoffset: length * 1.06 * (1 - clamp(p * 1.5)) }}
      />
      {limbs}
      {tip > 0 ? (
        <g transform={`translate(${length} ${length * 0.24}) scale(${tip})`}>
          <Pinna length={11} p={tip} />
        </g>
      ) : null}
    </g>
  );
}

/** One side-stem of a frond, with its own paired leaflets. */
function Pinna({ length, p }) {
  const LEAFLETS = 3;
  const out = [];
  for (let i = 1; i <= LEAFLETS; i++) {
    const t = i / (LEAFLETS + 0.5);
    const size = 2.5 * (1 - t * 0.3);
    out.push(
      <g key={i} transform={`translate(${t * length} 0)`}>
        <path d={leafletPath(size)} transform="rotate(64)" fill="#2f9a5f" fillOpacity="0.52" stroke="#5fae76" strokeWidth="0.4" />
        <path d={leafletPath(size)} transform="rotate(-64)" fill="#2f9a5f" fillOpacity="0.52" stroke="#5fae76" strokeWidth="0.4" />
      </g>,
    );
  }
  return (
    <g>
      <path d={`M0 0 H${length}`} stroke="#5fae76" strokeWidth="0.5" strokeOpacity="0.6" strokeLinecap="round" />
      {out}
      <g transform={`translate(${length} 0)`}>
        <path d={leafletPath(2.2)} transform="rotate(90)" fill="#2f9a5f" fillOpacity="0.52" stroke="#5fae76" strokeWidth="0.4" />
      </g>
    </g>
  );
}

/** A flower panicle: a drooping spray, not a single bloom. */
function Panicle({ x, y, angle, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        d="M0 0 C 3 8, 5 14, 4 22"
        stroke="#5fae76"
        strokeWidth="0.8"
        strokeOpacity="0.7"
        strokeLinecap="round"
        style={{ strokeDasharray: 24, strokeDashoffset: 24 * (1 - clamp(p * 1.6)) }}
      />
      {[
        [1.6, 5, 0],
        [4.4, 10, 0.12],
        [1.2, 13.5, 0.24],
        [5.2, 17, 0.36],
        [2.8, 21.5, 0.48],
      ].map(([bx, by, delay], i) => {
        const local = clamp((p - delay) * 2.2);
        if (local <= 0) return null;
        return (
          <g key={i} transform={`translate(${bx} ${by}) scale(${local})`}>
            {/* Five unequal cream petals, the way the flower actually sits */}
            {[0, 70, 142, 214, 290].map((a, j) => (
              <ellipse
                key={a}
                cx="0"
                cy="-2.3"
                rx={1.15 - (j % 2) * 0.25}
                ry={2.3 - (j % 2) * 0.35}
                transform={`rotate(${a})`}
                fill="#faf8f2"
                fillOpacity="0.88"
              />
            ))}
            <circle r="0.95" fill="#d9bc6a" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * A pod. Tapered to both ends and ribbed down its length, scaled from the
 * point where it joins the branch so it lengthens downward as it grows —
 * which is also what makes it reverse correctly on an upward scroll.
 */
function Pod({ x, y, angle, length, p }) {
  const w = 1.15;
  const body = `M0 0 C ${w} ${length * 0.16}, ${w * 1.12} ${length * 0.7}, 0 ${length} C ${-w * 1.12} ${length * 0.7}, ${-w} ${length * 0.16}, 0 0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(1 ${clamp(p)})`}>
      {/* The stalk it hangs by — without it the pod reads as a floating leaf */}
      <path d="M0 -5 V 2" stroke="#5fae76" strokeWidth="0.8" strokeOpacity="0.8" strokeLinecap="round" />
      <path d={body} fill="url(#pod-body)" stroke="#5fae76" strokeWidth="0.75" strokeOpacity="0.9" />
      {/* The three ridges that give the drumstick its section */}
      <path d={`M0 ${length * 0.06} V ${length * 0.94}`} stroke="#2f6d47" strokeWidth="0.6" strokeOpacity="0.5" />
      <path
        d={`M${-w * 0.5} ${length * 0.12} C ${-w * 0.66} ${length * 0.5}, ${-w * 0.5} ${length * 0.7}, ${-w * 0.28} ${length * 0.9}`}
        stroke="#2f6d47"
        strokeWidth="0.5"
        strokeOpacity="0.38"
      />
      <path
        d={`M${w * 0.5} ${length * 0.12} C ${w * 0.66} ${length * 0.5}, ${w * 0.5} ${length * 0.7}, ${w * 0.28} ${length * 0.9}`}
        stroke="#2f6d47"
        strokeWidth="0.5"
        strokeOpacity="0.38"
      />
    </g>
  );
}

/** Limbs: fork low, reach out, then droop at the tip. */
const BRANCHES = [
  { d: "M200 344 C 170 334, 138 322, 110 308 C 96 301, 88 302, 82 312", len: 132, w: 2.2 },
  { d: "M200 330 C 232 320, 264 306, 292 292 C 306 285, 314 286, 320 296", len: 132, w: 2.2 },
  { d: "M200 300 C 176 284, 154 268, 134 254 C 124 247, 117 247, 112 255", len: 112, w: 1.8 },
  { d: "M200 290 C 224 274, 248 258, 268 244 C 278 237, 285 237, 290 245", len: 112, w: 1.8 },
  { d: "M200 268 C 184 250, 170 234, 158 220 C 151 212, 145 211, 141 217", len: 88, w: 1.6 },
  { d: "M200 262 C 218 244, 234 228, 246 216 C 253 209, 259 208, 263 214", len: 88, w: 1.6 },
  { d: "M200 252 C 190 232, 180 216, 170 202 C 164 194, 158 192, 153 197", len: 78, w: 1.4 },
  { d: "M200 252 C 212 232, 222 216, 232 204 C 238 196, 244 194, 249 199", len: 76, w: 1.4 },
];

/** A frond at the end of each limb, angled the way the limb is falling. */
const FRONDS = [
  { x: 82, y: 312, angle: 172, length: 44 },
  { x: 82, y: 312, angle: 212, length: 36 },
  { x: 82, y: 312, angle: 132, length: 32 },
  { x: 320, y: 296, angle: 8, length: 44 },
  { x: 320, y: 296, angle: -32, length: 36 },
  { x: 320, y: 296, angle: 48, length: 32 },
  { x: 112, y: 255, angle: 186, length: 38 },
  { x: 112, y: 255, angle: 228, length: 31 },
  { x: 290, y: 245, angle: -6, length: 38 },
  { x: 290, y: 245, angle: -48, length: 31 },
  { x: 141, y: 217, angle: 200, length: 32 },
  { x: 141, y: 217, angle: 244, length: 27 },
  { x: 263, y: 214, angle: -20, length: 32 },
  { x: 263, y: 214, angle: -64, length: 27 },
  { x: 153, y: 197, angle: 214, length: 34 },
  { x: 153, y: 197, angle: 178, length: 29 },
  { x: 249, y: 199, angle: -34, length: 34 },
  { x: 249, y: 199, angle: 2, length: 29 },
];

/** Panicles hang under the limbs they grow from. */
const PANICLES = [
  { x: 158, y: 320, angle: -8 },
  { x: 250, y: 306, angle: 10 },
  { x: 180, y: 258, angle: -4 },
  { x: 236, y: 250, angle: 12 },
  { x: 122, y: 268, angle: -14 },
  { x: 300, y: 256, angle: 9 },
];

/** Pods hang straight down, give or take the weight of the branch. */
const PODS = [
  { x: 116, y: 312, angle: 8, length: 96 },
  { x: 286, y: 296, angle: -7, length: 88 },
  { x: 150, y: 262, angle: 5, length: 72 },
  { x: 258, y: 250, angle: -6, length: 76 },
];
