"use client";
import { useEffect, useRef } from "react";
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
export function useDrawOnScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const paths = [...root.querySelectorAll("[data-draw]")];
    if (!paths.length) return;
    // Each stroke gets its own length, so a long flourish and a short tick take
    // the same time rather than the same speed.
    for (const path of paths) {
      const length =
        typeof path.getTotalLength === "function" ? path.getTotalLength() : 0;
      path.style.setProperty("--len", String(Math.ceil(length) || 1000));
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target;
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
export function Underlined({ children, className, tone = "ink" }) {
  const ref = useDrawOnScroll();
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
export function Circled({ children, className }) {
  const ref = useDrawOnScroll();
  return (
    <span
      ref={ref}
      className={cn("relative inline-block px-3 py-1", className)}
    >
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
// Bipinnate Moringa oleifera leaf, drawn as line art in a 200x210 box.
// A gently swaying rachis; opposite pinnae that rise more steeply and
// shorten towards the tip, each curving slightly; small obovate leaflets in
// opposite pairs along every pinna with a terminal leaflet; and a terminal
// cluster at the very top — the arrangement the tree actually carries.
function moringaLeafShapes() {
  const shapes = [];
  const R = (d) => Math.round(d * 10) / 10;
  // Rachis x at a given y: a slight S-sway.
  const rx = (y) => 100 + Math.sin((y / 210) * Math.PI * 1.4) * 2.2;
  shapes.push({ kind: "path", d: `M${R(rx(204))} 204C${R(rx(160) - 1)} 160 ${R(rx(100) + 1)} 100 ${R(rx(24))} 24`, delay: 0 });
  const tiers = [
    { y: 176, len: 64, pairs: 4, angle: 12 },
    { y: 146, len: 60, pairs: 4, angle: 18 },
    { y: 117, len: 52, pairs: 3, angle: 24 },
    { y: 90, len: 42, pairs: 3, angle: 31 },
    { y: 66, len: 30, pairs: 2, angle: 38 },
    { y: 46, len: 18, pairs: 1, angle: 46 },
  ];
  let delay = 100;
  for (const t of tiers) {
    for (const side of [-1, 1]) {
      const a = (t.angle * Math.PI) / 180;
      const x0 = rx(t.y), y0 = t.y;
      // End point, and a control point that bows the pinna slightly upward
      // near the rachis and lets it relax towards the tip.
      const x1 = x0 + Math.cos(a) * t.len * side;
      const y1 = y0 - Math.sin(a) * t.len + t.len * 0.08;
      const qx = x0 + Math.cos(a + 0.12) * t.len * 0.55 * side;
      const qy = y0 - Math.sin(a + 0.12) * t.len * 0.55;
      shapes.push({ kind: "path", d: `M${R(x0)} ${R(y0)}Q${R(qx)} ${R(qy)} ${R(x1)} ${R(y1)}`, delay });
      const pt = (f) => ({
        x: (1 - f) ** 2 * x0 + 2 * (1 - f) * f * qx + f * f * x1,
        y: (1 - f) ** 2 * y0 + 2 * (1 - f) * f * qy + f * f * y1,
      });
      for (let i = 1; i <= t.pairs; i++) {
        const f = i / (t.pairs + 0.85);
        const p = pt(f), p2 = pt(Math.min(1, f + 0.02));
        const tx = p2.x - p.x, ty = p2.y - p.y, tl = Math.hypot(tx, ty) || 1;
        const ux = tx / tl, uy = ty / tl, nx = -uy, ny = ux;
        const size = 0.92 + f * 0.22; // leaflets a touch larger towards the tip
        for (const s of [-1, 1]) {
          const off = 6.2 * size;
          const ex = p.x + nx * off * s + ux * 1.2, ey = p.y + ny * off * s + uy * 1.2;
          const deg = (Math.atan2(ny * s, nx * s) * 180) / Math.PI + 90 + 14 * s * side;
          shapes.push({ kind: "ellipse", cx: R(ex), cy: R(ey), rx: R(3.3 * size), ry: R(5.9 * size), rot: R(deg), delay: delay + 40 + i * 28 });
        }
      }
      const end = pt(1), before = pt(0.97);
      const ux = end.x - before.x, uy = end.y - before.y, ul = Math.hypot(ux, uy) || 1;
      const tx = end.x + (ux / ul) * 6.4, ty = end.y + (uy / ul) * 6.4;
      shapes.push({ kind: "ellipse", cx: R(tx), cy: R(ty), rx: 3.6, ry: 6.4, rot: R((Math.atan2(uy, ux) * 180) / Math.PI + 90), delay: delay + 170 });
    }
    delay += 85;
  }
  // Terminal leaflet at the top of the rachis.
  shapes.push({ kind: "ellipse", cx: R(rx(24)), cy: 17, rx: 3.6, ry: 6.6, rot: 0, delay: delay + 40 });
  return shapes;
}
const MORINGA_LEAF = moringaLeafShapes();
export function BotanicalPlate({ subject, className, label }) {
  const ref = useDrawOnScroll();
  const plates = {
    // A Moringa oleifera leaf as it really grows: bipinnate, small oval
    // leaflets in opposite pairs. The old plate — three pairs of large
    // leaves on a stem — could have been any plant.
    leaf: (
      <g strokeWidth="1.25">
        {MORINGA_LEAF.map((shape, i) =>
          shape.kind === "path" ? (
            <path key={i} data-draw data-draw-delay={shape.delay} d={shape.d} />
          ) : (
            <ellipse
              key={i}
              data-draw
              data-draw-delay={shape.delay}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              transform={`rotate(${shape.rot} ${shape.cx} ${shape.cy})`}
            />
          ),
        )}
      </g>
    ),
    // The drumstick: long, ribbed, tapering.
    pod: (
      <>
        <path
          data-draw
          d="M96 14C90 60 88 118 92 176C93 188 97 194 102 194C107 194 111 187 112 175C117 117 114 58 108 14"
        />
        <path data-draw data-draw-delay="160" d="M100 20C97 70 96 130 99 186" />
        <path data-draw data-draw-delay="220" d="M92 34C104 31 112 31 114 33" />
        <path data-draw data-draw-delay="240" d="M90 78C104 75 112 75 115 77" />
        <path
          data-draw
          data-draw-delay="260"
          d="M89 124C103 121 112 121 115 123"
        />
        <path
          data-draw
          data-draw-delay="280"
          d="M91 162C104 159 112 159 114 161"
        />
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
        <path
          data-draw
          data-draw-delay="520"
          d="M100 150C90 144 82 146 76 152"
        />
      </>
    ),
    // The winged seed the whole story starts from.
    seed: (
      <>
        <ellipse data-draw cx="100" cy="112" rx="34" ry="42" />
        <path data-draw data-draw-delay="140" d="M100 70C82 80 72 96 70 116" />
        <path
          data-draw
          data-draw-delay="180"
          d="M100 70C118 80 128 96 130 116"
        />
        <path
          data-draw
          data-draw-delay="220"
          d="M100 154C90 142 86 128 87 114"
        />
        <path
          data-draw
          data-draw-delay="300"
          d="M100 70C100 58 100 48 100 40"
        />
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
        <figcaption className="margin-note mt-2 text-center">
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}
