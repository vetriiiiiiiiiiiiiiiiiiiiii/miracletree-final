"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { initMotion, revealOnScroll, textReveal } from "@/lib/motion";
/**
 * Declarative wrappers over the motion system. Components use these rather than
 * calling GSAP, which keeps animation out of the page tree.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  stagger,
  y = 24,
}) {
  const ref = useRef(null);
  useEffect(() => {
    initMotion();
    const node = ref.current;
    if (!node) return;
    // Children marked `data-animate` stagger individually; otherwise the whole
    // block moves as one.
    const targets = node.querySelectorAll("[data-animate]");
    if (targets.length) {
      // The wrapper is rendered at `opacity: 0` so nothing flashes before the
      // effect runs. When the children are the ones being animated, that
      // inline style has to be released here — `revealOnScroll` only ever
      // touches the targets it is given, so left alone the wrapper stays
      // invisible and takes the whole staggered block down with it.
      node.style.opacity = "1";
      node.style.transform = "none";
    }
    const trigger = revealOnScroll(targets.length ? targets : node, {
      trigger: node,
      y,
      stagger,
      delay,
    });
    return () => trigger?.kill();
  }, [delay, stagger, y]);
  const El = Tag;
  return (
    <El
      ref={ref}
      className={cn(className)}
      style={{ opacity: 0, transform: `translate3d(0, ${y}px, 0)` }}
      data-reveal-root
    >
      {children}
    </El>
  );
}
/**
 * Line-masked heading reveal. Splitting measures line boxes, so the text must
 * be plain — pass a string, not markup.
 */
export function RevealText({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  immediate = false,
}) {
  const ref = useRef(null);
  useEffect(() => {
    initMotion();
    const node = ref.current;
    if (!node) return;
    // Fonts change line breaks, so splitting before they load produces masks in
    // the wrong places.
    let cleanup = () => {};
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || !ref.current) return;
      cleanup = textReveal(ref.current, {
        delay,
        trigger: immediate ? null : ref.current,
      });
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [children, delay, immediate]);
  // The text is handed over via dangerouslySetInnerHTML — escaped, since
  // `children` is always a plain string — so React treats this element's
  // contents as opaque. That matters because `splitLines` rewrites them: if
  // React still believed it owned the original text node, unmounting (or a
  // StrictMode double-mount) would throw `removeChild: node is not a child`.
  const El = Tag;
  return (
    <El
      ref={ref}
      className={cn(className)}
      style={{ opacity: 0 }}
      dangerouslySetInnerHTML={{ __html: escapeText(children) }}
    />
  );
}
function escapeText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
