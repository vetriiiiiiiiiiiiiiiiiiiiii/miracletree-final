"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useTheme } from "@/components/theme/ThemeProvider";
/**
 * Mounts the Moringa World and binds it to scroll.
 *
 * The canvas is `position: sticky` inside a very tall spacer, so the visitor
 * scrolls a normal page while the camera travels the scene — no scroll
 * hijacking, no wheel interception, and the scrollbar always tells the truth
 * about how far through they are.
 *
 * Three escape hatches, because a 3D homepage must never be a wall:
 *  - `prefers-reduced-motion` renders a static composed frame and nothing moves.
 *  - No WebGL, or a lost context, falls back to the poster image.
 *  - The whole thing is progressive: the DOM copy underneath is real text that
 *    ships in the HTML, so the page reads and ranks without a single shader.
 */
/**
 * Where the camera rests in `hero` mode. 0.42 is the canopy — the most legible
 * composition in the whole journey, and the frame the reduced-motion path
 * already used.
 */
const HERO_REST = 0.42;
export function MoringaWorld({
  onChapter,
  poster,
  className,
  variant = "journey",
  children,
}) {
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const trackRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const chapterHandler = useRef(onChapter);
  chapterHandler.current = onChapter;
  useEffect(() => {
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;
    if (!hasWebGL()) {
      setFailed(true);
      return;
    }
    const reduced = prefersReducedMotion();
    let scene;
    let cancelled = false;
    const cleanups = [];
    import("@/lib/world/MoringaScene")
      .then(({ MoringaScene }) => {
        if (cancelled) return;
        scene = new MoringaScene(canvas, pickQuality(), theme);
        scene.onChapterChange((state) => chapterHandler.current?.(state));
        setReady(true);
        // --- scroll → camera
        const readProgress = () => {
          const rect = track.getBoundingClientRect();
          const total = rect.height - window.innerHeight;
          if (total <= 0) return 0;
          return Math.min(1, Math.max(0, -rect.top / total));
        };
        if (variant === "hero") {
          scene.snapTo(HERO_REST);
          if (!reduced) {
            // A slow figure-of-eight around the rest point. Small enough that
            // nothing ever leaves frame, large enough that the scene reads as
            // alive rather than as a still image.
            const began = performance.now();
            let raf = 0;
            const drift = () => {
              const t = (performance.now() - began) / 1000;
              scene?.setProgress(HERO_REST + Math.sin(t * 0.09) * 0.02);
              scene?.setPointer(Math.sin(t * 0.06) * 0.35, Math.cos(t * 0.045) * 0.25);
              raf = requestAnimationFrame(drift);
            };
            raf = requestAnimationFrame(drift);
            cleanups.push(() => cancelAnimationFrame(raf));
            // The pointer still steers it, over the top of the drift.
            const onPointer = (event) => {
              scene?.setPointer(
                (event.clientX / window.innerWidth) * 2 - 1,
                -((event.clientY / window.innerHeight) * 2 - 1),
              );
            };
            window.addEventListener("pointermove", onPointer, { passive: true });
            cleanups.push(() => window.removeEventListener("pointermove", onPointer));
          }
        } else if (reduced) {
          // A single composed frame partway through the journey: the canopy,
          // which is the most legible moment in the scene.
          scene.snapTo(0.42);
        } else {
          scene.snapTo(readProgress());
          const onScroll = () => scene?.setProgress(readProgress());
          window.addEventListener("scroll", onScroll, { passive: true });
          cleanups.push(() => window.removeEventListener("scroll", onScroll));
          const onPointer = (event) => {
            scene?.setPointer(
              (event.clientX / window.innerWidth) * 2 - 1,
              -((event.clientY / window.innerHeight) * 2 - 1),
            );
          };
          window.addEventListener("pointermove", onPointer, { passive: true });
          cleanups.push(() => window.removeEventListener("pointermove", onPointer));
        }
        const onResize = () => scene?.resize();
        window.addEventListener("resize", onResize);
        cleanups.push(() => window.removeEventListener("resize", onResize));
        // --- stop rendering when off-screen or backgrounded
        const observer = new IntersectionObserver(
          ([entry]) =>
            scene?.setRunning(Boolean(entry?.isIntersecting) && !document.hidden),
          { threshold: 0 },
        );
        observer.observe(track);
        cleanups.push(() => observer.disconnect());
        const onVisibility = () => {
          const visible = track.getBoundingClientRect().bottom > 0;
          scene?.setRunning(!document.hidden && visible);
        };
        document.addEventListener("visibilitychange", onVisibility);
        cleanups.push(() =>
          document.removeEventListener("visibilitychange", onVisibility),
        );
        // A lost GPU context must degrade, not leave a black hole in the page.
        const onLost = (event) => {
          event.preventDefault();
          setFailed(true);
        };
        canvas.addEventListener("webglcontextlost", onLost);
        cleanups.push(() => canvas.removeEventListener("webglcontextlost", onLost));
      })
      .catch((error) => {
        // A silent failure here leaves a black rectangle with no explanation,
        // so the reason is always logged even though the UI degrades quietly.
        console.error("[MoringaWorld] scene failed to start", error);
        setFailed(true);
      });
    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      scene?.dispose();
    };
  }, [theme, variant]);
  return (
    <div
      ref={trackRef}
      className={className}
      // A journey needs a tall track for the camera to travel across. A hero is
      // exactly one screen and never asks to be scrolled through.
      style={{ height: variant === "hero" ? "100svh" : "240svh" }}
    >
      <div
        className={
          variant === "hero"
            ? "relative h-[100svh] w-full overflow-hidden bg-[var(--mt-world-void)]"
            : "sticky top-0 h-[100svh] w-full overflow-hidden bg-[var(--mt-world-void)]"
        }
      >
        <canvas
          ref={canvasRef}
          aria-hidden
          className="block h-full w-full"
          style={{
            opacity: ready && !failed ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}
        />

        {/* Poster fallback: no WebGL, a lost context, or the scene still loading. */}
        {(failed || !ready) && poster ? (
          <div className="absolute inset-0 grid place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster.url}
              alt={poster.alt}
              className="max-h-[62%] w-auto object-contain opacity-80"
            />
          </div>
        ) : null}

        {/* Vignette. Keeps the copy legible wherever the camera happens to be. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 50%, rgba(5,7,10,0) 35%, rgba(5,7,10,0.72) 100%)",
          }}
        />

        {children}
      </div>
    </div>
  );
}
function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}
/**
 * Quality tier. Deliberately conservative: a mid-range Android has plenty of
 * cores but a thermally limited GPU, so `deviceMemory` and coarse pointer are
 * better signals than core count alone.
 */
function pickQuality() {
  const nav = navigator;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const memory = nav.deviceMemory ?? 4;
  const narrow = window.innerWidth < 768;
  if (narrow || (coarse && memory <= 4)) return "low";
  if (coarse || memory <= 4 || window.innerWidth < 1280) return "medium";
  return "high";
}
