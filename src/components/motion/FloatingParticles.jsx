"use client";
import { useEffect, useRef } from "react";
/**
 * Ambient drift — pollen caught in a shaft of light, not a starfield.
 *
 * A particle field is the easiest way to put a phone's battery on fire, so
 * this one is written to be affordable:
 *
 * - One canvas, one `requestAnimationFrame` loop, no per-particle DOM.
 * - The loop is only running while the canvas is actually on screen and the
 *   tab is visible. Scrolled past, it stops entirely rather than compositing
 *   into a buffer nobody is looking at.
 * - Density scales with area and is hard-capped, so a 4K monitor gets a
 *   handful more motes, not a thousand.
 * - It is skipped outright under `prefers-reduced-motion`, and on coarse
 *   pointers, where the cost lands on a battery and the effect is invisible
 *   behind a thumb anyway.
 * - The canvas is backed by the device pixel ratio but capped at 2, because
 *   painting 3× on a phone buys nothing for a blurred dot.
 *
 * Purely decorative: `aria-hidden`, non-interactive, and the section reads
 * exactly the same with it absent.
 */
export function FloatingParticles({ className, density = 0.00004, max = 70 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    let motes = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(max, Math.round(width * height * density));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.6,
        // Slow, and biased upward: dust rising rather than snow falling.
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.05 - Math.random() * 0.14,
        a: 0.12 + Math.random() * 0.3,
      }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        // Wrap rather than respawn, so the field never visibly restarts.
        if (m.y < -4) {
          m.y = height + 4;
          m.x = Math.random() * width;
        }
        if (m.x < -4) m.x = width + 4;
        if (m.x > width + 4) m.x = -4;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        // Warm gold, to match the accent rather than fight it.
        ctx.fillStyle = `rgba(217, 188, 106, ${m.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    resize();
    // Only paint while the canvas is on screen.
    const visible = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0 },
    );
    visible.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : undefined);
    document.addEventListener("visibilitychange", onVisibility);
    const onResize = () => {
      resize();
    };
    window.addEventListener("resize", onResize);
    return () => {
      stop();
      visible.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [density, max]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-0 h-full w-full"}
    />
  );
}
