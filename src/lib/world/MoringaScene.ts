import * as THREE from "three";
import {
  CELL_FRAGMENT,
  CELL_VERTEX,
  FLOWER_FRAGMENT,
  FLOWER_VERTEX,
  POD_FRAGMENT,
  POD_VERTEX,
  LEAF_FRAGMENT,
  LEAF_VERTEX,
  PARTICLE_FRAGMENT,
  PARTICLE_VERTEX,
  RIM_FRAGMENT,
  RIM_VERTEX,
} from "./shaders";

/**
 * The Moringa World.
 *
 * One Three.js scene the visitor travels through: the camera rides a spline
 * from a seed in the dark, down into the soil, up the stem, through the canopy,
 * inside a leaf, and out into the product. Scroll drives position along that
 * path — nothing animates on its own timeline, so the journey is always exactly
 * where the visitor left it.
 *
 * Why it is built this way:
 *
 *  - **One scene, seven chapters.** Objects are never created or destroyed
 *    mid-journey; each chapter fades its own group in and out by opacity. That
 *    means no allocation during scroll and no frame spikes at boundaries.
 *  - **Instancing everywhere.** ~8,000 leaflets are one draw call, as are the
 *    cells. The particle field is a single BufferGeometry.
 *  - **Quality tiers, not feature flags.** `quality` scales counts and pixel
 *    ratio. A phone runs the same code with a tenth of the geometry.
 *  - **Everything is disposable.** `dispose()` returns every buffer, program
 *    and texture, because this scene unmounts on route change.
 *
 * Deliberately absent: postprocessing. Bloom would cost a full-screen pass on
 * every frame; additive particles and rim lighting against near-black already
 * read as glow, so the pass would buy very little for a lot of milliseconds.
 */

export type Quality = "high" | "medium" | "low";

export type ChapterState = {
  index: number;
  /** 0–1 within the current chapter. */
  local: number;
  /** 0–1 across the whole journey. */
  global: number;
};

const PALETTE = {
  void: new THREE.Color("#05070a"),
  soil: new THREE.Color("#120d08"),
  deepLeaf: new THREE.Color("#0d3a22"),
  brightLeaf: new THREE.Color("#3fae6b"),
  gold: new THREE.Color("#d9bc6a"),
  cream: new THREE.Color("#f4f1e8"),
  cellCore: new THREE.Color("#7fe0a3"),
  cellEdge: new THREE.Color("#123d26"),
};

/**
 * The camera path. Each chapter owns a stretch of the curve; the copy overlay
 * in the DOM is keyed to the same indices, so text and space never disagree.
 */
const CAMERA_POINTS: [number, number, number][] = [
  [0, 0.2, 9],       // 0 the void — seed ahead
  [0, 0.0, 3.4],     // approach
  [0.6, -3.2, 1.2],  // 1 descending into soil
  [0.2, -7.0, 0.4],  // roots
  [-0.4, -2.0, 1.6], // 2 the rise begins
  [0.5, 6.0, 2.2],   // climbing the stem
  [-0.3, 14.0, 2.6], // 3 into the canopy
  [0.4, 19.5, 1.4],  // among leaflets
  [0.0, 22.5, 0.35], // 4 pushing into a leaf
  [0.0, 23.6, -1.8], // 5 inside — cellular
  [0.0, 24.2, -5.2], // through
  [0.0, 24.4, -9.0], // 6 out into the product
];

const LOOK_POINTS: [number, number, number][] = [
  [0, 0.1, 0],
  [0, -0.4, -1],
  [0.2, -4.5, -0.6],
  [0, -7.6, -1.2],
  [0, 1.5, -0.6],
  [0, 9.0, -0.4],
  [0, 16.5, -0.8],
  [0, 21.0, -0.6],
  [0, 23.2, -1.6],
  [0, 23.9, -4.0],
  [0, 24.3, -7.5],
  [0, 24.4, -12.0],
];

/** Where each chapter sits on the 0–1 journey. */
export const CHAPTER_STOPS = [0, 0.13, 0.3, 0.47, 0.62, 0.75, 0.88, 1];

export class MoringaScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  private cameraCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;

  private groups: Record<string, THREE.Group> = {};
  private materials: THREE.ShaderMaterial[] = [];
  private disposables: { dispose(): void }[] = [];

  private leafMaterial!: THREE.ShaderMaterial;
  private particleMaterial!: THREE.ShaderMaterial;
  private cellMaterial!: THREE.ShaderMaterial;
  private podMaterial!: THREE.ShaderMaterial;
  private flowerMaterial!: THREE.ShaderMaterial;
  private seedMaterial!: THREE.ShaderMaterial;
  private stemMaterial!: THREE.ShaderMaterial;
  private rootMaterial!: THREE.ShaderMaterial;

  private frame = 0;
  private running = true;
  private disposed = false;

  /** Scroll progress, and the damped value actually used for rendering. */
  private targetProgress = 0;
  private progress = 0;
  private pointer = new THREE.Vector2();
  private pointerWorld = new THREE.Vector3(0, 0, -50);
  private pointerSmoothed = new THREE.Vector2();

  private onChapter?: (state: ChapterState) => void;
  private lastChapter = -1;
  /** Portrait viewports frame the subject high, above the copy. */
  private portrait = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private quality: Quality,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality === "high",
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    this.renderer.setClearColor(PALETTE.void, 1);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, quality === "high" ? 1.75 : 1.25),
    );

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    this.scene.fog = new THREE.Fog(PALETTE.void, 12, 46);

    this.cameraCurve = new THREE.CatmullRomCurve3(
      CAMERA_POINTS.map((p) => new THREE.Vector3(...p)),
      false,
      "catmullrom",
      0.5,
    );
    this.lookCurve = new THREE.CatmullRomCurve3(
      LOOK_POINTS.map((p) => new THREE.Vector3(...p)),
      false,
      "catmullrom",
      0.5,
    );

    this.build();
    this.resize();
    this.loop();
  }

  // ------------------------------------------------------------------ build

  private counts() {
    switch (this.quality) {
      case "high":
        return { leaves: 2600, particles: 4200, cells: 700, roots: 22, pods: 85, flowers: 240 };
      case "medium":
        return { leaves: 1300, particles: 1900, cells: 340, roots: 14, pods: 64, flowers: 140 };
      default:
        return { leaves: 520, particles: 800, cells: 140, roots: 8, pods: 26, flowers: 60 };
    }
  }

  private track<T extends THREE.ShaderMaterial>(material: T): T {
    this.materials.push(material);
    this.disposables.push(material);
    return material;
  }

  private build() {
    const { leaves, particles, cells, roots, pods, flowers } = this.counts();

    this.buildSeed();
    this.buildRoots(roots);
    this.buildStem();
    this.buildCanopy(leaves);
    this.buildFlowers(flowers);
    this.buildPods(pods);
    this.buildCells(cells);
    this.buildParticles(particles);

    for (const group of Object.values(this.groups)) this.scene.add(group);
  }

  private group(name: string): THREE.Group {
    const group = new THREE.Group();
    this.groups[name] = group;
    return group;
  }

  private buildSeed() {
    const group = this.group("seed");

    const geometry = new THREE.IcosahedronGeometry(0.46, 32);
    this.disposables.push(geometry);

    this.seedMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: RIM_VERTEX,
        fragmentShader: RIM_FRAGMENT,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uDisplace: { value: 0.022 },
          uBase: { value: new THREE.Color("#0b0f0d") },
          uRim: { value: new THREE.Color("#e6d3a3") },
          uRimPower: { value: 3.4 },
          uGlow: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    );

    const seed = new THREE.Mesh(geometry, this.seedMaterial);
    seed.position.set(0, 0.1, 0);
    group.add(seed);
  }

  private buildRoots(count: number) {
    const group = this.group("roots");

    this.rootMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: RIM_VERTEX,
        fragmentShader: RIM_FRAGMENT,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uDisplace: { value: 0.02 },
          uBase: { value: new THREE.Color("#1a1108") },
          uRim: { value: new THREE.Color("#c9a86a") },
          uRimPower: { value: 1.8 },
          uGlow: { value: 0.4 },
          uOpacity: { value: 0 },
        },
      }),
    );

    // Roots fan outward and downward from the seed on randomised curves.
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spread = 0.8 + Math.random() * 2.6;
      const depth = 2 + Math.random() * 6;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.2, 0),
        new THREE.Vector3(
          Math.cos(angle) * spread * 0.3,
          -depth * 0.3,
          Math.sin(angle) * spread * 0.3,
        ),
        new THREE.Vector3(
          Math.cos(angle) * spread * 0.75,
          -depth * 0.7,
          Math.sin(angle) * spread * 0.75,
        ),
        new THREE.Vector3(
          Math.cos(angle) * spread,
          -depth,
          Math.sin(angle) * spread,
        ),
      ]);

      const geometry = new THREE.TubeGeometry(curve, 24, 0.035, 5, false);
      this.disposables.push(geometry);
      group.add(new THREE.Mesh(geometry, this.rootMaterial));
    }
  }

  private buildStem() {
    const group = this.group("stem");

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.3, 0),
      new THREE.Vector3(0.15, 5, -0.1),
      new THREE.Vector3(-0.1, 11, 0.15),
      new THREE.Vector3(0.08, 17, -0.05),
      new THREE.Vector3(0, 23, 0),
    ]);

    const geometry = new THREE.TubeGeometry(curve, 120, 0.075, 8, false);
    this.disposables.push(geometry);

    this.stemMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: RIM_VERTEX,
        fragmentShader: RIM_FRAGMENT,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uDisplace: { value: 0.012 },
          uBase: { value: new THREE.Color("#0d1a12") },
          // Dim: a bright stem runs straight down the middle of every canopy
          // frame and splits the composition in two.
          uRim: { value: new THREE.Color("#3f6b4e") },
          uRimPower: { value: 3.2 },
          uGlow: { value: 0.12 },
          uOpacity: { value: 0 },
        },
      }),
    );

    group.add(new THREE.Mesh(geometry, this.stemMaterial));
  }

  private buildCanopy(count: number) {
    const group = this.group("canopy");

    // A quad is enough: the leaflet silhouette is cut in the fragment shader,
    // so there is no alpha texture to download and no extra vertices to
    // transform.
    // Elongated rather than square: a moringa leaflet is an oval about twice
    // as long as it is wide, and a square quad is what made the first pass read
    // as a wall of rounded rectangles.
    const base = new THREE.PlaneGeometry(0.62, 1, 1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.attributes.position = base.attributes.position;
    geometry.attributes.normal = base.attributes.normal;
    geometry.attributes.uv = base.attributes.uv;
    geometry.instanceCount = count;
    this.disposables.push(base, geometry);

    const offsets = new Float32Array(count * 3);
    const rotations = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const heights = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Leaflets cluster along the stem between y=3 and y=25, denser near the top.
      const t = Math.pow(Math.random(), 0.65);
      const y = 3 + t * 22;
      // Pushed outward and hollowed in the middle so the camera flies through
      // open air with foliage around it, rather than through solid green.
      const radius = 2.6 + Math.pow(Math.random(), 0.45) * (2.2 + t * 6.5);
      const angle = Math.random() * Math.PI * 2;

      offsets[i * 3] = Math.cos(angle) * radius;
      offsets[i * 3 + 1] = y;
      offsets[i * 3 + 2] = Math.sin(angle) * radius;

      rotations[i * 3] = (Math.random() - 0.5) * 1.2;
      rotations[i * 3 + 1] = angle + Math.PI / 2;
      rotations[i * 3 + 2] = (Math.random() - 0.5) * 0.9;

      // Wide size variance is most of what sells depth at a glance.
      scales[i] = 0.3 + Math.pow(Math.random(), 1.8) * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
      heights[i] = t;
    }

    geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute("aRotation", new THREE.InstancedBufferAttribute(rotations, 3));
    geometry.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
    geometry.setAttribute("aHeight", new THREE.InstancedBufferAttribute(heights, 1));

    this.leafMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: LEAF_VERTEX,
        fragmentShader: LEAF_FRAGMENT,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uWind: { value: 0.35 },
          uPointer: { value: new THREE.Vector3(0, 0, -50) },
          uDeep: { value: PALETTE.deepLeaf.clone() },
          uBright: { value: PALETTE.brightLeaf.clone() },
          uGold: { value: PALETTE.gold.clone() },
          uFogNear: { value: 4 },
          uFogFar: { value: 22 },
          uFogColor: { value: PALETTE.void.clone() },
          uOpacity: { value: 0 },
        },
      }),
    );

    const mesh = new THREE.Mesh(geometry, this.leafMaterial);
    // The canopy is always on screen during its chapters; skipping the frustum
    // test avoids recomputing a bounding sphere for 7,000 instances.
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  /**
   * The drumstick pods — the part of this tree that is actually a vegetable.
   * They hang below the branches, so they sit lower and further out than the
   * leaflets, and they are what makes the canopy read as a moringa rather than
   * as generic foliage.
   */
  private buildPods(count: number) {
    const group = this.group("pods");

    // Open-ended, so no cap disc shows when a pod passes the camera.
    const base = new THREE.CylinderGeometry(0.55, 1, 1, 7, 6, true);
    // Pivot at the shoulder: a pod hangs from its top, not its middle.
    base.translate(0, -0.5, 0);

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.attributes.position = base.attributes.position;
    geometry.attributes.normal = base.attributes.normal;
    geometry.attributes.uv = base.attributes.uv;
    geometry.instanceCount = count;
    this.disposables.push(base, geometry);

    const offsets = new Float32Array(count * 3);
    const lengths = new Float32Array(count);
    const girths = new Float32Array(count);
    const phases = new Float32Array(count);
    const tilts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = Math.pow(Math.random(), 0.8);
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.pow(Math.random(), 0.6) * 5.4;

      offsets[i * 3] = Math.cos(angle) * radius;
      offsets[i * 3 + 1] = 7 + t * 15;
      offsets[i * 3 + 2] = Math.sin(angle) * radius;

      // Real drumsticks run 25-50cm and are strikingly thin for their length.
      lengths[i] = 2.2 + Math.random() * 1.9;
      girths[i] = 0.10 + Math.random() * 0.07;
      phases[i] = Math.random() * Math.PI * 2;
      tilts[i] = (Math.random() - 0.5) * 0.22;
    }

    geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute("aLength", new THREE.InstancedBufferAttribute(lengths, 1));
    geometry.setAttribute("aGirth", new THREE.InstancedBufferAttribute(girths, 1));
    geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
    geometry.setAttribute("aTilt", new THREE.InstancedBufferAttribute(tilts, 1));

    this.podMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: POD_VERTEX,
        fragmentShader: POD_FRAGMENT,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uWind: { value: 0.25 },
          uBody: { value: new THREE.Color("#1e4a2a") },
          uRidge: { value: new THREE.Color("#6fae72") },
          uTip: { value: new THREE.Color("#8a9b55") },
          uFogNear: { value: 6 },
          uFogFar: { value: 26 },
          uFogColor: { value: PALETTE.void.clone() },
          uOpacity: { value: 0 },
        },
      }),
    );

    const mesh = new THREE.Mesh(geometry, this.podMaterial);
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  /** Cream blossom — eaten too, and the only warm note in the canopy. */
  private buildFlowers(count: number) {
    const group = this.group("flowers");

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = Math.pow(Math.random(), 0.7);
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.6 + Math.pow(Math.random(), 0.5) * 5.2;

      const x = Math.cos(angle) * radius;
      const y = 9 + t * 14;
      const z = Math.sin(angle) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      offsets[i * 3] = x;
      offsets[i * 3 + 1] = y;
      offsets[i * 3 + 2] = z;

      scales[i] = 0.5 + Math.random() * 0.9;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    this.disposables.push(geometry);

    this.flowerMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: FLOWER_VERTEX,
        fragmentShader: FLOWER_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uSize: { value: 90 },
          uPixelRatio: { value: this.renderer.getPixelRatio() },
          uPetal: { value: new THREE.Color("#f2ead2") },
          uCentre: { value: new THREE.Color("#e8c86a") },
          uOpacity: { value: 0 },
        },
      }),
    );

    const points = new THREE.Points(geometry, this.flowerMaterial);
    points.frustumCulled = false;
    group.add(points);
  }

  private buildCells(count: number) {
    const group = this.group("cells");

    const base = new THREE.IcosahedronGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.attributes.position = base.attributes.position;
    geometry.attributes.normal = base.attributes.normal;
    geometry.instanceCount = count;
    this.disposables.push(base, geometry);

    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      offsets[i * 3] = (Math.random() - 0.5) * 14;
      offsets[i * 3 + 1] = 24 + (Math.random() - 0.5) * 5.5;
      offsets[i * 3 + 2] = -3 - Math.random() * 7;
      // Small: oversized cells fill the frame like lens dirt rather than
      // reading as structures suspended in the leaf.
      scales[i] = 0.04 + Math.random() * 0.11;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));

    this.cellMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: CELL_VERTEX,
        fragmentShader: CELL_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uCore: { value: PALETTE.cellCore.clone() },
          uEdge: { value: PALETTE.cellEdge.clone() },
          uOpacity: { value: 0 },
        },
      }),
    );

    const mesh = new THREE.Mesh(geometry, this.cellMaterial);
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  private buildParticles(count: number) {
    const group = this.group("particles");

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Free-floating: a tall column of motes around the whole journey.
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = -8 + Math.random() * 38;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;

      // Target: a soft cylinder standing where the product resolves — the
      // particles gather into the silhouette of a pouch before the photograph
      // fades in over them.
      // An upright pouch: narrow, taller than wide, with shoulders that taper.
      // A uniform cylinder reads as a rectangular slab head-on.
      const h = Math.random();                    // 0 = base, 1 = top
      const taper = 0.55 + 0.45 * Math.sin(h * Math.PI * 0.85 + 0.35);
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.85 * taper;
      targets[i * 3] = Math.cos(a) * r;
      targets[i * 3 + 1] = 23.1 + h * 2.7;
      targets[i * 3 + 2] = -12 + Math.sin(a) * r * 0.5;

      scales[i] = 0.35 + Math.random() * 0.8;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    this.disposables.push(geometry);

    this.particleMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERTEX,
        fragmentShader: PARTICLE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uSize: { value: 58 },
          uPixelRatio: { value: this.renderer.getPixelRatio() },
          uPointer: { value: new THREE.Vector3(0, 0, -50) },
          uWarm: { value: PALETTE.gold.clone() },
          uCool: { value: PALETTE.brightLeaf.clone() },
          uMix: { value: 0 },
          uOpacity: { value: 0.9 },
        },
      }),
    );

    const points = new THREE.Points(geometry, this.particleMaterial);
    points.frustumCulled = false;
    group.add(points);
  }

  // ------------------------------------------------------------------ frame

  private loop = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    if (!this.running) return;

    const time = this.clock.getElapsedTime();

    // Damping is what makes the journey feel like a camera rather than a
    // scrollbar: the view keeps moving for a beat after the wheel stops.
    this.progress += (this.targetProgress - this.progress) * 0.075;
    this.pointerSmoothed.lerp(this.pointer, 0.06);

    const p = THREE.MathUtils.clamp(this.progress, 0, 1);

    this.updateCamera(p);
    this.updateChapters(p, time);
    this.reportChapter(p);

    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(p: number) {
    const position = this.cameraCurve.getPointAt(p);
    const look = this.lookCurve.getPointAt(p);

    // On a phone the copy fills the width, so a centred subject sits behind the
    // text. Aiming below the subject lifts it into the upper third, clear of it.
    if (this.portrait) {
      look.y -= 2.6;
      position.y += 0.5;
    }

    // Parallax: the pointer nudges the camera without ever leaving the path.
    position.x += this.pointerSmoothed.x * 0.85;
    position.y += this.pointerSmoothed.y * 0.5;

    this.camera.position.copy(position);
    this.camera.lookAt(look);

    // A slow roll through the descent and the leaf interior adds disorientation
    // exactly where the journey should feel like travel rather than a slideshow.
    const roll = Math.sin(p * Math.PI * 2.2) * 0.06;
    this.camera.rotation.z += roll;

    // Pointer position in world space, one unit in front of the camera, so the
    // leaf-push and particle-repel shaders have something to react to.
    this.pointerWorld
      .set(this.pointerSmoothed.x * 4, this.pointerSmoothed.y * 3, 0)
      .applyMatrix4(this.camera.matrixWorld);
  }

  private updateChapters(p: number, time: number) {
    const band = (from: number, to: number, fade = 0.05) =>
      THREE.MathUtils.clamp(
        Math.min(
          (p - (from - fade)) / fade,
          ((to + fade) - p) / fade,
        ),
        0,
        1,
      );

    // --- seed: present at the start, dissolves as we sink into the soil
    this.seedMaterial.uniforms.uTime!.value = time;
    this.seedMaterial.uniforms.uOpacity!.value = band(0, 0.16, 0.06);
    this.seedMaterial.uniforms.uGlow!.value =
      0.25 + THREE.MathUtils.smoothstep(p, 0.02, 0.14) * 1.1;
    this.seedMaterial.uniforms.uDisplace!.value =
      0.022 + THREE.MathUtils.smoothstep(p, 0.08, 0.16) * 0.16; // it cracks open

    // --- roots
    this.rootMaterial.uniforms.uTime!.value = time;
    this.rootMaterial.uniforms.uOpacity!.value = band(0.1, 0.34, 0.06);

    // --- stem
    this.stemMaterial.uniforms.uTime!.value = time;
    this.stemMaterial.uniforms.uOpacity!.value = band(0.24, 0.68, 0.07);

    // --- canopy
    this.leafMaterial.uniforms.uTime!.value = time;
    this.leafMaterial.uniforms.uOpacity!.value = band(0.28, 0.72, 0.08);
    this.leafMaterial.uniforms.uReveal!.value = THREE.MathUtils.smoothstep(p, 0.28, 0.62);
    this.leafMaterial.uniforms.uWind!.value = 0.3 + Math.sin(time * 0.2) * 0.12;
    (this.leafMaterial.uniforms.uPointer!.value as THREE.Vector3).copy(this.pointerWorld);

    // --- flowers, then pods: blossom first, the vegetable after it
    this.flowerMaterial.uniforms.uTime!.value = time;
    this.flowerMaterial.uniforms.uReveal!.value = THREE.MathUtils.smoothstep(p, 0.36, 0.5);
    this.flowerMaterial.uniforms.uOpacity!.value = band(0.36, 0.66, 0.07);

    this.podMaterial.uniforms.uTime!.value = time;
    this.podMaterial.uniforms.uReveal!.value = THREE.MathUtils.smoothstep(p, 0.44, 0.6);
    this.podMaterial.uniforms.uOpacity!.value = band(0.43, 0.78, 0.06);
    this.podMaterial.uniforms.uWind!.value = 0.2 + Math.sin(time * 0.25) * 0.1;

    // --- cells (inside the leaf)
    this.cellMaterial.uniforms.uTime!.value = time;
    // Cleared well before the product chapter, so the payoff is not competing
    // with a screen full of green bokeh.
    this.cellMaterial.uniforms.uOpacity!.value = band(0.6, 0.82, 0.05) * 0.8;
    this.cellMaterial.uniforms.uReveal!.value = THREE.MathUtils.smoothstep(p, 0.6, 0.72);

    // --- particles: dust throughout, gathering into the product at the end
    this.particleMaterial.uniforms.uTime!.value = time;
    this.particleMaterial.uniforms.uMorph!.value = THREE.MathUtils.smoothstep(p, 0.78, 0.96);
    this.particleMaterial.uniforms.uMix!.value = THREE.MathUtils.smoothstep(p, 0.2, 0.6);
    // Particles brighten as they gather, then step back once the product
    // photograph has resolved — otherwise the final frame is a speckled bottle.
    const gather = THREE.MathUtils.smoothstep(p, 0.74, 0.9);
    const recede = THREE.MathUtils.smoothstep(p, 0.92, 1.0);
    this.particleMaterial.uniforms.uOpacity!.value =
      0.5 + gather * 0.5 - recede * 0.72;
    (this.particleMaterial.uniforms.uPointer!.value as THREE.Vector3).copy(this.pointerWorld);

    // Fog tightens underground and inside the leaf, opens up in the canopy.
    const fog = this.scene.fog as THREE.Fog;
    fog.near = THREE.MathUtils.lerp(6, 14, THREE.MathUtils.smoothstep(p, 0.2, 0.5));
    fog.far = THREE.MathUtils.lerp(26, 52, THREE.MathUtils.smoothstep(p, 0.2, 0.5));
    // The background is a three-stop ramp, not a single lerp: the journey opens
    // in near-black (the seed in the dark), warms to soil while the camera is
    // underground, then returns to black as it climbs into the canopy. An
    // earlier version ran this backwards and opened on brown.
    if (p < 0.22) {
      fog.color.lerpColors(
        PALETTE.void,
        PALETTE.soil,
        THREE.MathUtils.smoothstep(p, 0.06, 0.22),
      );
    } else {
      fog.color.lerpColors(
        PALETTE.soil,
        PALETTE.void,
        THREE.MathUtils.smoothstep(p, 0.24, 0.46),
      );
    }
    (this.leafMaterial.uniforms.uFogColor!.value as THREE.Color).copy(fog.color);
    (this.podMaterial.uniforms.uFogColor!.value as THREE.Color).copy(fog.color);
    this.renderer.setClearColor(fog.color, 1);
  }

  private reportChapter(p: number) {
    let index = 0;
    for (let i = 0; i < CHAPTER_STOPS.length - 1; i++) {
      if (p >= CHAPTER_STOPS[i]! && p < CHAPTER_STOPS[i + 1]!) {
        index = i;
        break;
      }
      if (p >= CHAPTER_STOPS[CHAPTER_STOPS.length - 1]!) index = CHAPTER_STOPS.length - 2;
    }

    const from = CHAPTER_STOPS[index]!;
    const to = CHAPTER_STOPS[index + 1]!;
    const local = THREE.MathUtils.clamp((p - from) / (to - from), 0, 1);

    if (index !== this.lastChapter) {
      this.lastChapter = index;
    }
    this.onChapter?.({ index, local, global: p });
  }

  // ------------------------------------------------------------------ api

  setProgress(value: number) {
    this.targetProgress = THREE.MathUtils.clamp(value, 0, 1);
  }

  /** Jumps without damping — used on first paint and when motion is reduced. */
  snapTo(value: number) {
    this.targetProgress = THREE.MathUtils.clamp(value, 0, 1);
    this.progress = this.targetProgress;
  }

  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
  }

  setRunning(running: boolean) {
    if (running && !this.running) this.clock.getDelta(); // avoid a time jump
    this.running = running;
  }

  onChapterChange(handler: (state: ChapterState) => void) {
    this.onChapter = handler;
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.portrait = w / h < 0.95;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // A narrow frame crops the subject horizontally; widen the lens to keep the
    // canopy readable rather than filling the screen with two leaflets.
    this.camera.fov = this.portrait ? 72 : 55;
    this.camera.updateProjectionMatrix();
    this.particleMaterial.uniforms.uPixelRatio!.value = this.renderer.getPixelRatio();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);

    for (const group of Object.values(this.groups)) {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose?.();
        }
      });
      this.scene.remove(group);
    }

    for (const item of this.disposables) item.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
