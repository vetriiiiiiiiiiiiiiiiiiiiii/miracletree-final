"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { initMotion, isTouchDevice, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/**
 * Lenis drives scroll on pointer devices only. Touch devices keep native
 * momentum — overriding it there costs more than it gains, and breaks the
 * browser's own address-bar and pull-to-refresh behaviour.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    initMotion();

    if (prefersReducedMotion() || isTouchDevice()) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
    });

    // Lenis and ScrollTrigger must share one RAF loop, or scrub animations
    // lag a frame behind the scroll position.
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsapTicker(raf);

    return () => {
      removeGsapTicker(raf);
      lenis.destroy();
    };
  }, []);

  // Route changes must reset scroll and re-measure every trigger, or a pinned
  // section from the previous page leaves the next one with wrong offsets.
  useEffect(() => {
    window.scrollTo(0, 0);
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}

// Kept in one place so the import of gsap's ticker stays out of the effect body.
function gsapTicker(fn: (time: number) => void) {
  import("gsap").then(({ default: gsap }) => {
    gsap.ticker.add(fn);
    gsap.ticker.lagSmoothing(0);
  });
}

function removeGsapTicker(fn: (time: number) => void) {
  import("gsap").then(({ default: gsap }) => gsap.ticker.remove(fn));
}
