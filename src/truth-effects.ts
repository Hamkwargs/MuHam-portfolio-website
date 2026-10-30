/** Detective Vision / rotating CMYK target graphics / vintage television wipe.
 * DOM effects project existing 3D targets, without modifying room geometry.
 */
import * as THREE from 'three';
import { camera, scene } from './core';
import { interactiveObjects } from './interactables';
import { S } from './state';

export const isQuietTarget = (obj: any) => {
  const info = obj?.userData?.info;
  const type = String(info?.type ?? "").toLowerCase();
  return ["coffee", "door", "contact", "window"].includes(type) || /^(coffee|door|contact|window)(\s|$)/i.test(String(info?.title ?? ""));
};
const root = document.createElement('div');
root.id = 'truth-fx';
root.innerHTML = `<div class="truth-newsprint"></div><div class="truth-wave"></div><div class="truth-targets"></div><div class="truth-tv"><div class="truth-static"></div><div class="truth-iris"></div><div class="truth-card"><small>★ SPECIAL BROADCAST ★</small><strong></strong><span>CASE FILE / NOW LOADING</span></div></div>`;
document.body.appendChild(root);
const wave = root.querySelector<HTMLElement>('.truth-wave')!;
const holder = root.querySelector<HTMLElement>('.truth-targets')!;
// Render vivid meshes on a separate transparent WebGL canvas ABOVE the film filter.
// Only allocated once, and only rendered when Truth Vision has finished revealing.
const colorRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
colorRenderer.setClearColor(0x000000, 0);
colorRenderer.domElement.id = 'truth-color-canvas';
colorRenderer.domElement.setAttribute('aria-hidden', 'true');
document.body.appendChild(colorRenderer.domElement);
const colorCamera = camera.clone();
colorCamera.layers.set(1);
let canvasW = 0, canvasH = 0;
function resizeColorCanvas() {
  const w = innerWidth, h = innerHeight;
  if (w === canvasW && h === canvasH) return;
  canvasW = w; canvasH = h;
  colorRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 0.85));
  colorRenderer.setSize(w, h, false);
}
let overlayLightsReady = false;
function enableOverlayLights() {
  if (overlayLightsReady) return;
  scene.traverse((o: any) => { if (o.isLight) o.layers.enable(1); });
  overlayLightsReady = true;
}


const tv = root.querySelector<HTMLElement>('.truth-tv')!;
const title = root.querySelector<HTMLElement>('.truth-card strong')!;
let active = false;
let transitioning = false;
let radius = 0;
let radiusFrom = 0;
let radiusTo = 0;
let animationStart = 0;
const DURATION = 1500;
let centerX = innerWidth / 2;
let centerY = innerHeight / 2;
const maxRadius = () => Math.hypot(Math.max(centerX,innerWidth-centerX),Math.max(centerY,innerHeight-centerY)) + 30;
function applyRadius(value: number) {
  radius = value;
  root.style.setProperty('--truth-radius', `${Math.max(0,value)}px`);
  // The ink and the expanding ring use exactly the same radius.
  wave.style.width = `${Math.max(0,value)*2}px`;
  wave.style.height = `${Math.max(0,value)*2}px`;
  wave.style.opacity = value > 2 && value < maxRadius()-12 ? '1' : '0';

}
function animateRadius(now: number) {
  const t = Math.min(1,(now-animationStart)/DURATION);
  const ease = 1-Math.pow(1-t,3);
  applyRadius(radiusFrom+(radiusTo-radiusFrom)*ease);
  if(t<1) requestAnimationFrame(animateRadius);
}
let animationToken=0;
function startRadiusAnimation() {
  const token=++animationToken;
  animationStart=performance.now();
  const run=(now:number)=>{
    if(token!==animationToken)return;
    const t=Math.min(1,(now-animationStart)/DURATION);
    const ease=1-Math.pow(1-t,3);
    applyRadius(radiusFrom+(radiusTo-radiusFrom)*ease);
    if(t<1)requestAnimationFrame(run);
    else { syncTargetColors(); if (active && radius >= maxRadius()-2) ignitionStart = performance.now(); }
  };
  requestAnimationFrame(run);
}

export function setTruthVision(on: boolean) {
  active = on;
  const btn = document.getElementById('vision-btn');
  const rect = btn?.getBoundingClientRect();
  centerX = rect ? rect.left+rect.width/2 : innerWidth/2;
  centerY = rect ? rect.top+rect.height/2 : innerHeight/2;
  root.style.setProperty('--eye-x',`${centerX}px`);
  root.style.setProperty('--eye-y',`${centerY}px`);
  radiusFrom=radius;
  radiusTo=on?maxRadius():0;
  root.classList.toggle('enabled',on);
  startRadiusAnimation();
  if (!on) { ignitionStart = 0; syncTargetColors(); }
}

export function setTruthHover(_obj: any) {
  // Hover retains existing tooltip/interaction, without an animated shadow overlay.
}

// Clone per-mesh materials once, so shared materials elsewhere in the room stay untouched.
const recolored = new Map<any, { material: any; original: any; color: THREE.Color | null; emissive: THREE.Color | null; intensity: number }>();
const vivid = [0xff256a, 0x00dce8, 0xffd12f, 0xa65bff, 0x66fa91];
// A fluorescent tube sputters before it stays lit. No extra render pass or timers.
let ignitionStart = 0;
const IGNITION_MS = 1450;
function fluorescentLevel(elapsed: number, id: number): number {
  const t = Math.max(0, elapsed - (Math.abs(id) % 6) * 105);
  if (t < 95) return 0.95;
  if (t < 190) return 0.04;
  if (t < 255) return 0.65;
  if (t < 355) return 0.02;
  if (t < 530) return 0.88;
  if (t < 620) return 0.12;
  if (t < 760) return 0.98;
  if (t < IGNITION_MS) return 0.72 + 0.28 * ((t - 760) / (IGNITION_MS - 760));
  // Barely perceptible steady fluorescent shimmer, without random strobing.
  return 0.96 + 0.04 * Math.sin(elapsed * 0.004 + id);
}
function updateFluorescentColors(now: number) {
  if (!ignitionStart || !recolored.size) return;
  const elapsed = now - ignitionStart;
  for (const [mesh, state] of recolored) {
    const intensity = fluorescentLevel(elapsed, mesh.id);
    const color = vivid[Math.abs(mesh.id) % vivid.length];
    // Dark/off intervals show a dim tint rather than a glaring neon flash.
    state.material.color.setHex(color).multiplyScalar(0.12 + intensity * 0.88);
    if (state.material.emissive) {
      state.material.emissive.setHex(color);
      state.material.emissiveIntensity = 0.02 + intensity * 0.38;
    }
  }
}
function syncTargetColors() {
  const shouldColor = new Set<any>();
  for (const obj of interactiveObjects) {
    if (!obj.userData?.info || obj.userData.info.noHighlight || isQuietTarget(obj)) continue;
    obj.traverse((mesh:any) => { if (mesh.isMesh && mesh.material && !Array.isArray(mesh.material)) shouldColor.add(mesh); });
  }
  for (const [mesh, state] of recolored) {
    if (active && radius >= maxRadius()-2 && shouldColor.has(mesh)) {
      if (state.color) mesh.material.color.setHex(vivid[Math.abs(mesh.id) % vivid.length]);
      if (state.emissive) { mesh.material.emissive.setHex(vivid[Math.abs(mesh.id) % vivid.length]); mesh.material.emissiveIntensity = .32; }
    } else {
      mesh.material = state.original;
      mesh.layers.disable(1);
      state.material.dispose();
      recolored.delete(mesh);
    }
  }
  if (!active || radius < maxRadius()-2) return;
  for (const mesh of shouldColor) {
    if (recolored.has(mesh)) continue;
    const original = mesh.material;
    if (!original?.clone || !original.color) continue;
    const material = original.clone();
    recolored.set(mesh, {original, material, color: material.color?.clone() ?? null, emissive: material.emissive?.clone() ?? null, intensity: material.emissiveIntensity ?? 0});
    mesh.material = material;
    mesh.layers.enable(1);
    material.color.setHex(vivid[Math.abs(mesh.id) % vivid.length]);
    if (material.emissive) { material.emissive.setHex(vivid[Math.abs(mesh.id) % vivid.length]); material.emissiveIntensity = .32; }
  }
}

/** Call once per animation frame, after camera.lookAt(). */
export function updateTruthVision() {
  if (radius < 2 || S.introActive || S.tutorialActive) {
    holder.style.display='none';
    return;
  }
  // Mesh colors are real Three.js materials; no rotating HTML target circles.
  holder.style.display='none';
  // Avoid generating a large SVG data URI every frame. The background newspaper
  // mask follows the same CSS radius as the wave, so no per-frame mask rebuild.
}

export function playTruthTransition(label: string, action: ()=>void) {
  if (transitioning) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {action();return;}
  transitioning=true;
  title.textContent=label;
  tv.classList.remove('playing');
  void tv.offsetWidth;
  tv.classList.add('playing');
  window.setTimeout(()=>{try {action();}finally {transitioning=false;}},850);
  window.setTimeout(()=>tv.classList.remove('playing'),1450);
}

/** Draw colored interactive meshes after the grayscale film layer.
 * Call AFTER composer.render() so this overlay stays on top of the filter.
 */
let lastColorFrame = 0;
let overlayWasVisible = false;
export function renderTruthColorObjects() {
  const visible = active && radius >= maxRadius()-2 && recolored.size > 0 && !S.introActive && !S.tutorialActive;
  if (visible !== overlayWasVisible) {
    colorRenderer.domElement.style.display = visible ? 'block' : 'none';
    overlayWasVisible = visible;
  }
  if (!visible) { lastColorFrame = 0; return; }
  const now = performance.now();
  // Cap the second WebGL pass to 30 FPS to halve GPU work.
  if (lastColorFrame && now - lastColorFrame < 32) return;
  lastColorFrame = now;
  updateFluorescentColors(now);
  resizeColorCanvas();
  enableOverlayLights();
  colorCamera.copy(camera);
  colorCamera.layers.set(1);
  colorCamera.updateMatrixWorld(true);
  // No room background on the transparent overlay; restore immediately afterward.
  const previousBackground = scene.background;
  scene.background = null;
  try {
    colorRenderer.clear();
    colorRenderer.render(scene, colorCamera);
  } finally {
    scene.background = previousBackground;
  }
}
