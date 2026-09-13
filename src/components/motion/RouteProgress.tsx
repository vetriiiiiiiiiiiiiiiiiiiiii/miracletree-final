"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * A determinate-looking progress bar across the top of the page during
 * navigation.
 *
 * This replaces the leaf wipe that used to cover route changes. The wipe was
 * decorative and it lied: it ran for a fixed 620ms whether the next page took
 * 40ms or four seconds, so on a slow product page it finished and left the
 * shopper staring at the old page with no indication anything was happening.
 * A progress bar is the convention for this on every commerce site worth
 * copying, and it degrades honestly — it keeps creeping while the server is
 * still working, and only completes when the new route actually paints.
 *
 * Three properties matter and are worth stating:
 *
 * **It never blocks.** The bar is `pointer-events-none` and lives outside the
 * content. Nothing about it can trap a shopper mid-checkout.
 *
 * **It never lies about being finished.** The creep asymptotically approaches
 * 90% and stops. Only a real pathname change drives it to 100%.
 *
 * **It does not appear for fast navigations.** Showing a progress bar for a
 * 60ms prefetched route is visual noise, so the bar waits `APPEAR_DELAY_MS`
 * before drawing anything. Most in-cache navigations complete before it ever
 * becomes visible.
 */

/** Navigations faster than this never draw a bar. */
const APPEAR_DELAY_MS = 140;

/** How long the finished bar stays at 100% before fading out. */
const DONE_MS = 260;

/** The creep never passes this, because we do not know the real progress. */
const CEILING = 0.9;

function RouteProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const raf = useRef<number | null>(null);
  const appearTimer = useRef<number | null>(null);
  const doneTimer = useRef<number | null>(null);
  const active = useRef(false);

  const clearTimers = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (appearTimer.current) window.clearTimeout(appearTimer.current);
    if (doneTimer.current) window.clearTimeout(doneTimer.current);
    raf.current = appearTimer.current = doneTimer.current = null;
  }, []);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    clearTimers();
    setProgress(0);

    // Hold the bar back so quick, prefetched routes never flash one.
    appearTimer.current = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS);

    const began = performance.now();
    const tick = () => {
      const elapsed = performance.now() - began;
      // Exponential ease toward the ceiling: fast at first, then visibly
      // slowing, which is what "still working" should look like.
      setProgress(CEILING * (1 - Math.exp(-elapsed / 900)));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [clearTimers]);

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    setProgress(1);
    doneTimer.current = window.setTimeout(() => {
      setVisible(false);
      // Reset only once it is invisible, so the bar never appears to rewind.
      window.setTimeout(() => setProgress(0), 200);
    }, DONE_MS);
  }, [clearTimers]);

  // Begin on any click that will actually navigate this app to a new URL.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let next: URL;
      try {
        next = new URL(href, window.location.href);
      } catch {
        return;
      }
      // External links leave the app; the browser shows its own progress.
      if (next.origin !== window.location.origin) return;
      // A pure hash change on this page is a scroll, not a navigation.
      if (next.pathname === window.location.pathname && next.search === window.location.search) {
        return;
      }

      start();
    };

    // Back/forward is a navigation the click handler cannot see.
    const onPopState = () => start();

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", onPopState);
    };
  }, [start]);

  // The new route has rendered — that is the only honest "complete" signal.
  useEffect(() => {
    finish();
    // `finish` is a no-op unless a navigation is in flight, so running it on
    // the first paint costs nothing.
  }, [pathname, searchParams, finish]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease-out" }}
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-emerald-500 via-emerald-400 to-gold-400"
        style={{
          transform: `scaleX(${progress})`,
          // No transition while creeping — rAF already animates it frame by
          // frame, and a CSS transition on top would lag behind the value.
          transition: progress === 1 ? "transform 200ms ease-out" : "none",
          boxShadow: visible ? "0 0 12px var(--color-emerald-400)" : "none",
        }}
      />
    </div>
  );
}

/**
 * `useSearchParams` opts a component into client-side rendering, which without
 * a Suspense boundary would deopt every page that renders this into dynamic
 * rendering — losing static generation across the whole storefront.
 */
export function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <RouteProgressInner />
    </Suspense>
  );
}
