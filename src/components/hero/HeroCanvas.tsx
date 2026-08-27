"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { isTouchDevice, prefersReducedMotion } from "@/lib/motion";

/**
 * The hero's atmosphere layer.
 *
 * A single GPU-instanced point cloud that begins packed into the silhouette of
 * a moringa seed and disperses outward as the page scrolls — germination, read
 * as motion rather than illustration. It is deliberately abstract: procedural
 * geometry pretending to be a photorealistic plant is exactly the "generic 3D"
 * look this brand should avoid, so the botany is drawn (see BotanicalSeed) and
 * WebGL only carries light and dust.
 *
 * Costs are kept honest:
 *  - one draw call, one BufferGeometry, no lights, no post-processing
 *  - particle count scales with viewport and drops on touch devices
 *  - the RAF loop stops when the canvas leaves the viewport or the tab is hidden
 *  - the whole scene is disposed on unmount
 *  - nothing renders at all under prefers-reduced-motion
 */
export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // three is ~150KB gzipped; keep it out of the initial bundle entirely.
    import("three").then((THREE) => {
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      // Capping at 1.75 stops 3x phones rendering three times the pixels for
      // an effect that is mostly out-of-focus dust.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
      camera.position.z = 12;

      const compact = isTouchDevice() || window.innerWidth < 768;
      const COUNT = compact ? 900 : 2600;

      const positions = new Float32Array(COUNT * 3);
      const seeds = new Float32Array(COUNT * 3); // packed (seed) position
      const drift = new Float32Array(COUNT * 3); // dispersed target
      const scales = new Float32Array(COUNT);
      const offsets = new Float32Array(COUNT);

      for (let i = 0; i < COUNT; i++) {
        // Seed form: a squashed ellipsoid, denser at the core.
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.cbrt(Math.random()) * 1.5;

        seeds[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * 0.82;
        seeds[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 1.15;
        seeds[i * 3 + 2] = radius * Math.cos(phi) * 0.82;

        // Dispersed form: a wide, shallow volume — pollen on still air.
        drift[i * 3] = (Math.random() - 0.5) * 26;
        drift[i * 3 + 1] = (Math.random() - 0.5) * 15;
        drift[i * 3 + 2] = (Math.random() - 0.5) * 12;

        positions[i * 3] = seeds[i * 3]!;
        positions[i * 3 + 1] = seeds[i * 3 + 1]!;
        positions[i * 3 + 2] = seeds[i * 3 + 2]!;

        scales[i] = Math.random() * 0.7 + 0.3;
        offsets[i] = Math.random() * Math.PI * 2;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

      // A round, soft point sprite drawn in the fragment shader — no texture
      // fetch, no image request.
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uSize: { value: compact ? 46 : 62 },
          uPixelRatio: { value: renderer.getPixelRatio() },
          uWarm: { value: new THREE.Color(0xd9bc6a) },
          uCool: { value: new THREE.Color(0x5fae76) },
          uMix: { value: 0 },
          uOpacity: { value: 0 },
        },
        vertexShader: /* glsl */ `
          attribute float aScale;
          uniform float uSize;
          uniform float uPixelRatio;
          varying float vScale;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * aScale * uPixelRatio / -mv.z;
            vScale = aScale;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uWarm;
          uniform vec3 uCool;
          uniform float uMix;
          uniform float uOpacity;
          varying float vScale;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if (d > 0.5) discard;
            float falloff = smoothstep(0.5, 0.0, d);
            vec3 color = mix(uWarm, uCool, uMix * vScale);
            gl_FragColor = vec4(color, falloff * falloff * uOpacity * vScale);
          }
        `,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      let progress = 0; // 0 = packed seed, 1 = fully dispersed
      let intro = 0;

      const onPointerMove = (event: PointerEvent) => {
        pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
      };

      const onScroll = () => {
        const fold = window.innerHeight;
        progress = Math.min(1, window.scrollY / fold);
      };

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = canvas;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const attribute = geometry.getAttribute("position") as THREE_NS.BufferAttribute;
      const clock = new THREE.Clock();
      let frame = 0;
      let running = true;

      const render = () => {
        if (disposed) return;
        frame = requestAnimationFrame(render);
        if (!running) return;

        const t = clock.getElapsedTime();
        intro = Math.min(1, intro + 0.006);

        material.uniforms.uOpacity!.value = intro * 0.9;
        material.uniforms.uMix!.value = progress;

        // Ease the dispersal so the seed holds its shape a moment before it goes.
        const spread = progress * progress * (3 - 2 * progress);

        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3;
          const sway = Math.sin(t * 0.4 + offsets[i]!) * 0.22;
          attribute.array[i3] =
            seeds[i3]! + (drift[i3]! - seeds[i3]!) * spread + sway;
          attribute.array[i3 + 1] =
            seeds[i3 + 1]! +
            (drift[i3 + 1]! - seeds[i3 + 1]!) * spread +
            Math.cos(t * 0.32 + offsets[i]!) * 0.18 +
            spread * 1.4;
          attribute.array[i3 + 2] =
            seeds[i3 + 2]! + (drift[i3 + 2]! - seeds[i3 + 2]!) * spread;
        }
        attribute.needsUpdate = true;

        pointer.x += (pointer.tx - pointer.x) * 0.045;
        pointer.y += (pointer.ty - pointer.y) * 0.045;

        points.rotation.y = t * 0.05 + pointer.x * 0.28;
        points.rotation.x = pointer.y * 0.16;
        camera.position.z = 12 - spread * 2.4;

        renderer.render(scene, camera);
      };

      // Pause entirely when scrolled past or when the tab is backgrounded —
      // a hero animation should never burn battery on a page nobody is looking at.
      const observer = new IntersectionObserver(
        ([entry]) => {
          running = Boolean(entry?.isIntersecting) && !document.hidden;
        },
        { threshold: 0 },
      );
      observer.observe(canvas);

      const onVisibility = () => {
        running = !document.hidden && canvas.getBoundingClientRect().bottom > 0;
      };

      resize();
      onScroll();
      render();

      window.addEventListener("resize", resize);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibility);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      // The canvas is decorative; the hero reads perfectly without it.
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
