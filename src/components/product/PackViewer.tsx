"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Drag to turn the pack.
 *
 * Two modes, chosen by what photography actually exists.
 *
 *   turntable — with enough frames (a pack shot on a rotating platform), the
 *               drag scrubs through them and the product genuinely spins.
 *   solid     — otherwise the pack is rotated in 3D space against a ground that
 *               matches the photography, with a specular sweep that tracks the
 *               angle and a contact shadow that shortens as it turns away.
 *
 * The second mode exists because a catalogue of two-to-four photographs per
 * product cannot be made into a 360° spin, and pretending otherwise would mean
 * inventing frames that were never shot. What it can honestly do is stop the
 * pack being a flat cut-out — which is most of what a spin is really for.
 *
 * Built with CSS 3D rather than WebGL on purpose: this sits on the page that
 * has to convert, and a canvas plus a renderer is a lot of weight for one
 * object that a `rotateY` already describes exactly.
 */

/** Below this many images, the photographs are angles rather than a turntable. */
const TURNTABLE_MIN_FRAMES = 12;

/** How far the pack may turn from face-on, in degrees. */
const MAX_YAW = 34;
const MAX_PITCH = 15;

/** Pixels of drag per degree. */
const DRAG_SENSITIVITY = 0.42;

export type PackImage = { id: string; url: string; alt: string | null };

export function PackViewer({
  images,
  productName,
  className,
}: {
  images: PackImage[];
  productName: string;
  className?: string;
}) {
  const isTurntable = images.length >= TURNTABLE_MIN_FRAMES;

  const stageRef = useRef<HTMLDivElement>(null);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [frame, setFrame] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; frame: number } | null>(
    null,
  );

  useEffect(() => {
    // Under reduced motion the pack stays face-on and the gallery does its job.
    setEnabled(!prefersReducedMotion());
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, yaw, pitch, frame };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (isTurntable) {
      const step = Math.round(dx / 6);
      // Wraps, so the pack can be turned round and round in either direction.
      setFrame(((start.frame + step) % images.length + images.length) % images.length);
      return;
    }

    setYaw(clamp(start.yaw + dx * DRAG_SENSITIVITY, -MAX_YAW, MAX_YAW));
    setPitch(clamp(start.pitch - dy * DRAG_SENSITIVITY * 0.7, -MAX_PITCH, MAX_PITCH));
  };

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setDragging(false);

    // The solid pack settles back to face-on; a turntable stays where it is put,
    // because that is the frame the shopper chose to look at.
    if (!isTurntable) {
      setYaw(0);
      setPitch(0);
    }
  };

  const current = isTurntable ? images[frame] : images[0];
  if (!current) return null;

  // The sweep follows the angle, so the highlight behaves like a fixed light
  // source rather than a decoration that happens to move.
  const sweep = 50 - (yaw / MAX_YAW) * 42;
  const turned = Math.abs(yaw) / MAX_YAW;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={stageRef}
        role="img"
        aria-label={`${productName}. ${
          enabled ? "Drag to turn the pack." : ""
        }`}
        data-cursor="drag"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        className={cn(
          "relative aspect-square w-full touch-none select-none overflow-hidden",
          // White, not the cream used elsewhere, and deliberately so: the
          // catalogue is shot on white, and any other ground turns the
          // photograph's own background into a visible card that rotates with
          // it. A multiply blend cannot rescue this — `preserve-3d` puts the
          // image in its own stacking context, so there is nothing behind it
          // to blend against. Matching the ground is what makes the pack float.
          "bg-white",
          enabled && (dragging ? "cursor-grabbing" : "cursor-grab"),
        )}
        style={{ perspective: "1400px" }}
      >
        <div
          className="absolute inset-0 grid place-items-center"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)`,
            transition: dragging ? "none" : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <Image
            src={current.url}
            alt={current.alt ?? productName}
            fill
            sizes="(max-width: 1024px) 92vw, 46vw"
            priority
            draggable={false}
            className="object-contain p-8"
          />

          {/* Specular sweep. Sits above the photograph, pinned to the same 3D
              plane, so it travels across the pack as it turns. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{
              background: `linear-gradient(105deg, transparent ${sweep - 26}%, rgba(255,255,255,0.85) ${sweep}%, transparent ${sweep + 26}%)`,
              opacity: enabled ? 0.5 + turned * 0.4 : 0,
              transition: dragging ? "none" : "opacity 700ms ease",
            }}
          />
        </div>

        {/* Contact shadow. It shortens and softens as the pack turns away,
            which is what actually sells the object as sitting on a surface. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[22%] bottom-[9%] h-3 rounded-[50%] bg-ink/25 blur-md"
          style={{
            transform: `scaleX(${1 - turned * 0.28}) translateX(${yaw * 0.55}px)`,
            opacity: 0.35 - turned * 0.14,
            transition: dragging ? "none" : "transform 700ms ease, opacity 700ms ease",
          }}
        />

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 34%, transparent 55%, rgba(35,48,31,0.09) 100%)",
          }}
        />

        {enabled ? (
          <p
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-4 text-center",
              "text-[0.62rem] uppercase tracking-[0.16em] text-ink-600/60",
              "transition-opacity duration-500",
              dragging ? "opacity-0" : "opacity-100",
            )}
          >
            {isTurntable ? "Drag to spin" : "Drag to turn"}
          </p>
        ) : null}
      </div>

      {isTurntable ? (
        <p className="mt-3 text-center text-xs tabular-nums text-cream-400">
          {frame + 1} / {images.length}
        </p>
      ) : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
