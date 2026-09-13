"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHUNK_HEIGHT, CHUNK_LENGTH, CHUNK_WIDTH } from "./constants";

/**
 * The foliage you fly through.
 *
 * The reference drifts photographic clouds inside a room group that slides past
 * a fixed camera. That indirection is where this port kept going wrong — the
 * group's position and each cloud's own idea of its world Z drifted apart, and
 * the sky rendered empty while the maths all looked right on paper.
 *
 * So there is no moving parent here. Each piece sets its own Z every frame as
 * `base + travel`, the camera sits at the origin, and a piece's world Z is
 * therefore just its position — one number, readable in a debugger, impossible
 * to get out of step with anything else.
 *
 * The evasion behaviour is the reference's and is the detail that matters: as a
 * piece nears the camera it slides outward, away from the centre, so it never
 * occludes a milestone at the moment that milestone becomes readable.
 */

/** The reference's generator, kept so a given seed lays out the same sky. */
function seededRandom(seed: number) {
  let s = seed;
  return function next() {
    s = Math.sin(s * 9999) * 10000;
    return s - Math.floor(s);
  };
}

// Evasion begins further out and pushes harder than the reference's numbers.
// With foliage this near the lens, the reference's -60/10 left leaves sitting
// squarely behind the copy at the moment it became readable.
const EVASION_START = -85;
const EVASION_END = -12;
const MAX_EVASION = 17;

/** Nothing is drawn nearer than this; it would only smear across the lens. */
const NEAR_CLIP = -9;

type Drifter = {
  key: string;
  kind: "leaflet" | "pod";
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  tone: string;
  driftSpeed: number;
  driftAmount: number;
  bobAmount: number;
  timeOffset: number;
  /** A leaflet hangs at an angle; a pod hangs almost straight down. */
  tilt: number;
  spin: number;
};

/** Leaf greens, deep enough to hold their colour against a cream sky. */
const LEAF_TONES = ["#7fb63a", "#5d8f2f", "#8bbf4d", "#4e7d26"];
const POD_TONE = "#6d8c3c";

export function Sky({
  travelRef,
  totalTravel,
}: {
  travelRef: React.RefObject<number>;
  totalTravel: number;
}) {
  const drifters = useMemo(() => {
    const items: Drifter[] = [];

    // Enough depth that foliage is still arriving as the last milestone passes.
    const depth = totalTravel + CHUNK_LENGTH * 3;
    const chunks = Math.ceil(depth / CHUNK_LENGTH);

    for (let chunk = 0; chunk < chunks; chunk++) {
      const random = seededRandom(7 + chunk * 1000);
      const count = 13 + Math.floor(random() * 6);

      for (let i = 0; i < count; i++) {
        const isPod = random() > 0.72;

        items.push({
          key: `${chunk}-${i}`,
          kind: isPod ? "pod" : "leaflet",
          x: (random() - 0.5) * CHUNK_WIDTH * 2.6,
          y: (random() - 0.5) * CHUNK_HEIGHT * 1.6,
          // Laid out ahead of the camera, one chunk at a time.
          z: -20 - chunk * CHUNK_LENGTH - random() * CHUNK_LENGTH,
          scale: 0.55 + random() * 0.85,
          opacity: 0.5 + random() * 0.32,
          tone: isPod ? POD_TONE : LEAF_TONES[Math.floor(random() * LEAF_TONES.length)]!,
          driftSpeed: 0.3 + random() * 0.4,
          driftAmount: 0.5 + random() * 1.0,
          bobAmount: 0.1 + random() * 0.2,
          timeOffset: random() * Math.PI * 2,
          tilt: (random() - 0.5) * 1.4,
          spin: (random() - 0.5) * 0.6,
        });
      }
    }

    return items;
  }, [totalTravel]);

  return (
    <group>
      {drifters.map((d) => (
        <Drifting key={d.key} datum={d} travelRef={travelRef} />
      ))}
    </group>
  );
}

function Drifting({
  datum,
  travelRef,
}: {
  datum: Drifter;
  travelRef: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;

    const time = state.clock.elapsedTime;

    // World Z, directly: the camera is at the origin and there is no moving
    // parent to fall out of step with.
    const z = datum.z + (travelRef.current ?? 0);

    if (z > NEAR_CLIP) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.position.z = z;

    // Slide outward as it approaches, keeping the centre clear for the copy.
    let evasion = 0;
    if (z > EVASION_START && z < EVASION_END) {
      const t = (z - EVASION_START) / (EVASION_END - EVASION_START);
      evasion = t * t * (3 - 2 * t);
    } else if (z >= EVASION_END) {
      evasion = 1;
    }

    const dirX = datum.x >= 0 ? 1 : -1;
    const drift = Math.sin(time * datum.driftSpeed + datum.timeOffset) * datum.driftAmount;
    const bob = Math.cos(time * datum.driftSpeed * 0.7 + datum.timeOffset) * datum.bobAmount;

    mesh.position.x = datum.x + drift + evasion * MAX_EVASION * dirX;
    mesh.position.y = datum.y + bob;
    mesh.rotation.z = datum.tilt + Math.sin(time * datum.driftSpeed + datum.timeOffset) * 0.12;
  });

  return (
    <mesh
      ref={ref}
      position={[datum.x, datum.y, datum.z]}
      scale={
        datum.kind === "pod"
          ? datum.scale
          : [datum.scale, datum.scale * 0.62, datum.scale]
      }
      rotation={[0, 0, datum.tilt]}
    >
      {datum.kind === "pod" ? (
        // A drumstick: long and thin, sized against the ~35-unit-tall view at
        // milestone distance rather than at cursor scale.
        <capsuleGeometry args={[0.16, 4.5, 4, 8]} />
      ) : (
        // Squashed into a leaflet: moringa carries small rounded ovals, and a
        // perfect circle read as a flat green coin.
        <circleGeometry args={[1.05, 24]} />
      )}
      <meshBasicMaterial
        color={datum.tone}
        transparent
        opacity={datum.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
