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
 * The scene's palette, in two lightings.
 *
 * `dark` is the original night journey: a seed in near-black, warming to soil
 * underground, then back to black climbing into the canopy. `light` is the same
 * journey at morning — pale mist instead of void, lit earth instead of black
 * soil, and every leaf and rim colour re-picked to sit against a bright ground
 * rather than glow out of a dark one.
 *
 * It is a second lighting setup, not an inversion. Rim colours in particular do
 * not simply flip: on black a rim reads by being brighter than its base, and on
 * mist the same trick makes an object dissolve, so the light rims are pulled
 * toward mid-tones that still separate from both the body and the background.
 *
 * Every colour the scene uses lives here, including ones that were previously
 * written inline at their material. One source of truth is the only way a
 * second lighting stays consistent as the scene changes.
 */
const PALETTES = {
  dark: {
    void: "#05070a",
    soil: "#120d08",
    deepLeaf: "#0d3a22",
    brightLeaf: "#3fae6b",
    gold: "#d9bc6a",
    cream: "#f4f1e8",
    cellCore: "#7fe0a3",
    cellEdge: "#123d26",
    seedBase: "#0b0f0d",
    seedRim: "#e6d3a3",
    shellBase: "#1a1108",
    shellRim: "#c9a86a",
    canopyBase: "#0d1a12",
    canopyRim: "#3f6b4e",
    rootBase: "#140d08",
    rootRim: "#5c4630",
    podBody: "#1e4a2a",
    podRidge: "#6fae72",
    podTip: "#8a9b55",
    petal: "#f2ead2",
    petalCentre: "#e8c86a",
  },
  light: {
    void: "#dee7e2",
    soil: "#b9a68c",
    deepLeaf: "#1f5c39",
    brightLeaf: "#4f9e69",
    gold: "#a8842a",
    cream: "#2a3a2e",
    cellCore: "#2f9a5f",
    cellEdge: "#0f3d26",
    seedBase: "#6a5f4e",
    seedRim: "#8a7444",
    shellBase: "#7a5f3c",
    shellRim: "#5c4527",
    canopyBase: "#2c5a3c",
    canopyRim: "#79ab84",
    rootBase: "#7d6a52",
    rootRim: "#4a3a28",
    podBody: "#357a4a",
    podRidge: "#1f5c39",
    podTip: "#7a8a3f",
    petal: "#ffffff",
    petalCentre: "#d9a52f",
  },
};
function buildPalette(theme) {
  const source = PALETTES[theme];
  return Object.fromEntries(
    Object.entries(source).map(([key, hex]) => [key, new THREE.Color(hex)]),
  );
}
/**
 * The camera path. Each chapter owns a stretch of the curve; the copy overlay
 * in the DOM is keyed to the same indices, so text and space never disagree.
 */
const CAMERA_POINTS = [
  [0, 0.2, 9], // 0 the void — seed ahead
  [0, 0.0, 3.4], // approach
  [0.6, -3.2, 1.2], // 1 descending into soil
  [0.2, -7.0, 0.4], // roots
  [-0.4, -2.0, 1.6], // 2 the rise begins
  [0.5, 6.0, 2.2], // climbing the stem
  [-0.3, 14.0, 2.6], // 3 into the canopy
  [0.4, 19.5, 1.4], // among leaflets
  [0.0, 22.5, 0.35], // 4 pushing into a leaf
  [0.0, 23.6, -1.8], // 5 inside — cellular
  [0.0, 24.2, -5.2], // through
  [0.0, 24.4, -9.0], // 6 out into the product
];
const LOOK_POINTS = [
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
/**
 * Chapter boundaries as a fraction of the journey.
 *
 * Four, not the original seven. The track was cut from 700svh to 240svh and
 * seven chapters across that leaves each one about 20vh of scroll — the copy
 * would change faster than it can be read. Four gives each chapter roughly
 * 35vh, and the camera path is unchanged: it is simply travelled in fewer,
 * longer stretches.
 */
export const CHAPTER_STOPS = [0, 0.3, 0.56, 0.8, 1];
export class MoringaScene {
  canvas;
  quality;
  renderer;
  scene = new THREE.Scene();
  camera;
  clock = new THREE.Clock();
  cameraCurve;
  lookCurve;
  groups = {};
  materials = [];
  disposables = [];
  leafMaterial;
  particleMaterial;
  cellMaterial;
  podMaterial;
  flowerMaterial;
  seedMaterial;
  stemMaterial;
  rootMaterial;
  frame = 0;
  running = true;
  disposed = false;
  /** Scroll progress, and the damped value actually used for rendering. */
  targetProgress = 0;
  progress = 0;
  pointer = new THREE.Vector2();
  pointerWorld = new THREE.Vector3(0, 0, -50);
  pointerSmoothed = new THREE.Vector2();
  onChapter;
  lastChapter = -1;
  /** Portrait viewports frame the subject high, above the copy. */
  portrait = false;
  /** Resolved once per instance; a theme change re-creates the scene. */
  P;
  constructor(canvas, quality, theme = "dark") {
    this.canvas = canvas;
    this.quality = quality;
    this.P = buildPalette(theme);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality === "high",
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    this.renderer.setClearColor(this.P.void, 1);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, quality === "high" ? 1.75 : 1.25),
    );
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    this.scene.fog = new THREE.Fog(this.P.void, 12, 46);
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
  counts() {
    switch (this.quality) {
      // Pod and particle counts are down sharply from the first version. At 85
      // pods the canopy read as confetti: no single pod was legible, and the
      // frame had no subject. Fewer, larger, correctly-shaped pods in bunches
      // say "drumstick tree" where a cloud of them said nothing.
      case "high":
        return {
          leaves: 1900,
          particles: 2400,
          cells: 700,
          roots: 18,
          pods: 44,
          flowers: 150,
        };
      case "medium":
        return {
          leaves: 1000,
          particles: 1200,
          cells: 340,
          roots: 12,
          pods: 30,
          flowers: 90,
        };
      default:
        return {
          leaves: 440,
          particles: 600,
          cells: 140,
          roots: 7,
          pods: 16,
          flowers: 45,
        };
    }
  }
  track(material) {
    this.materials.push(material);
    this.disposables.push(material);
    return material;
  }
  build() {
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
  group(name) {
    const group = new THREE.Group();
    this.groups[name] = group;
    return group;
  }
  buildSeed() {
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
          uBase: { value: this.P.canopyBase.clone() },
          // A rim power of 3.4 confined the highlight to the silhouette edge,
          // so the trunk read as a black cut-out against the canopy. Widening
          // it lets light wrap far enough round to show the taper as a form.
          uRim: { value: this.P.shellRim.clone() },
          uRimPower: { value: 1.7 },
          uGlow: { value: 0.12 },
          uOpacity: { value: 1 },
        },
      }),
    );
    const seed = new THREE.Mesh(geometry, this.seedMaterial);
    seed.position.set(0, 0.1, 0);
    group.add(seed);
  }
  /**
   * A tube along `curve` whose radius varies with distance along it.
   *
   * `TubeGeometry` only does constant radius, which is why both the trunk and
   * the roots originally read as wires: a living root is thick where it leaves
   * the stem and tapers to a hair. The tube is generated at a nominal radius
   * and each ring is then scaled toward the centreline.
   */
  taperedTube(curve, rings, radial, radiusAt) {
    const geometry = new THREE.TubeGeometry(curve, rings, 1, radial, false);
    const pos = geometry.attributes.position;
    const perRing = radial + 1;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.floor(i / perRing) / rings);
      const centre = curve.getPointAt(t);
      const r = radiusAt(t);
      pos.setXYZ(
        i,
        centre.x + (pos.getX(i) - centre.x) * r,
        centre.y + (pos.getY(i) - centre.y) * r,
        centre.z + (pos.getZ(i) - centre.z) * r,
      );
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    this.disposables.push(geometry);
    return geometry;
  }
  buildRoots(count) {
    const group = this.group("roots");
    this.rootMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: RIM_VERTEX,
        fragmentShader: RIM_FRAGMENT,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uDisplace: { value: 0.02 },
          // Roots were sharing the seed's gold rim at a glow of 0.4, which lit
          // them like polished metal spokes. Underground they should read as
          // wet earth catching a little light, so the rim is a muted clay and
          // the glow is most of the way off.
          uBase: { value: this.P.rootBase.clone() },
          uRim: { value: this.P.rootRim.clone() },
          uRimPower: { value: 2.4 },
          uGlow: { value: 0.06 },
          uOpacity: { value: 0 },
        },
      }),
    );
    /** One root: down and out, wandering, thick at the crown and fine at the tip. */
    const grow = (origin, angle, spread, depth, crownRadius) => {
      // Lateral drift so roots are not clean radial spokes out of one point.
      const drift = (Math.random() - 0.5) * 0.9;
      const points = [];
      const STEPS = 5;
      for (let k = 0; k <= STEPS; k++) {
        const t = k / STEPS;
        const a = angle + drift * t * t;
        // Steep at first, flattening as it runs out: the shape of a taproot
        // shedding laterals rather than a straight spoke.
        const out = Math.pow(t, 0.72) * spread;
        points.push(
          new THREE.Vector3(
            origin.x + Math.cos(a) * out + (Math.random() - 0.5) * 0.12,
            origin.y - Math.pow(t, 0.85) * depth,
            origin.z + Math.sin(a) * out + (Math.random() - 0.5) * 0.12,
          ),
        );
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = this.taperedTube(
        curve,
        30,
        6,
        (t) => crownRadius * Math.pow(1 - t, 1.6) + 0.004,
      );
      group.add(new THREE.Mesh(geometry, this.rootMaterial));
      return curve;
    };
    for (let i = 0; i < count; i++) {
      // Roots leave the crown at slightly different points, not all from one.
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const origin = new THREE.Vector3(
        Math.cos(angle) * 0.07,
        -0.15 - Math.random() * 0.2,
        Math.sin(angle) * 0.07,
      );
      const spread = 0.8 + Math.random() * 2.6;
      const depth = 2 + Math.random() * 6;
      const main = grow(origin, angle, spread, depth, 0.075 + Math.random() * 0.03);
      // Roots fork. Two in five put out a finer lateral partway down, which is
      // most of what separates a root system from a starburst.
      if (Math.random() < 0.45) {
        const at = 0.4 + Math.random() * 0.3;
        grow(
          main.getPointAt(at),
          angle + (Math.random() - 0.5) * 1.6,
          spread * 0.5,
          depth * 0.3,
          0.03,
        );
      }
    }
  }
  buildStem() {
    const group = this.group("stem");
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.3, 0),
      new THREE.Vector3(0.15, 5, -0.1),
      new THREE.Vector3(-0.1, 11, 0.15),
      new THREE.Vector3(0.08, 17, -0.05),
      new THREE.Vector3(0, 23, 0),
    ]);
    // Moringa is soft-wooded and swells noticeably at the base, so the taper is
    // strong — roughly six to one from bottom to top. Without it the trunk was a
    // constant 0.075 from soil to canopy: a 23-unit wire of uniform width, which
    // read as a drawn line rather than as a tree.
    const geometry = this.taperedTube(curve, 140, 10, (t) => {
      const radius = 0.42 * Math.pow(1 - t, 1.45) + 0.055;
      // Bark is not a lathe finish.
      return radius * (1 + Math.sin(t * 46) * 0.05);
    });
    this.stemMaterial = this.track(
      new THREE.ShaderMaterial({
        vertexShader: RIM_VERTEX,
        fragmentShader: RIM_FRAGMENT,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uDisplace: { value: 0.012 },
          uBase: { value: this.P.canopyBase.clone() },
          // Dim: a bright stem runs straight down the middle of every canopy
          // frame and splits the composition in two.
          uRim: { value: this.P.canopyRim.clone() },
          uRimPower: { value: 3.2 },
          uGlow: { value: 0.12 },
          uOpacity: { value: 0 },
        },
      }),
    );
    group.add(new THREE.Mesh(geometry, this.stemMaterial));
  }
  buildCanopy(count) {
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
    geometry.setAttribute(
      "aRotation",
      new THREE.InstancedBufferAttribute(rotations, 3),
    );
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
          uDeep: { value: this.P.deepLeaf.clone() },
          uBright: { value: this.P.brightLeaf.clone() },
          uGold: { value: this.P.gold.clone() },
          uFogNear: { value: 4 },
          uFogFar: { value: 22 },
          uFogColor: { value: this.P.void.clone() },
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
  /**
   * The profile of a drumstick pod, as a unit tube hanging from y=0 to y=-1.
   *
   * The previous version was a plain cone, wider at the free end than at the
   * shoulder, which is precisely backwards and is why it read as a carrot. A
   * real *Moringa oleifera* pod is close to uniform for most of its length,
   * swells slightly just below the shoulder, and comes to a long point at the
   * free tip. It is also not round: three prominent longitudinal ridges run the
   * whole way down, which is what makes a drumstick recognisable in silhouette.
   *
   * Both are done here on the CPU, once, rather than in the vertex shader,
   * because the geometry is instanced — every pod shares this one buffer, so
   * the cost is paid a single time for all of them.
   */
  podProfile(radialSegments, heightSegments) {
    const geometry = new THREE.CylinderGeometry(
      1,
      1,
      1,
      radialSegments,
      heightSegments,
      true,
    );
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // v: 0 at the shoulder, 1 at the free tip.
      const v = 0.5 - y;
      // Thickness along the pod. Narrow where it joins the branch, full by a
      // sixth of the way down, held there, then drawn out to a point.
      let r;
      if (v < 0.16) r = 0.72 + (v / 0.16) * 0.28;
      else if (v < 0.78) r = 1;
      else r = Math.pow(1 - (v - 0.78) / 0.22, 0.75);
      // Three ridges, easing off at the very tip where the pod rounds out.
      const angle = Math.atan2(z, x);
      const ribs = 1 + 0.2 * Math.cos(3 * angle) * Math.min(1, (1 - v) * 4);
      const scale = r * ribs;
      pos.setX(i, x * scale);
      pos.setZ(i, z * scale);
    }
    pos.needsUpdate = true;
    // The ridges only catch light if the normals know about them.
    geometry.computeVertexNormals();
    // Hang from the shoulder rather than pivot about the middle.
    geometry.translate(0, -0.5, 0);
    return geometry;
  }
  buildPods(count) {
    const group = this.group("pods");
    // Enough radial segments for the three ridges to survive as a silhouette;
    // at 7 they were averaged into a smooth cone.
    const base = this.podProfile(14, 10);
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
    // Pods hang in bunches from the same node, never evenly scattered. Walking
    // the count in small clusters is what stops the canopy reading as confetti.
    let i = 0;
    while (i < count) {
      const clusterSize = Math.min(count - i, 2 + Math.floor(Math.random() * 3));
      const angle = Math.random() * Math.PI * 2;
      // Held close to the trunk and to the height band the camera climbs
      // through (roughly y=14 to y=22). Spread over the old 8-to-21 range at
      // a 5-unit radius, the pods were nowhere near the lens on the one
      // chapter that is actually about them.
      const radius = 1.5 + Math.pow(Math.random(), 0.6) * 2.8;
      const height = 12.5 + Math.pow(Math.random(), 0.85) * 8.5;
      const nodeX = Math.cos(angle) * radius;
      const nodeZ = Math.sin(angle) * radius;
      for (let k = 0; k < clusterSize; k++, i++) {
        offsets[i * 3] = nodeX + (Math.random() - 0.5) * 0.5;
        offsets[i * 3 + 1] = height + (Math.random() - 0.5) * 0.4;
        offsets[i * 3 + 2] = nodeZ + (Math.random() - 0.5) * 0.5;
        // A drumstick is 25-50cm long and about 1.5cm across: roughly 25:1.
        // The old values gave 11:1, which is a courgette.
        lengths[i] = 3.4 + Math.random() * 2.2;
        // ~25:1 length to width, which is what a drumstick actually is, and
        // just thick enough to hold its ridges at canopy distance.
        girths[i] = 0.075 + Math.random() * 0.03;
        phases[i] = Math.random() * Math.PI * 2;
        // Gravity does most of the work; they hang close to vertical.
        tilts[i] = (Math.random() - 0.5) * 0.16;
      }
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
          uBody: { value: this.P.podBody.clone() },
          uRidge: { value: this.P.podRidge.clone() },
          uTip: { value: this.P.podTip.clone() },
          uFogNear: { value: 6 },
          uFogFar: { value: 26 },
          uFogColor: { value: this.P.void.clone() },
          uOpacity: { value: 0 },
        },
      }),
    );
    const mesh = new THREE.Mesh(geometry, this.podMaterial);
    mesh.frustumCulled = false;
    group.add(mesh);
  }
  /** Cream blossom — eaten too, and the only warm note in the canopy. */
  buildFlowers(count) {
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
          uPetal: { value: this.P.petal.clone() },
          uCentre: { value: this.P.petalCentre.clone() },
          uOpacity: { value: 0 },
        },
      }),
    );
    const points = new THREE.Points(geometry, this.flowerMaterial);
    points.frustumCulled = false;
    group.add(points);
  }
  buildCells(count) {
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
          uCore: { value: this.P.cellCore.clone() },
          uEdge: { value: this.P.cellEdge.clone() },
          uOpacity: { value: 0 },
        },
      }),
    );
    const mesh = new THREE.Mesh(geometry, this.cellMaterial);
    mesh.frustumCulled = false;
    group.add(mesh);
  }
  buildParticles(count) {
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
      const h = Math.random(); // 0 = base, 1 = top
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
          uWarm: { value: this.P.gold.clone() },
          uCool: { value: this.P.brightLeaf.clone() },
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
  loop = () => {
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
  updateCamera(p) {
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
  updateChapters(p, time) {
    const band = (from, to, fade = 0.05) =>
      THREE.MathUtils.clamp(
        Math.min((p - (from - fade)) / fade, (to + fade - p) / fade),
        0,
        1,
      );
    // --- seed: present at the start, dissolves as we sink into the soil
    this.seedMaterial.uniforms.uTime.value = time;
    this.seedMaterial.uniforms.uOpacity.value = band(0, 0.16, 0.06);
    this.seedMaterial.uniforms.uGlow.value =
      0.25 + THREE.MathUtils.smoothstep(p, 0.02, 0.14) * 1.1;
    this.seedMaterial.uniforms.uDisplace.value =
      0.022 + THREE.MathUtils.smoothstep(p, 0.08, 0.16) * 0.16; // it cracks open
    // --- roots
    this.rootMaterial.uniforms.uTime.value = time;
    this.rootMaterial.uniforms.uOpacity.value = band(0.1, 0.34, 0.06);
    // --- stem
    this.stemMaterial.uniforms.uTime.value = time;
    this.stemMaterial.uniforms.uOpacity.value = band(0.24, 0.68, 0.07);
    // --- canopy
    this.leafMaterial.uniforms.uTime.value = time;
    this.leafMaterial.uniforms.uOpacity.value = band(0.28, 0.72, 0.08);
    this.leafMaterial.uniforms.uReveal.value = THREE.MathUtils.smoothstep(
      p,
      0.28,
      0.62,
    );
    this.leafMaterial.uniforms.uWind.value = 0.3 + Math.sin(time * 0.2) * 0.12;
    this.leafMaterial.uniforms.uPointer.value.copy(this.pointerWorld);
    // --- flowers, then pods: blossom first, the vegetable after it
    this.flowerMaterial.uniforms.uTime.value = time;
    this.flowerMaterial.uniforms.uReveal.value = THREE.MathUtils.smoothstep(
      p,
      0.36,
      0.5,
    );
    this.flowerMaterial.uniforms.uOpacity.value = band(0.36, 0.66, 0.07);
    this.podMaterial.uniforms.uTime.value = time;
    this.podMaterial.uniforms.uReveal.value = THREE.MathUtils.smoothstep(p, 0.44, 0.6);
    this.podMaterial.uniforms.uOpacity.value = band(0.43, 0.78, 0.06);
    this.podMaterial.uniforms.uWind.value = 0.2 + Math.sin(time * 0.25) * 0.1;
    // --- cells (inside the leaf)
    this.cellMaterial.uniforms.uTime.value = time;
    // Cleared well before the product chapter, so the payoff is not competing
    // with a screen full of green bokeh.
    this.cellMaterial.uniforms.uOpacity.value = band(0.6, 0.82, 0.05) * 0.8;
    this.cellMaterial.uniforms.uReveal.value = THREE.MathUtils.smoothstep(p, 0.6, 0.72);
    // --- particles: dust throughout, gathering into the product at the end
    this.particleMaterial.uniforms.uTime.value = time;
    this.particleMaterial.uniforms.uMorph.value = THREE.MathUtils.smoothstep(
      p,
      0.78,
      0.96,
    );
    this.particleMaterial.uniforms.uMix.value = THREE.MathUtils.smoothstep(p, 0.2, 0.6);
    // Particles brighten as they gather, then step back once the product
    // photograph has resolved — otherwise the final frame is a speckled bottle.
    const gather = THREE.MathUtils.smoothstep(p, 0.74, 0.9);
    const recede = THREE.MathUtils.smoothstep(p, 0.92, 1.0);
    this.particleMaterial.uniforms.uOpacity.value = 0.5 + gather * 0.5 - recede * 0.72;
    this.particleMaterial.uniforms.uPointer.value.copy(this.pointerWorld);
    // Fog tightens underground and inside the leaf, opens up in the canopy.
    const fog = this.scene.fog;
    fog.near = THREE.MathUtils.lerp(6, 14, THREE.MathUtils.smoothstep(p, 0.2, 0.5));
    fog.far = THREE.MathUtils.lerp(26, 52, THREE.MathUtils.smoothstep(p, 0.2, 0.5));
    // The background is a three-stop ramp, not a single lerp: the journey opens
    // in near-black (the seed in the dark), warms to soil while the camera is
    // underground, then returns to black as it climbs into the canopy. An
    // earlier version ran this backwards and opened on brown.
    if (p < 0.22) {
      fog.color.lerpColors(
        this.P.void,
        this.P.soil,
        THREE.MathUtils.smoothstep(p, 0.06, 0.22),
      );
    } else {
      fog.color.lerpColors(
        this.P.soil,
        this.P.void,
        THREE.MathUtils.smoothstep(p, 0.24, 0.46),
      );
    }
    this.leafMaterial.uniforms.uFogColor.value.copy(fog.color);
    this.podMaterial.uniforms.uFogColor.value.copy(fog.color);
    this.renderer.setClearColor(fog.color, 1);
  }
  reportChapter(p) {
    let index = 0;
    for (let i = 0; i < CHAPTER_STOPS.length - 1; i++) {
      if (p >= CHAPTER_STOPS[i] && p < CHAPTER_STOPS[i + 1]) {
        index = i;
        break;
      }
      if (p >= CHAPTER_STOPS[CHAPTER_STOPS.length - 1])
        index = CHAPTER_STOPS.length - 2;
    }
    const from = CHAPTER_STOPS[index];
    const to = CHAPTER_STOPS[index + 1];
    const local = THREE.MathUtils.clamp((p - from) / (to - from), 0, 1);
    if (index !== this.lastChapter) {
      this.lastChapter = index;
    }
    this.onChapter?.({ index, local, global: p });
  }
  // ------------------------------------------------------------------ api
  setProgress(value) {
    this.targetProgress = THREE.MathUtils.clamp(value, 0, 1);
  }
  /** Jumps without damping — used on first paint and when motion is reduced. */
  snapTo(value) {
    this.targetProgress = THREE.MathUtils.clamp(value, 0, 1);
    this.progress = this.targetProgress;
  }
  setPointer(x, y) {
    this.pointer.set(x, y);
  }
  setRunning(running) {
    if (running && !this.running) this.clock.getDelta(); // avoid a time jump
    this.running = running;
  }
  onChapterChange(handler) {
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
    this.particleMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
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
