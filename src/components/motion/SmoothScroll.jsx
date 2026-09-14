"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import {
  initMotion,
  isTouchDevice,
  prefersReducedMotion,
  ScrollTrigger,
} from "@/lib/motion";
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
    const raf = (time) => lenis.raf(time * 1000);
    gsapTicker(raf);
    return () => {
      removeGsapTicker(raf);
      lenis.destroy();
    };
  }, []);
  // Route changes must reset scroll and re-measure every trigger, or a pinned
  // section from the previous page leaves the next one with wrong offsets.
  //
  // Except when the URL carries a fragment. This reset ran on first mount too,
  // so every deep link on the site — /about#timeline, /gallery#visitors, the
  // footer's own links — jumped to the target and was then yanked back to the
  // top before the reader saw it. A fragment is an explicit request for a
  // position; honour it instead.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(decodeURIComponent(hash)) : null;

    if (!target) {
      window.scrollTo(0, 0);
      const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
      return () => window.clearTimeout(id);
    }

    // Landing on a fragment takes more than one attempt on this site. The
    // homepage pins sections with ScrollTrigger, and a pinned trigger adds its
    // own scroll distance when it is measured — so a jump made before
    // `refresh()` lands somewhere that stops existing a moment later. The
    // corrections run after the refresh and again once images have settled.
    //
    // They stop the instant the reader touches the scroll themselves: a page
    // that drags you back where it thinks you should be is worse than one that
    // misses the anchor.
    let cancelled = false;
    const stop = () => {
      cancelled = true;
    };
    for (const event of ["wheel", "touchstart", "keydown"]) {
      window.addEventListener(event, stop, { once: true, passive: true });
    }

    const land = () => {
      if (cancelled) return;
      document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ block: "start" });
    };

    requestAnimationFrame(() => requestAnimationFrame(land));
    const afterRefresh = window.setTimeout(() => {
      ScrollTrigger.refresh();
      land();
    }, 200);
    const afterSettle = window.setTimeout(land, 800);

    return () => {
      window.clearTimeout(afterRefresh);
      window.clearTimeout(afterSettle);
      for (const event of ["wheel", "touchstart", "keydown"]) {
        window.removeEventListener(event, stop);
      }
    };
  }, [pathname]);
  return null;
}
// Kept in one place so the import of gsap's ticker stays out of the effect body.
function gsapTicker(fn) {
  import("gsap").then(({ default: gsap }) => {
    gsap.ticker.add(fn);
    gsap.ticker.lagSmoothing(0);
  });
}
function removeGsapTicker(fn) {
  import("gsap").then(({ default: gsap }) => gsap.ticker.remove(fn));
}
