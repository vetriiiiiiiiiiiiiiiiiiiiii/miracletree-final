"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { prefersReducedMotion } from "@/lib/motion";
const SESSION_KEY = "mt-preloaded";
/**
 * The opening curtain.
 *
 * A preloader is a tax on the visitor, so this one is written to charge as
 * little as possible:
 *
 * - It draws over content that is already in the DOM. Nothing waits on it, the
 *   markup is complete for crawlers, and it never delays the largest paint.
 * - It lifts as soon as the fonts have resolved, which is the actual thing
 *   worth waiting for — a wordmark that reflows mid-fade looks broken. A hard
 *   1.1s ceiling applies regardless, so a slow font never strands anyone.
 * - It runs once per session, not once per navigation. Seeing the same curtain
 *   on the way back from the cart is what makes these feel cheap.
 * - `prefers-reduced-motion` skips it completely.
 *
 * It is `inert` and `aria-hidden` throughout: assistive technology and the tab
 * order go straight to the page underneath, never into a decorative overlay.
 */
export function Preloader() {
  // Starts false so the server and the first client render agree; the effect
  // decides within a frame whether this visit gets a curtain at all.
  const [active, setActive] = useState(false);
  const [lifting, setLifting] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private browsing can throw on access. A curtain every time is worse
      // than none, so treat an unreadable session as "already seen".
      return;
    }
    setActive(true);
    document.documentElement.style.overflow = "hidden";
    let done = false;
    const lift = () => {
      if (done) return;
      done = true;
      setLifting(true);
      document.documentElement.style.overflow = "";
      // Matches the fade below; unmounting earlier cuts it off.
      window.setTimeout(() => setActive(false), 620);
    };
    const fonts = document.fonts;
    // A minimum beat, so a warm cache does not flash the curtain for 40ms.
    const floor = new Promise((r) => window.setTimeout(r, 420));
    Promise.all([floor, fonts?.ready ?? Promise.resolve()]).then(lift);
    const ceiling = window.setTimeout(lift, 1100);
    return () => {
      window.clearTimeout(ceiling);
      document.documentElement.style.overflow = "";
    };
  }, []);
  if (!active) return null;
  return (
    <div
      inert
      aria-hidden
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-ink transition-opacity duration-[600ms] ease-[var(--ease-organic)]"
      style={{ opacity: lifting ? 0 : 1 }}
    >
      <Logo className="h-9 w-auto text-cream-50 md:h-11" />

      {/* One rule filling left to right. A percentage counter would be a lie —
            nothing here is actually measuring bytes. */}
      <div className="mt-7 h-px w-[min(14rem,40vw)] overflow-hidden bg-border-subtle">
        <div
          className="h-full bg-gold-400"
          style={{
            animation: "preloader-sweep 1.1s var(--ease-organic) forwards",
          }}
        />
      </div>
    </div>
  );
}
