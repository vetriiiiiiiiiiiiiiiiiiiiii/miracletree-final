/**
 * GLSL for the Moringa World.
 *
 * Everything here is hand-written rather than pulled from a material library,
 * because the look depends on three specific cheats:
 *
 *  1. Leaves fake subsurface scattering with a back-light term instead of real
 *     transmission — one dot product rather than a second render pass.
 *  2. Wind is a vertex displacement driven by cheap curl-ish noise, so tens of
 *     thousands of leaflets move without a single CPU-side update.
 *  3. Depth is sold with fog and rim light, not a depth-of-field pass, which
 *     keeps the whole scene to one draw per object and no postprocessing on
 *     mobile.
 */

/** Classic 3D simplex noise (Ashima). Shared by every shader below. */
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

// ---------------------------------------------------------------- leaves

/**
 * Instanced moringa leaflets.
 *
 * Each instance carries its own phase and scale so the canopy never pulses in
 * unison. `uReveal` runs 0→1 to grow the canopy as the camera climbs, and the
 * leaflet scales from its stem end rather than its centre so it unfurls.
 */
export const LEAF_VERTEX = /* glsl */ `
${NOISE}

attribute vec3 aOffset;
attribute vec3 aRotation;
attribute float aScale;
attribute float aPhase;
attribute float aHeight;

uniform float uTime;
uniform float uReveal;
uniform float uWind;
uniform vec3 uPointer;

varying vec2 vUv;
varying float vBack;
varying float vDepth;
varying float vPhase;

mat3 rotate(vec3 r){
  vec3 s = sin(r), c = cos(r);
  mat3 rx = mat3(1.0,0.0,0.0, 0.0,c.x,-s.x, 0.0,s.x,c.x);
  mat3 ry = mat3(c.y,0.0,s.y, 0.0,1.0,0.0, -s.y,0.0,c.y);
  mat3 rz = mat3(c.z,-s.z,0.0, s.z,c.z,0.0, 0.0,0.0,1.0);
  return rz * ry * rx;
}

void main(){
  vUv = uv;
  vPhase = aPhase;

  // Leaflets appear in height order, so the canopy grows upward with the camera.
  float appear = smoothstep(aHeight - 0.12, aHeight + 0.06, uReveal);
  float scale = aScale * appear;

  // Unfurl from the stem end (uv.y == 0), not from the middle.
  vec3 pos = position;
  pos.y *= mix(0.15, 1.0, appear);
  pos *= scale;

  vec3 world = rotate(aRotation) * pos + aOffset;

  // Wind: two octaves, the second finer and faster, so it reads as air rather
  // than a sine wave.
  float t = uTime * 0.35;
  float n1 = snoise(vec3(aOffset.xz * 0.18, t) ) * 0.55;
  float n2 = snoise(vec3(aOffset.xz * 0.60, t * 1.7)) * 0.20;
  float sway = (n1 + n2) * uWind * (0.35 + uv.y * 0.9);
  world.x += sway;
  world.z += sway * 0.6;
  world.y += sway * 0.15;

  // The pointer pushes leaflets aside — the cursor feels like it has presence.
  vec3 toPointer = world - uPointer;
  float d = length(toPointer.xy);
  float push = smoothstep(3.2, 0.0, d) * 0.9;
  world += normalize(vec3(toPointer.xy, 0.35)) * push;

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  vDepth = -mv.z;

  // Cheap back-light term: leaflets facing away from the key light glow.
  vec3 n = normalize(normalMatrix * (rotate(aRotation) * normal));
  vBack = pow(clamp(dot(n, normalize(vec3(0.2, -0.7, -1.0))), 0.0, 1.0), 1.6);

  gl_Position = projectionMatrix * mv;
}
`;

export const LEAF_FRAGMENT = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uBright;
uniform vec3 uGold;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;
uniform float uOpacity;

varying vec2 vUv;
varying float vBack;
varying float vDepth;
varying float vPhase;

void main(){
  vec2 p = vUv * 2.0 - 1.0;

  // A leaflet, not an ellipse: the width tapers toward both ends, which is what
  // separates a leaf silhouette from a rounded rectangle at small sizes.
  float taper = 1.0 - pow(abs(p.y), 1.7);
  float halfWidth = 0.86 * taper;
  if (abs(p.x) > halfWidth || abs(p.y) > 1.0) discard;

  // Distance to the edge, for the rim and the soft alpha.
  float edgeDist = 1.0 - abs(p.x) / max(halfWidth, 0.001);

  // Midrib, thinning toward the tip.
  float rib = smoothstep(0.09 * taper, 0.0, abs(p.x));

  // Per-instance tone: without this every leaflet is the same green and the
  // canopy flattens into a single mass.
  float tone = 0.32 + 0.34 * sin(vPhase * 2.3) + vUv.y * 0.26;

  vec3 color = mix(uDeep, uBright, clamp(tone, 0.0, 1.0));
  color = mix(color, uBright * 1.35, vBack * 0.8);        // translucency
  color = mix(color, uGold * 0.9, rib * 0.22 * vBack);    // sunlit vein
  color += uGold * pow(1.0 - edgeDist, 4.0) * 0.09;       // rim

  // Darken with depth before fog, so nearby leaves read brighter than far ones
  // even where the fog has not taken hold yet.
  float near = smoothstep(uFogFar, uFogNear, vDepth);
  color *= mix(0.35, 1.0, near);

  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  color = mix(color, uFogColor, fog);

  float alpha = smoothstep(0.0, 0.16, edgeDist) * uOpacity * (1.0 - fog * 0.92);
  gl_FragColor = vec4(color, alpha);
}
`;

// ---------------------------------------------------------------- particles

/**
 * Pollen, dust and — in the final chapter — the particles that reassemble into
 * the product. One buffer, two target positions, mixed by `uMorph`.
 */
export const PARTICLE_VERTEX = /* glsl */ `
${NOISE}

attribute vec3 aTarget;
attribute float aScale;
attribute float aPhase;

uniform float uTime;
uniform float uMorph;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uPointer;

varying float vAlpha;
varying float vPhase;

void main(){
  vec3 drift = vec3(
    snoise(vec3(position.yz * 0.25, uTime * 0.10)),
    snoise(vec3(position.xz * 0.25, uTime * 0.13 + 12.0)),
    snoise(vec3(position.xy * 0.25, uTime * 0.09 + 31.0))
  ) * 0.9;

  // Drift belongs to the free-floating state; it fades out as particles snap
  // into the product silhouette.
  vec3 base = position + drift * (1.0 - uMorph);
  vec3 pos = mix(base, aTarget, smoothstep(0.0, 1.0, uMorph));

  vec3 away = pos - uPointer;
  pos += normalize(away + 0.001) * smoothstep(2.6, 0.0, length(away)) * 0.5 * (1.0 - uMorph);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * uPixelRatio / max(-mv.z, 0.1);

  vAlpha = smoothstep(60.0, 6.0, -mv.z);
  vPhase = aPhase;
}
`;

export const PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uWarm;
uniform vec3 uCool;
uniform float uMix;
uniform float uOpacity;

varying float vAlpha;
varying float vPhase;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float falloff = smoothstep(0.5, 0.0, d);

  vec3 color = mix(uWarm, uCool, clamp(uMix + sin(vPhase) * 0.25, 0.0, 1.0));
  gl_FragColor = vec4(color, falloff * falloff * vAlpha * uOpacity);
}
`;

// ---------------------------------------------------------------- seed / stem

/**
 * Used for the seed coat and the stem. A dark body lit almost entirely by a
 * gold rim, which is what keeps it readable against a near-black background.
 */
export const RIM_VERTEX = /* glsl */ `
${NOISE}

uniform float uTime;
uniform float uDisplace;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

void main(){
  vNoise = snoise(position * 2.4 + uTime * 0.05);
  vec3 pos = position + normal * vNoise * uDisplace;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const RIM_FRAGMENT = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uRim;
uniform float uRimPower;
uniform float uGlow;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

void main(){
  float fresnel = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), uRimPower);
  vec3 color = uBase + uRim * fresnel * (1.0 + uGlow);
  color += uRim * max(vNoise, 0.0) * 0.10 * uGlow;
  gl_FragColor = vec4(color, uOpacity);
}
`;

// ---------------------------------------------------------------- cells

/** The interior of the leaf: glowing chloroplasts drifting in cytoplasm. */
export const CELL_VERTEX = /* glsl */ `
${NOISE}

attribute vec3 aOffset;
attribute float aScale;
attribute float aPhase;

uniform float uTime;
uniform float uReveal;

varying float vGlow;
varying vec3 vNormal;
varying vec3 vView;

void main(){
  float pulse = 0.85 + sin(uTime * 0.9 + aPhase) * 0.15;
  vec3 wobble = vec3(
    snoise(vec3(aOffset.yz * 0.4, uTime * 0.15)),
    snoise(vec3(aOffset.xz * 0.4, uTime * 0.17)),
    snoise(vec3(aOffset.xy * 0.4, uTime * 0.13))
  ) * 0.35;

  vec3 world = position * aScale * pulse * uReveal + aOffset + wobble;
  vec4 mv = modelViewMatrix * vec4(world, 1.0);

  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vGlow = pulse;

  gl_Position = projectionMatrix * mv;
}
`;

export const CELL_FRAGMENT = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uEdge;
uniform float uOpacity;

varying float vGlow;
varying vec3 vNormal;
varying vec3 vView;

void main(){
  float fresnel = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), 2.0);
  vec3 color = mix(uCore, uEdge, fresnel) * vGlow;
  gl_FragColor = vec4(color, (0.35 + fresnel * 0.65) * uOpacity);
}
`;

// ---------------------------------------------------------------- pods

/**
 * Drumstick pods — the moringa vegetable.
 *
 * The pod is what gives the tree its common name, and it is the part most
 * people in South India actually cook with, so the canopy is wrong without it.
 * Each pod is an instanced tapered cylinder; the three longitudinal ridges that
 * make a drumstick recognisable are shaded from the circumferential UV rather
 * than modelled, which keeps the whole crop to one draw call.
 */
export const POD_VERTEX = /* glsl */ `
${NOISE}

attribute vec3 aOffset;
attribute float aLength;
attribute float aGirth;
attribute float aPhase;
attribute float aTilt;

uniform float uTime;
uniform float uReveal;
uniform float uWind;

varying vec2 vUv;
varying float vDepth;
varying float vAlong;
varying vec3 vNormal;
varying vec3 vView;

void main(){
  vUv = uv;
  vAlong = uv.y;

  // Pods lengthen as they ripen rather than fading in at full size.
  float grow = smoothstep(0.0, 1.0, uReveal);

  vec3 pos = position;
  pos.y *= aLength * grow;
  pos.xz *= aGirth;

  // Hang from the branch: tilt slightly off vertical, then let the free end
  // swing further than the attached end.
  float swingPhase = uTime * 0.5 + aPhase;
  float breeze = snoise(vec3(aOffset.xz * 0.2, uTime * 0.22)) * uWind;
  float swing = (sin(swingPhase) * 0.04 + breeze * 0.22) * (1.0 - uv.y);

  float tilt = aTilt + swing;
  mat3 lean = mat3(
    cos(tilt), -sin(tilt), 0.0,
    sin(tilt),  cos(tilt), 0.0,
    0.0, 0.0, 1.0
  );

  vec3 world = lean * pos + aOffset;

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  vDepth = -mv.z;
  vNormal = normalize(normalMatrix * (lean * normal));
  vView = normalize(-mv.xyz);

  gl_Position = projectionMatrix * mv;
}
`;

export const POD_FRAGMENT = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uRidge;
uniform vec3 uTip;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;
uniform float uOpacity;

varying vec2 vUv;
varying float vDepth;
varying float vAlong;
varying vec3 vNormal;
varying vec3 vView;

void main(){
  // Three ridges around the circumference — the detail that reads as
  // "drumstick" rather than "green stick".
  float ridge = abs(sin(vUv.x * 3.14159 * 3.0));
  ridge = pow(ridge, 2.4);

  vec3 color = mix(uBody, uRidge, ridge * 0.55);

  // The tip dries paler than the shoulder.
  color = mix(color, uTip, smoothstep(0.72, 1.0, vAlong) * 0.4);

  float fresnel = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), 2.2);
  color += uRidge * fresnel * 0.35;

  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  color = mix(color, uFogColor, fog);

  gl_FragColor = vec4(color, uOpacity * (1.0 - fog * 0.9));
}
`;

// ---------------------------------------------------------------- flowers

/**
 * Moringa flowers, which are also cooked as a vegetable in Tamil Nadu. Cheap
 * additive blobs: at canopy distance a cluster of cream blossom reads as a
 * highlight, and modelling petals would cost far more than it shows.
 */
export const FLOWER_VERTEX = /* glsl */ `
${NOISE}

attribute vec3 aOffset;
attribute float aScale;
attribute float aPhase;

uniform float uTime;
uniform float uReveal;
uniform float uSize;
uniform float uPixelRatio;

varying float vAlpha;

void main(){
  vec3 sway = vec3(
    snoise(vec3(aOffset.xz * 0.3, uTime * 0.25)),
    0.0,
    snoise(vec3(aOffset.xy * 0.3, uTime * 0.21))
  ) * 0.25;

  vec4 mv = modelViewMatrix * vec4(aOffset + sway, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * uReveal * uPixelRatio / max(-mv.z, 0.1);

  vAlpha = uReveal * (0.55 + sin(uTime * 0.8 + aPhase) * 0.15);
}
`;

export const FLOWER_FRAGMENT = /* glsl */ `
uniform vec3 uPetal;
uniform vec3 uCentre;
uniform float uOpacity;

varying float vAlpha;

void main(){
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;

  // Four soft lobes, so a blossom is not just a dot.
  float lobes = 0.55 + 0.45 * abs(cos(atan(p.y, p.x) * 2.0));
  float mask = smoothstep(0.5 * lobes, 0.0, d);

  vec3 color = mix(uPetal, uCentre, smoothstep(0.28, 0.0, d));
  gl_FragColor = vec4(color, mask * vAlpha * uOpacity);
}
`;
