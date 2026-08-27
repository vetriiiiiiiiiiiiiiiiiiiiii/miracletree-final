"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The animation system.
 *
 * Every timeline the site uses is defined here as a factory that takes elements
 * and returns a GSAP timeline or a teardown function. Components call these;
 * they never write raw tweens. That keeps easing, duration and stagger
 * consistent across the site and makes reduced-motion a single decision.
 *
 * GSAP's SplitText is a Club-only plugin, so the text splitting below is our
 * own — no licensing dependency.
 */

let registered = false;

export function initMotion(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE.organic, duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

export const EASE = {
  organic: "power3.out",
  swift: "power2.out",
  spring: "elastic.out(1, 0.6)",
  inOut: "power2.inOut",
} as const;

export const DURATION = {
  fast: 0.35,
  base: 0.7,
  slow: 1.1,
  cinematic: 1.8,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

// ---------------------------------------------------------------- text

export type SplitResult = { lines: HTMLElement[]; revert: () => void };

/**
 * Wraps each visual line of text in a clipping mask so the line can slide up
 * from behind it. Splits by measured line box, not by word count, so it stays
 * correct at any viewport width.
 */
export function splitLines(element: HTMLElement): SplitResult {
  const original = element.innerHTML;
  const text = element.textContent ?? "";

  // Wrap every word, measure where the line breaks land, then regroup.
  element.innerHTML = text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `<span data-word style="display:inline-block">${escapeHtml(word)}</span>`)
    .join(" ");

  const words = [...element.querySelectorAll<HTMLElement>("[data-word]")];
  const rows = new Map<number, HTMLElement[]>();
  for (const word of words) {
    const top = Math.round(word.offsetTop);
    const bucket = rows.get(top) ?? [];
    bucket.push(word);
    rows.set(top, bucket);
  }

  const lines: HTMLElement[] = [];
  element.innerHTML = "";
  for (const bucket of [...rows.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])) {
    const mask = document.createElement("span");
    mask.className = "split-line";
    const inner = document.createElement("span");
    inner.textContent = bucket.map((w) => w.textContent).join(" ");
    mask.appendChild(inner);
    element.appendChild(mask);
    lines.push(inner);
  }

  return {
    lines,
    revert: () => {
      element.innerHTML = original;
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Line-by-line reveal, the site's default entrance for headings. */
export function textReveal(
  element: HTMLElement,
  options: { delay?: number; stagger?: number; trigger?: Element | null } = {},
): () => void {
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, clearProps: "transform" });
    return () => {};
  }

  const split = splitLines(element);
  gsap.set(element, { opacity: 1 });
  gsap.set(split.lines, { yPercent: 110 });

  const tween = gsap.to(split.lines, {
    yPercent: 0,
    duration: DURATION.slow,
    ease: EASE.organic,
    stagger: options.stagger ?? 0.08,
    delay: options.delay ?? 0,
    scrollTrigger: options.trigger
      ? { trigger: options.trigger, start: "top 82%", once: true }
      : undefined,
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    split.revert();
  };
}

// ---------------------------------------------------------------- reveals

/** Fade-and-rise for any element or group entering the viewport. */
export function revealOnScroll(
  targets: gsap.TweenTarget,
  options: {
    trigger?: Element | null;
    y?: number;
    stagger?: number;
    start?: string;
    delay?: number;
  } = {},
): ScrollTrigger | undefined {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, clearProps: "transform" });
    return undefined;
  }

  const tween = gsap.to(targets, {
    opacity: 1,
    y: 0,
    duration: DURATION.base,
    ease: EASE.organic,
    stagger: options.stagger ?? 0.09,
    delay: options.delay ?? 0,
    scrollTrigger: {
      trigger: options.trigger ?? (targets as Element),
      start: options.start ?? "top 85%",
      once: true,
    },
  });

  return tween.scrollTrigger;
}

/**
 * Image reveal: the mask lifts while the image itself settles back from a
 * slight overscale. Reads as the photograph arriving rather than a box fading.
 */
export function imageReveal(
  wrapper: HTMLElement,
  image: HTMLElement,
): ScrollTrigger | undefined {
  if (prefersReducedMotion()) {
    gsap.set([wrapper, image], { clipPath: "none", scale: 1, opacity: 1 });
    return undefined;
  }

  const tl = gsap.timeline({
    scrollTrigger: { trigger: wrapper, start: "top 85%", once: true },
  });

  tl.fromTo(
    wrapper,
    { clipPath: "inset(0% 0% 100% 0%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: DURATION.cinematic, ease: EASE.organic },
  ).fromTo(
    image,
    { scale: 1.18 },
    { scale: 1, duration: DURATION.cinematic + 0.3, ease: EASE.organic },
    0,
  );

  return tl.scrollTrigger;
}

/** Slow vertical drift tied to scroll position. Used behind large imagery. */
export function parallax(
  element: HTMLElement,
  options: { amount?: number; trigger?: Element } = {},
): ScrollTrigger | undefined {
  if (prefersReducedMotion()) return undefined;

  const tween = gsap.fromTo(
    element,
    { yPercent: -(options.amount ?? 8) },
    {
      yPercent: options.amount ?? 8,
      ease: "none",
      scrollTrigger: {
        trigger: options.trigger ?? element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    },
  );

  return tween.scrollTrigger;
}

// ---------------------------------------------------------------- product

/** Card entrance for a product grid. */
export function productReveal(cards: HTMLElement[], trigger: Element): ScrollTrigger | undefined {
  return revealOnScroll(cards, { trigger, y: 40, stagger: 0.07, start: "top 88%" });
}

/**
 * Scrubs a product's image sequence (or a 3D model's rotation) against scroll.
 * Returns the progress driver so a WebGL scene can subscribe without importing
 * ScrollTrigger itself.
 */
export function productRotation(
  trigger: HTMLElement,
  onProgress: (progress: number) => void,
): ScrollTrigger | undefined {
  if (prefersReducedMotion()) {
    onProgress(0);
    return undefined;
  }

  return ScrollTrigger.create({
    trigger,
    start: "top bottom",
    end: "bottom top",
    scrub: 0.6,
    onUpdate: (self) => onProgress(self.progress),
  });
}

/**
 * Scroll progress across a sticky stage.
 *
 * Deliberately does NOT use ScrollTrigger's `pin`. Pinning wraps the target in
 * a `.pin-spacer` element, which restructures DOM that React owns — React then
 * throws `removeChild: node is not a child` when that subtree unmounts. The
 * caller supplies a tall track with a `position: sticky` child instead, which
 * achieves the same effect in pure CSS and leaves the tree untouched.
 */
export function stickyProgress(
  track: HTMLElement,
  onProgress: (progress: number) => void,
  options: { scrub?: number } = {},
): ScrollTrigger | undefined {
  if (prefersReducedMotion()) {
    onProgress(1); // Show the finished state rather than an empty stage.
    return undefined;
  }

  return ScrollTrigger.create({
    trigger: track,
    start: "top top",
    end: "bottom bottom",
    scrub: options.scrub ?? 0.8,
    onUpdate: (self) => onProgress(self.progress),
  });
}

/** The moringa growth stage. Thin alias over `stickyProgress`. */
export function treeGrowth(
  track: HTMLElement,
  onProgress: (progress: number) => void,
): ScrollTrigger | undefined {
  return stickyProgress(track, onProgress);
}

/**
 * Horizontal rail driven by vertical scroll, again without pinning: the caller
 * makes the section tall and its stage sticky, and this maps scroll progress
 * onto the track's translateX.
 */
export function horizontalRail(
  track: HTMLElement,
  rail: HTMLElement,
): ScrollTrigger | undefined {
  if (prefersReducedMotion() || isTouchDevice()) return undefined;

  const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth + 64);

  const setX = gsap.quickTo(rail, "x", { duration: 0.35, ease: EASE.swift });

  return ScrollTrigger.create({
    trigger: track,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => setX(-distance() * self.progress),
  });
}

// ---------------------------------------------------------------- hero

/**
 * The opening sequence. Runs once, on a near-black stage, and hands control to
 * the page when it finishes. Kept short: the seed sequence is atmosphere, not a
 * toll booth in front of the shop.
 */
export function heroTimeline(refs: {
  stage: HTMLElement;
  seed: HTMLElement | null;
  headline: HTMLElement;
  sub: HTMLElement | null;
  actions: HTMLElement | null;
  scrollCue: HTMLElement | null;
  onComplete?: () => void;
}): gsap.core.Timeline {
  const reduced = prefersReducedMotion();
  const tl = gsap.timeline({ onComplete: refs.onComplete });

  if (reduced) {
    tl.set([refs.headline, refs.sub, refs.actions, refs.scrollCue].filter(Boolean), {
      opacity: 1,
      y: 0,
    });
    return tl;
  }

  if (refs.seed) {
    tl.fromTo(
      refs.seed,
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: 1.4, ease: EASE.organic },
    );
  }

  const split = splitLines(refs.headline);
  gsap.set(refs.headline, { opacity: 1 });
  gsap.set(split.lines, { yPercent: 110 });

  tl.to(
    split.lines,
    { yPercent: 0, duration: 1.3, stagger: 0.1, ease: EASE.organic },
    refs.seed ? "-=0.7" : 0,
  );

  if (refs.sub) {
    tl.to(refs.sub, { opacity: 1, y: 0, duration: DURATION.base }, "-=0.8");
  }
  if (refs.actions) {
    tl.to(refs.actions, { opacity: 1, y: 0, duration: DURATION.base }, "-=0.55");
  }
  if (refs.scrollCue) {
    tl.to(refs.scrollCue, { opacity: 1, duration: DURATION.base }, "-=0.4");
  }

  return tl;
}

// ---------------------------------------------------------------- interaction

/**
 * Magnetic pull toward the cursor. `quickTo` is used so pointer movement never
 * queues a new tween — this stays cheap even with many buttons on screen.
 */
export function magneticButton(
  element: HTMLElement,
  options: { strength?: number; radius?: number } = {},
): () => void {
  if (prefersReducedMotion() || isTouchDevice()) return () => {};

  const strength = options.strength ?? 0.3;
  const moveX = gsap.quickTo(element, "x", { duration: 0.5, ease: EASE.organic });
  const moveY = gsap.quickTo(element, "y", { duration: 0.5, ease: EASE.organic });

  const onMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    moveX(relX * strength);
    moveY(relY * strength);
  };

  const onLeave = () => {
    moveX(0);
    moveY(0);
  };

  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", onLeave);

  return () => {
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerleave", onLeave);
    gsap.killTweensOf(element);
  };
}

/** Page-level entrance used by the route transition overlay. */
export function sectionTransition(overlay: HTMLElement, direction: "in" | "out") {
  if (prefersReducedMotion()) {
    gsap.set(overlay, { opacity: direction === "in" ? 0 : 1 });
    return gsap.timeline();
  }

  return direction === "in"
    ? gsap.timeline().to(overlay, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.7,
        ease: EASE.organic,
      })
    : gsap.timeline().fromTo(
        overlay,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: EASE.inOut },
      );
}

export function refreshScrollTriggers(): void {
  if (registered) ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger };
