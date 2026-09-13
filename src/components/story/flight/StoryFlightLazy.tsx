"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { MilestoneDatum } from "./constants";

/**
 * Loads the flight only once the reader is heading towards it.
 *
 * Three.js and react-three-fiber are roughly 340kB of the 360kB that /about
 * was shipping, and the flight sits below several screens of prose that do not
 * need any of it. Importing it statically meant every visitor paid for the
 * renderer before the first paragraph — including the ones on a phone or with
 * reduced motion, for whom `StoryFlight` renders nothing at all.
 *
 * The observer fires 600px early so the canvas is mounted and warm by the time
 * it is actually on screen; the paper timeline underneath is what carries the
 * milestones regardless, so nothing is lost if this never loads.
 */
const StoryFlight = dynamic(
  () => import("./StoryFlight").then((m) => m.StoryFlight),
  {
    ssr: false,
    // The section reserves its own height, so there is nothing to fill and
    // nothing to shift when the canvas arrives.
    loading: () => null,
  },
);

export function StoryFlightLazy({ milestones }: { milestones: MilestoneDatum[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    // Nothing to download for anyone the flight would refuse to render for.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{near ? <StoryFlight milestones={milestones} /> : null}</div>;
}
