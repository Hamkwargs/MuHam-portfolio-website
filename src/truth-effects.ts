/**
 * Truth Vision
 *
 * - Circular GPU grayscale reveal
 * - 100% grayscale inside the circle
 * - Original color outside the circle
 * - 1.5-second expanding / shrinking animation
 * - Neon tubes that flicker on after the reveal
 *   (and flicker off when Truth Vision closes)
 */

import * as THREE from 'three';

import { camera, scene } from './core';
import { interactiveObjects } from './interactables';
import { S } from './state';
import { updateTruthShader } from './postprocessing';

// ========================================
// QUIET TARGETS
// ========================================

export const isQuietTarget = (obj: any) => {
  const info = obj?.userData?.info;

  const type = String(
    info?.type ?? ''
  ).toLowerCase();

  return (
    [
      'coffee',
      'door',
      'contact',
      'window',
    ].includes(type) ||
    /^(coffee|door|contact|window)(\s|$)/i.test(
      String(info?.title ?? '')
    )
  );
};

// ========================================
// DOM ELEMENTS
// ========================================

const root = document.createElement('div');

root.id = 'truth-fx';

root.innerHTML = `
  <div class="truth-newsprint"></div>
  <div class="truth-wave"></div>
  <div class="truth-targets"></div>
  <div class="truth-tv">
    <div class="truth-static"></div>
    <div class="truth-iris"></div>
    <div class="truth-card">
      <small>★ SPECIAL BROADCAST ★</small>
      <strong></strong>
      <span>CASE FILE / NOW LOADING</span>
    </div>
  </div>
`;

document.body.appendChild(root);

const wave = root.querySelector<HTMLElement>(
  '.truth-wave'
)!;

const holder = root.querySelector<HTMLElement>(
  '.truth-targets'
)!;

const tv = root.querySelector<HTMLElement>(
  '.truth-tv'
)!;

const title = root.querySelector<HTMLElement>(
  '.truth-card strong'
)!;

// ========================================
// COLOR OVERLAY RENDERER
// ========================================

const colorRenderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: false,
  powerPreference: 'high-performance',
});

colorRenderer.setClearColor(0x000000, 0);

colorRenderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 0.85)
);

colorRenderer.domElement.id = 'truth-color-canvas';

colorRenderer.domElement.setAttribute(
  'aria-hidden',
  'true'
);

colorRenderer.domElement.style.display = 'none';

document.body.appendChild(colorRenderer.domElement);

const colorCamera = camera.clone();

colorCamera.layers.set(1);

let canvasW = 0;
let canvasH = 0;

function resizeColorCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (w === canvasW && h === canvasH) {
    return;
  }

  canvasW = w;
  canvasH = h;

  colorRenderer.setSize(w, h, false);
}

let overlayLightsReady = false;

function enableOverlayLights() {
  if (overlayLightsReady) return;

  scene.traverse((obj: any) => {
    if (obj.isLight) {
      obj.layers.enable(1);
    }
  });

  overlayLightsReady = true;
}

// ========================================
// STATE
// ========================================

let active = false;
let transitioning = false;

let radius = 0;
let radiusFrom = 0;
let radiusTo = 0;

let animationStart = 0;
let animationToken = 0;

const DURATION = 1500;

let centerX = window.innerWidth / 2;
let centerY = window.innerHeight / 2;

function maxRadius() {
  const maxX = Math.max(
    centerX,
    window.innerWidth - centerX
  );

  const maxY = Math.max(
    centerY,
    window.innerHeight - centerY
  );

  return Math.hypot(maxX, maxY) + 30;
}

// ========================================
// EASING
// ========================================

/**
 * Smooth at both ends.
 *
 * Unlike cubic ease-out, this does not
 * rush through most of the screen
 * immediately after the click.
 */
function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// ========================================
// CIRCULAR REVEAL
// ========================================

function applyRadius(value: number) {
  radius = Math.max(0, value);

  root.style.setProperty(
    '--truth-radius',
    `${radius}px`
  );

  // The visual ring and the shader
  // share the same radius.
  const diameter = radius * 2;

  wave.style.width = `${diameter}px`;
  wave.style.height = `${diameter}px`;

  wave.style.opacity =
    radius > 2 &&
    radius < maxRadius() - 12
      ? '1'
      : '0';
}

function startRadiusAnimation() {
  const token = ++animationToken;

  animationStart = performance.now();

  const run = (now: number) => {
    if (token !== animationToken) return;

    const elapsed = now - animationStart;

    const t = Math.min(
      1,
      elapsed / DURATION
    );

    const progress = easeInOutSine(t);

    const nextRadius =
      radiusFrom +
      (radiusTo - radiusFrom) * progress;

    applyRadius(nextRadius);

    if (t < 1) {
      requestAnimationFrame(run);
      return;
    }

    // Finish at the exact target radius.
    applyRadius(radiusTo);

    // Neon lights switch on only after
    // the grayscale reveal is complete.
    syncTargetColors();
  };

  requestAnimationFrame(run);
}

// ========================================
// PUBLIC API
// ========================================

export function setTruthVision(on: boolean) {
  active = on;

  const btn = document.getElementById(
    'vision-btn'
  );

  const rect = btn?.getBoundingClientRect();

  centerX = rect
    ? rect.left + rect.width / 2
    : window.innerWidth / 2;

  centerY = rect
    ? rect.top + rect.height / 2
    : window.innerHeight / 2;

  root.style.setProperty(
    '--eye-x',
    `${centerX}px`
  );

  root.style.setProperty(
    '--eye-y',
    `${centerY}px`
  );

  radiusFrom = radius;

  radiusTo = on ? maxRadius() : 0;

  root.classList.toggle('enabled', on);

  // Update shader immediately to prevent
  // a stale center or radius.
  updateTruthShader(
    centerX,
    centerY,
    radius
  );

  startRadiusAnimation();

  if (on) {
    // Do the heavy setup (clone materials, compile
    // shaders) DURING the 1.5s reveal, not at the
    // moment the neon turns on. Delayed slightly so
    // the click frame itself stays smooth.
    window.setTimeout(() => {
      registerTargets();
      prewarmOverlay();
    }, 80);
  } else {
    // Turning off: neon starts flickering out
    // right away while the circle shrinks.
    syncTargetColors();
  }
}

export function setTruthHover(_obj: any) {
  // Existing hover interaction remains
  // managed by main.ts.
}

// ========================================
// NEON TUBES (flicker on / flicker off)
// ========================================

/**
 * How it works:
 *
 * - The real mesh keeps its ORIGINAL material in the
 *   main scene, so the grayscale shader shows the
 *   object in plain gray (no original color flash).
 * - A cloned neon material is used ONLY while drawing
 *   the color overlay (swapped in inside
 *   renderTruthColorObjects).
 * - The neon "level" (0..1) is the overlay opacity /
 *   glow, driven by a keyframe timeline.
 *
 * Performance notes:
 *
 * - Neon materials are cloned once and cached forever
 *   (never disposed), so shaders are never recompiled.
 * - Cloning + shader compile happen during the reveal.
 * - The overlay renders nothing at all unless at least
 *   one neon mesh is currently lit / flickering.
 */

type Key = [number, number]; // [time (s), level 0..1]

type NeonState = {
  material: any;
  original: any;
  baseOpacity: number;

  level: number; // current neon brightness
  dir: 'on' | 'off'; // direction currently running / finished
  done: boolean; // timeline finished
  lit: boolean; // included in the overlay pass

  keys: Key[];
  t: number;
  wait: number;
  delay: number;
};

// Persistent cache: mesh -> state
const states = new Map<any, NeonState>();

// Meshes currently drawn by the overlay
const litMeshes = new Set<any>();

const vivid = [
  0xff256a,
  0x00dce8,
  0xffd12f,
  0xa65bff,
  0x66fa91,
];

const NEON_INTENSITY = 0.32; // emissive strength at full level
const STAGGER_ON = 0.6; // random delay before each object lights up (s)
const STAGGER_OFF = 0.25; // random delay before each object goes dark (s)

let neonWanted = false;
let neonAnimating = false;
let prewarmed = false;

const rand = (a: number, b: number) =>
  a + Math.random() * (b - a);

/**
 * Light-up timeline: dark -> 1-2 sputtering
 * flashes -> warm-up -> steady.
 */
function buildOnKeys(from: number): Key[] {
  const keys: Key[] = [[0, from]];

  let t = 0;

  const flickers = Math.random() < 0.5 ? 1 : 2;

  for (let i = 0; i < flickers; i++) {
    // dark gap
    t += rand(0.08, 0.22);
    keys.push([t, Math.min(from, 0.05)]);

    // quick flash
    t += rand(0.02, 0.04);
    keys.push([t, rand(0.55, 1)]);

    // hold flash briefly
    t += rand(0.04, 0.09);
    keys.push([t, rand(0.4, 0.9)]);

    // sputter back out
    t += rand(0.03, 0.05);
    keys.push([t, rand(0, 0.12)]);
  }

  // final strike: dark gap, bright pop, tiny dip, warm-up
  t += rand(0.1, 0.2);
  keys.push([t, 0.04]);

  t += 0.04;
  keys.push([t, 0.9]);

  t += 0.06;
  keys.push([t, 0.55]);

  t += rand(0.2, 0.32);
  keys.push([t, 1]);

  return keys;
}

/**
 * Switch-off timeline: steady -> 1-2 stutters
 * -> dies out.
 */
function buildOffKeys(from: number): Key[] {
  const keys: Key[] = [[0, from]];

  let t = 0;

  const flickers = Math.random() < 0.5 ? 1 : 2;

  for (let i = 0; i < flickers; i++) {
    // stay lit for a moment
    t += rand(0.06, 0.16);
    keys.push([t, from]);

    // stutter dark
    t += rand(0.025, 0.04);
    keys.push([t, rand(0, 0.2)]);

    // hold dark
    t += rand(0.04, 0.08);
    keys.push([t, rand(0, 0.1)]);

    // flicker back on
    t += rand(0.025, 0.04);
    keys.push([t, from * rand(0.6, 1)]);
  }

  // final fade: quick dim, last gasp, off
  t += rand(0.05, 0.1);
  keys.push([t, from * 0.45]);

  t += 0.05;
  keys.push([t, from * 0.7]);

  t += rand(0.08, 0.14);
  keys.push([t, 0]);

  return keys;
}

function sampleKeys(keys: Key[], t: number) {
  if (t <= keys[0][0]) return keys[0][1];

  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];

    if (t <= t1) {
      const [t0, v0] = keys[i - 1];

      const k = t1 > t0 ? (t - t0) / (t1 - t0) : 1;

      return v0 + (v1 - v0) * k;
    }
  }

  return keys[keys.length - 1][1];
}

function collectTargets(): Set<any> {
  const set = new Set<any>();

  for (const obj of interactiveObjects) {
    if (
      !obj.userData?.info ||
      obj.userData.info.noHighlight ||
      isQuietTarget(obj)
    ) {
      continue;
    }

    obj.traverse((mesh: any) => {
      if (
        mesh.isMesh &&
        mesh.material &&
        !Array.isArray(mesh.material)
      ) {
        set.add(mesh);
      }
    });
  }

  return set;
}

function createNeonMaterial(mesh: any, original: any) {
  const material = original.clone();

  const color = vivid[
    Math.abs(mesh.id) % vivid.length
  ];

  // Always the full neon color;
  // only opacity / glow changes over time.
  material.color.setHex(color);

  if (material.emissive) {
    material.emissive.setHex(color);
  }

  // Always transparent so it never flips between
  // opaque / transparent render lists mid-flicker.
  material.transparent = true;
  material.opacity = 0;

  return material;
}

/**
 * Clone materials once. Safe to call repeatedly:
 * already-registered meshes are skipped.
 */
function registerTargets() {
  for (const mesh of collectTargets()) {
    if (states.has(mesh)) continue;

    const original = mesh.material;

    if (!original?.clone || !original.color) {
      continue;
    }

    states.set(mesh, {
      material: createNeonMaterial(mesh, original),
      original,
      baseOpacity: original.opacity ?? 1,

      level: 0,
      dir: 'off',
      done: true,
      lit: false,

      keys: [],
      t: 0,
      wait: 0,
      delay: 0,
    });
  }
}

/**
 * Render the overlay once while hidden, so the GPU
 * shaders for the neon materials are compiled during
 * the reveal instead of at the first flicker.
 */
function prewarmOverlay() {
  if (prewarmed || states.size === 0) return;

  prewarmed = true;

  resizeColorCanvas();
  enableOverlayLights();

  colorCamera.copy(camera);
  colorCamera.layers.set(1);
  colorCamera.updateMatrixWorld(true);

  const previousBackground = scene.background;

  scene.background = null;

  const swapped: [any, any][] = [];

  for (const [mesh, state] of states) {
    swapped.push([mesh, mesh.material]);

    mesh.material = state.material;
    mesh.layers.enable(1);
  }

  try {
    colorRenderer.render(scene, colorCamera);
  } finally {
    scene.background = previousBackground;

    for (const [mesh, material] of swapped) {
      mesh.material = material;
      mesh.layers.disable(1);
    }
  }
}

/**
 * Apply the current neon level to the overlay material.
 */
function applyNeonLevel(state: NeonState) {
  const mat = state.material;
  const level = state.level;

  mat.opacity = state.baseOpacity * level;

  if (mat.emissive) {
    mat.emissiveIntensity =
      NEON_INTENSITY * (0.4 + 0.6 * level);
  }
}

function setLit(mesh: any, state: NeonState, on: boolean) {
  if (state.lit === on) return;

  state.lit = on;

  if (on) {
    mesh.layers.enable(1);
    litMeshes.add(mesh);
  } else {
    mesh.layers.disable(1);
    litMeshes.delete(mesh);
  }
}

/**
 * Called when the reveal finishes (neon ON)
 * or when Truth Vision is closed (neon OFF).
 */
function syncTargetColors() {
  const fullyRevealed =
    active &&
    radius >= maxRadius() - 2;

  neonWanted = fullyRevealed;

  if (fullyRevealed) {
    // No-op if already done during the reveal.
    registerTargets();
  }
}

/**
 * Advance every neon timeline each frame.
 */
function updateNeonTransition(dt: number) {
  neonAnimating = false;

  if (states.size === 0) return;

  const wantedDir = neonWanted ? 'on' : 'off';

  for (const [mesh, state] of states) {
    // Direction changed -> start a new timeline
    // from the current brightness.
    if (state.dir !== wantedDir) {
      state.dir = wantedDir;
      state.done = false;
      state.t = 0;
      state.wait = 0;

      if (wantedDir === 'on') {
        // If the object's material was swapped by other
        // code since we cloned it, rebuild the clone.
        if (state.original !== mesh.material) {
          const original = mesh.material;

          if (original?.clone && original.color) {
            state.material.dispose();
            state.material = createNeonMaterial(
              mesh,
              original
            );
            state.original = original;
            state.baseOpacity = original.opacity ?? 1;
          }
        }

        state.keys = buildOnKeys(state.level);
        state.delay = rand(0, STAGGER_ON);
      } else {
        state.keys = buildOffKeys(state.level);
        state.delay = rand(0, STAGGER_OFF);
      }
    }

    if (state.done) continue;

    neonAnimating = true;

    if (state.wait < state.delay) {
      state.wait += dt;
      continue;
    }

    // Only start drawing this mesh once its
    // own timeline actually begins.
    setLit(mesh, state, true);

    state.t += dt;

    const endT = state.keys[state.keys.length - 1][0];

    if (state.t >= endT) {
      state.level = state.dir === 'on' ? 1 : 0;
      state.done = true;
    } else {
      state.level = sampleKeys(state.keys, state.t);
    }

    applyNeonLevel(state);

    // Fully off: stop drawing it (material stays cached).
    if (state.done && state.dir === 'off') {
      setLit(mesh, state, false);
    }
  }
}

// ========================================
// MAIN UPDATE LOOP
// ========================================

let lastUpdateMs = performance.now();

/**
 * Called by main.ts immediately before:
 *
 * composer.render();
 *
 * This is the single authoritative update
 * for the GPU shader each frame.
 */
export function updateTruthVision() {
  const now = performance.now();

  const dt = Math.min(
    0.1,
    (now - lastUpdateMs) / 1000
  );

  lastUpdateMs = now;

  updateTruthShader(
    centerX,
    centerY,
    radius
  );

  updateNeonTransition(dt);

  holder.style.display = 'none';
}

// ========================================
// VINTAGE TV TRANSITION
// ========================================

export function playTruthTransition(
  label: string,
  action: () => void
) {
  if (transitioning) return;

  if (
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  ) {
    action();
    return;
  }

  transitioning = true;

  title.textContent = label;

  tv.classList.remove('playing');

  // Restart the existing TV animation.
  void tv.offsetWidth;

  tv.classList.add('playing');

  window.setTimeout(() => {
    try {
      action();
    } finally {
      transitioning = false;
    }
  }, 850);

  window.setTimeout(() => {
    tv.classList.remove('playing');
  }, 1450);
}

// ========================================
// COLOR OBJECT RENDER PASS
// ========================================

let lastColorFrame = 0;
let overlayWasVisible = false;

const swapBuffer: [any, any][] = [];

export function renderTruthColorObjects() {
  // Only draw while something is lit or flickering.
  // Idle = zero overlay cost.
  const visible =
    litMeshes.size > 0 &&
    !S.introActive &&
    !S.tutorialActive;

  if (visible !== overlayWasVisible) {
    colorRenderer.domElement.style.display =
      visible ? 'block' : 'none';

    overlayWasVisible = visible;
  }

  if (!visible) {
    lastColorFrame = 0;
    return;
  }

  const now = performance.now();

  // ~30 FPS when steady, full rate while flickering
  // so quick flashes aren't skipped.
  if (
    !neonAnimating &&
    lastColorFrame &&
    now - lastColorFrame < 32
  ) {
    return;
  }

  lastColorFrame = now;

  resizeColorCanvas();
  enableOverlayLights();

  colorCamera.copy(camera);
  colorCamera.layers.set(1);
  colorCamera.updateMatrixWorld(true);

  const previousBackground = scene.background;

  scene.background = null;

  // Temporarily swap in the neon materials
  // ONLY for the overlay render, and only for
  // meshes that are currently lit.
  swapBuffer.length = 0;

  for (const mesh of litMeshes) {
    const state = states.get(mesh)!;

    swapBuffer.push([mesh, mesh.material]);
    mesh.material = state.material;
  }

  try {
    colorRenderer.clear();
    colorRenderer.render(
      scene,
      colorCamera
    );
  } finally {
    scene.background = previousBackground;

    for (const [mesh, material] of swapBuffer) {
      mesh.material = material;
    }

    swapBuffer.length = 0;
  }
}