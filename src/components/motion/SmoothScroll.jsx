"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  initMotion,
  ScrollTrigger,
} from "@/lib/motion";
/**
 * Scroll housekeeping on route changes. (It used to install Lenis smooth
 * scrolling as well; that was removed — see below.)
 */
export function SmoothScroll() {
  const pathname = usePathname();
  // No Lenis. It eased every wheel movement over about a second, which made
  // the site feel heavy and "stuck" to scroll, and it ran a second animation
  // loop on every frame. Native scrolling is instant and smooth everywhere.
  useEffect(() => {
    initMotion();
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
    const target = hash
      ? document.getElementById(decodeURIComponent(hash))
      : null;

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
      document
        .getElementById(decodeURIComponent(hash))
        ?.scrollIntoView({ block: "start" });
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
