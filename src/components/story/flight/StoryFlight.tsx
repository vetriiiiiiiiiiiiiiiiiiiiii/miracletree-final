"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sky } from "./Sky";
import {
  BANK_AMPLITUDE,
  CHUNK_LENGTH,
  FADE_IN_END,
  FADE_IN_START,
  FADE_OUT_END,
  FADE_OUT_START,
  FIRST_MILESTONE_Z,
  FLIGHT_EASE_UNITS,
  FLIGHT_START_AT,
  FOG_FAR,
  FOG_NEAR,
  PITCH_AMPLITUDE,
  SKY_COLOR,
  type MilestoneDatum,
} from "./constants";

/**
 * The timeline as a flight, ported from the About room of
 * shajith23/sketch-portfolio and re-dressed for the tree.
 *
 * The camera never moves. The world travels towards it as you scroll, so each
 * milestone approaches out of the haze, holds while it is in front of you, and
 * dissolves as it passes overhead. The fade bands, the chunk spacing and the
 * banking curve are the reference's numbers, kept rather than re-tuned.
 *
 * Three departures, each forced by something real:
 *
 *   - Scroll is read, not stolen. The reference owns the whole viewport and
 *     hijacks the wheel; here there is a page underneath, and two things
 *     fighting over one gesture means neither wins.
 *   - The copy is DOM, not `<Text>` inside the canvas. drei's Text fetches its
 *     font over the network, which this site's `connect-src 'self'` blocks — it
 *     suspended forever and not one frame ever rendered. As DOM it is also
 *     selectable, searchable, and set in the site's own typeface.
 *   - It degrades. Under `prefers-reduced-motion` or without WebGL there is no
 *     flight, and the paper timeline below carries the same history.
 */

const ROOM_Z = -25;

/** The reference's fade curve, evaluated for one milestone's world Z. */
function fadeAt(z: number): number {
  if (z < FADE_IN_START) return 0;
  if (z <= FADE_IN_END) return (z - FADE_IN_START) / (FADE_IN_END - FADE_IN_START);
  if (z < FADE_OUT_START) return 1;
  if (z <= FADE_OUT_END) return 1 - (z - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
  return 0;
}

function Flight({
  count,
  scrollRef,
  trackRef,
  totalTravel,
  itemRefs,
  onIndex,
}: {
  count: number;
  scrollRef: React.RefObject<number>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  totalTravel: number;
  itemRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onIndex: (index: number) => void;
}) {
  const target = useRef(0);
  const bank = useRef(0);
  const pitch = useRef(0);
  const flying = useRef(false);
  const lastIndex = useRef(-1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const read = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      target.current = progress * totalTravel;
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [totalTravel, trackRef]);

  useFrame((_state, delta) => {
    // Easing towards the scroll target gives the coast the reference got from
    // friction on wheel velocity.
    scrollRef.current = THREE.MathUtils.lerp(
      scrollRef.current,
      target.current,
      1 - Math.pow(0.008, delta),
    );

    const travel = scrollRef.current;

    if (!flying.current && travel > FLIGHT_START_AT) flying.current = true;

    if (flying.current) {
      const chunkProgress = (travel % CHUNK_LENGTH) / CHUNK_LENGTH;
      const ease = Math.min(1, (travel - FLIGHT_START_AT) / FLIGHT_EASE_UNITS);
      const targetBank = Math.sin(chunkProgress * Math.PI * 2) * BANK_AMPLITUDE * ease;
      const targetPitch = Math.sin(chunkProgress * Math.PI * 4) * PITCH_AMPLITUDE * ease;

      const lerpSpeed = 1 - Math.pow(0.02, delta);
      bank.current = THREE.MathUtils.lerp(bank.current, targetBank, lerpSpeed);
      pitch.current = THREE.MathUtils.lerp(pitch.current, targetPitch, lerpSpeed);
    }

    // Drive the DOM copy from the same maths, written straight to style so the
    // overlay costs no React render at sixty frames a second.
    let nearest = 0;
    let nearestFade = -1;

    for (let i = 0; i < count; i++) {
      const node = itemRefs.current[i];
      if (!node) continue;

      const worldZ = ROOM_Z + travel + (FIRST_MILESTONE_Z - i * CHUNK_LENGTH);
      const fade = fadeAt(worldZ);

      if (fade > nearestFade) {
        nearestFade = fade;
        nearest = i;
      }

      if (fade <= 0.001) {
        if (node.style.visibility !== "hidden") node.style.visibility = "hidden";
        continue;
      }

      node.style.visibility = "visible";
      node.style.opacity = String(fade);
      // Growing as it nears, tipping with the horizon: together that is what
      // reads as flight rather than as a fade-in.
      // Bank rotates the copy and pitch lifts it, so the horizon and the words
      // move together. Growing as it nears completes the effect — together
      // that is what reads as flight rather than as a fade-in.
      node.style.transform =
        `translate(-50%, calc(-50% + ${(pitch.current * -260).toFixed(1)}px)) ` +
        `scale(${(0.8 + fade * 0.35).toFixed(3)}) ` +
        `rotate(${(bank.current * 18).toFixed(2)}deg)`;
    }

    if (nearest !== lastIndex.current) {
      lastIndex.current = nearest;
      onIndex(nearest);
    }

  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 6, 4]} intensity={0.6} />

      {/*
        The reference flies a paper aeroplane just ahead of the lens. The
        equivalent here — a seed with three papery wings — could not be made to
        read at that size: as geometry it resolved to a dark ball on a pale
        triangle, sitting over the copy. The leaflets and pods already carry the
        tree, so it is left out rather than left in badly.
      */}
      <Sky travelRef={scrollRef} totalTravel={totalTravel} />
    </>
  );
}

export function StoryFlight({ milestones }: { milestones: MilestoneDatum[] }) {
  const scrollRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const probe = document.createElement("canvas");
      if (probe.getContext("webgl2") ?? probe.getContext("webgl")) setEnabled(true);
    } catch {
      // Leave it off; the paper timeline is the fallback.
    }
  }, []);

  if (!enabled || milestones.length === 0) return null;

  const current = milestones[index];

  // Far enough that the last entry clears the lens.
  const totalTravel =
    FADE_OUT_END - ROOM_Z - FIRST_MILESTONE_Z + (milestones.length - 1) * CHUNK_LENGTH;

  return (
    <div
      ref={trackRef}
      className="relative"
      style={{ height: `${milestones.length * 100 + 100}svh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <Canvas
          // z=0, not the reference's 28 — that is its *entrance* camera. By the
          // time its About room runs, the corridor has moved the camera to the
          // origin, which is what the fade bands are written against. Keeping 28
          // put every milestone 68 units out, well beyond the fog, and the sky
          // rendered empty.
          camera={{ position: [0, 0.2, 0], fov: 60, near: 0.1, far: 150 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          dpr={[1, 2]}
          onCreated={({ gl, camera }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            // R3F aims a newly created camera at the origin. This one sits at
            // (0, 0.2, 0) — directly above it — so "look at the origin" meant
            // looking straight down, and every leaf and pod was behind the
            // lens. The flight looked like an empty cream field for hours.
            camera.rotation.set(0, 0, 0);
          }}
        >
          <color attach="background" args={[SKY_COLOR]} />
          <fog attach="fog" args={[SKY_COLOR, FOG_NEAR, FOG_FAR]} />
          <Suspense fallback={null}>
            <Flight
              count={milestones.length}
              scrollRef={scrollRef}
              trackRef={trackRef}
              totalTravel={totalTravel}
              itemRefs={itemRefs}
              onIndex={setIndex}
            />
          </Suspense>
        </Canvas>

        {/* The copy, riding over the sky. */}
        <div className="pointer-events-none absolute inset-0">
          {milestones.map((m, i) => (
            <div
              key={m.id}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
              className="absolute left-1/2 top-1/2 w-[min(46rem,88vw)] text-center"
              style={{
                opacity: 0,
                visibility: "hidden",
                transform: "translate(-50%, -50%)",
              }}
            >
              <p
                className="text-[2.6rem] leading-none text-[#7a5c1f] md:text-[3.5rem]"
                style={{ fontFamily: "var(--font-hand)" }}
              >
                {m.year}
              </p>
              <h3 className="mt-4 text-[1.9rem] leading-tight text-[#23301f] md:text-[2.9rem]">
                {m.title}
              </h3>
              <span aria-hidden className="mx-auto mt-5 block h-px w-40 bg-[#5d7150]/40" />
              {m.body ? (
                <p className="mx-auto mt-5 max-w-[42ch] text-[0.95rem] leading-relaxed text-[#55614e] md:text-[1.05rem]">
                  {m.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 text-center md:p-10">
          {current?.source ? (
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#8a7c55]">
              {current.sourceUrl ? (
                <a
                  href={current.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto underline underline-offset-2"
                >
                  Source: {current.source}
                </a>
              ) : (
                <>Source: {current.source}</>
              )}
            </p>
          ) : null}

          <p className="mt-3 text-[0.68rem] uppercase tracking-[0.14em] text-[#8a7c55]/70">
            {index + 1} / {milestones.length} · scroll to fly
          </p>
        </div>
      </div>
    </div>
  );
}
