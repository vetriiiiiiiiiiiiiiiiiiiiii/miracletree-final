"use client";
import { useEffect, useRef } from "react";
import { gsap, isTouchDevice, prefersReducedMotion } from "@/lib/motion";
import { LeafMark, SprigMark, TIP_RATIO } from "@/components/motion/SeedCursor";
/** Size in pixels of the leaf's box. Small: a cursor points, it does not perform. */
const SIZE = 30;
/** How large the leaf sits in each state. It grows to invite, never to obstruct. */
const SCALE = {
  default: 1,
  link: 1.18,
  view: 1.34,
  drag: 1.3,
  image: 1.28,
  hidden: 0,
};
/** A slight turn per state, so a change of intent is felt as well as seen. */
const TILT = {
  default: 0,
  link: -8,
  view: -12,
  drag: -12,
  image: -10,
  hidden: 0,
};
/** States where the single leaflet becomes a sprig. */
const SPRIGS = ["view", "drag", "image"];
export function CustomCursor({ hasPhoto = false }) {
  const leafRef = useRef(null);
  const sprigRef = useRef(null);
  useEffect(() => {
    if (isTouchDevice() || prefersReducedMotion()) return;
    const leaf = leafRef.current;
    const sprig = sprigRef.current;
    if (!leaf || !sprig) return;
    document.documentElement.setAttribute("data-cursor-mode", "custom");
    const nodes = [leaf, sprig];
    const setX = gsap.quickTo(nodes, "x", { duration: 0.075, ease: "power3.out" });
    const setY = gsap.quickTo(nodes, "y", { duration: 0.075, ease: "power3.out" });
    // Sway is a fraction of travel, so a flick tips the leaf and a slow drift
    // barely moves it — the way a leaf behaves on air.
    const setSway = gsap.quickTo(leaf, "rotation", {
      duration: 0.55,
      ease: "power2.out",
    });
    const setSprigSway = gsap.quickTo(sprig, "rotation", {
      duration: 0.55,
      ease: "power2.out",
    });
    let visible = false;
    let state = "default";
    let lastX = 0;
    let lastY = 0;
    const applyState = (next) => {
      if (next === state) return;
      state = next;
      gsap.to(nodes, {
        scale: SCALE[next],
        duration: 0.34,
        ease: "power3.out",
      });
      gsap.to(leaf, {
        opacity: next === "hidden" ? 0 : 1,
        duration: 0.28,
      });
      // Unfurling. Scaling from the tip is what makes the pair read as growth
      // out of the existing leaf rather than as an icon fading in beside it.
      const sprouting = SPRIGS.includes(next);
      gsap.to(sprig, {
        opacity: sprouting ? 1 : 0,
        scale: sprouting ? SCALE[next] : SCALE[next] * 0.55,
        duration: sprouting ? 0.42 : 0.22,
        ease: sprouting ? "back.out(2)" : "power2.in",
      });
    };
    const resolveState = (target) => {
      if (!(target instanceof Element)) return "default";
      // This looks for `data-cursor`, while the document-level mode uses
      // `data-cursor-mode`. Sharing one name would make this match <html> for
      // every element on the page, and nothing below it would ever be detected.
      const declared = target.closest("[data-cursor]");
      if (declared) {
        const value = declared.dataset.cursor;
        if (value) return value;
      }
      if (target.closest("input, textarea, select, [contenteditable='true']")) {
        return "hidden";
      }
      if (target.closest("a, button, [role='button'], label, summary")) return "link";
      if (target.closest("img, picture, video")) return "image";
      return "default";
    };
    const onMove = (event) => {
      if (!visible) {
        visible = true;
        gsap.to(leaf, { opacity: 1, duration: 0.25 });
      }
      const { clientX: x, clientY: y } = event;
      setX(x);
      setY(y);
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;
      // Capped so a fast flick across the screen tips rather than spins.
      const sway = Math.max(-14, Math.min(14, dx * 0.5 + dy * 0.16));
      setSway(TILT[state] + sway);
      setSprigSway(TILT[state] + sway);
      applyState(resolveState(event.target));
    };
    const onOver = (event) => {
      const next = resolveState(event.target);
      document.documentElement.setAttribute(
        "data-cursor-mode",
        next === "hidden" ? "native" : "custom",
      );
    };
    const onLeave = () => {
      visible = false;
      gsap.to(nodes, { opacity: 0, duration: 0.22 });
    };
    const onDown = () => gsap.to(nodes, { scale: SCALE[state] * 0.84, duration: 0.14 });
    const onUp = () => gsap.to(nodes, { scale: SCALE[state], duration: 0.24 });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeAttribute("data-cursor-mode");
      gsap.killTweensOf(nodes);
    };
  }, []);
  // The artwork's tip is inset from its own top-left corner, so the box is
  // nudged back by exactly that much and every transform pivots there. Derived
  // from one constant in the artwork, so the two cannot drift apart.
  const inset = `${-SIZE * TIP_RATIO}px`;
  const origin = `${TIP_RATIO * 100}% ${TIP_RATIO * 100}%`;
  const box = {
    left: inset,
    top: inset,
    width: SIZE,
    height: SIZE,
    transformOrigin: origin,
  };
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] hidden md:block"
    >
      {/* The pair that unfurls over anything openable, behind the main leaf. */}
      <div ref={sprigRef} className="absolute opacity-0" style={box}>
        <SprigMark className="h-full w-full" />
      </div>

      {/* The leaflet itself. */}
      <div
        ref={leafRef}
        className="absolute opacity-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]"
        style={box}
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/cursor/seed.webp"
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <LeafMark className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
