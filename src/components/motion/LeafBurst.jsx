"use client";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";
/**
 * A small burst of leaves where the mouse clicks. Nothing runs between
 * clicks: one pointerdown listener spawns six tiny leaves that fly out with
 * a CSS animation and remove themselves, so it adds no per-frame work and
 * cannot bring back the lag the old animated cursor caused. Mouse only.
 */
const COUNT = 6;
export function LeafBurst() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;
    const onDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      const burst = document.createElement("span");
      burst.className = "leaf-burst";
      burst.setAttribute("aria-hidden", "true");
      burst.style.left = `${event.clientX}px`;
      burst.style.top = `${event.clientY}px`;
      for (let i = 0; i < COUNT; i++) {
        const leaf = document.createElement("i");
        const angle = (360 / COUNT) * i + Math.random() * 40 - 20;
        const distance = 18 + Math.random() * 14;
        leaf.style.setProperty("--a", `${angle}deg`);
        leaf.style.setProperty("--d", `${distance}px`);
        burst.appendChild(leaf);
      }
      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), 700);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
