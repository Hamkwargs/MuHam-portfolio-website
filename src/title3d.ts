import '@fontsource/whisper';
import '@fontsource/ballet';
import '@fontsource/silkscreen';
import * as THREE from 'three';

/**
 * 3D portfolio title, rendered above the room's bloom and light rays.
 * Front: original warm gold. 3D extrusion: dark brown, thinner than before.
 */
const CW = 512;
const CH = 160;
const PLANE_W = 4.05;
const PLANE_H = (PLANE_W * CH) / CW;
const BASE_X = 0;
const BASE_Y = 2.26;
const BASE_Z = -0.5;

// Change this to adjust the color of the 3D extrusion.
const SIDE_COLOR = '#4A2E1C';
const DEPTH_DIR = new THREE.Vector3(0.15, -0.1, -1).normalize();
const DEPTH_STEPS = 8;

// Multiplier for 3D thickness. 1 = original; 0.5 = half as thick.
const DEPTH_MULTIPLIER = 0.35;

type RGB = [number, number, number];
type LayerSpec = {
  text: string;
  family: string;
  fallback: string;
  size: number;
  pixel: number;
  fill: RGB;
  edge: RGB;
  stroke: number;
  threshold: number;
  nudgeX: number;
  nudgeY: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  depth: number;
  order: number;
  smooth?: boolean;
  outline?: number;
  weightBoost?: number; // Extra gold thickness in low-resolution canvas pixels
};

// Outline controls: 0 = off, 1 = tiny brown outline, 2 = thicker.
// Stroke color: [166, 107, 63] = #A66B3F (visible warm brown).
// SIDE_COLOR controls the darker 3D extrusion separately.
// Keep the original font families, placement, and pixel settings.
const LAYERS: LayerSpec[] = [
  {
    text: 'Hamkwargs',
    family: 'Silkscreen',
    fallback: 'monospace',
    size: 48,
    pixel: 1,
    fill: [255, 240, 207],
    edge: [128, 80, 47],
    stroke: 2,
    threshold: 35,
    nudgeX: 0,
    nudgeY: 0,
    x: 0.82,
    y: 1.85,
    z: -0.51,
    scale: 0.5,
    depth: 0.3,
    order: 10,
    smooth: true,
    outline: 2,
  },
  {
    text: 'Port  olio',
    family: 'Whisper',
    fallback: 'cursive',
    size: 178,
    pixel: 2.5,
    fill: [255, 234, 176],
    edge: [128, 80, 47],
    stroke: 0,
    threshold: 40,
    nudgeX: 0,
    nudgeY: 0,
    x: 0,
    y: 2.26,
    z: -0.5,
    scale: 0.8,
    depth: 0.18,
    order: 30,
    smooth: false,
    outline: 1,
  },
  {
    text: 'f',
    family: 'Ballet',
    fallback: 'cursive',
    size: 86,
    pixel: 2.5,
    fill: [255, 234, 176],
    edge: [128, 80, 47],
    stroke: 0,
    threshold: 30,
    nudgeX: 0,
    nudgeY: 0,
    x: 0.26,
    y: 2.26,
    z: -0.5,
    scale: 0.8,
    depth: 0.18,
    order: 50,
    smooth: false,
    outline: 1, // Brown outer stroke (unchanged)
    weightBoost: 1.2, // Gold inner stroke: 0 = original, 1.6 = fuller f
  },
];

function paintLayer(spec: LayerSpec, canvas: HTMLCanvasElement): void {
  const p = spec.pixel;
  const w = Math.ceil(CW / p);
  const h = Math.ceil(CH / p);
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.font = `${spec.size / p}px "${spec.family}", ${spec.fallback}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = (CW / 2 + spec.nudgeX) / p;
  const cy = (CH / 2 + spec.nudgeY) / p;

  if (spec.smooth) {
    const [er, eg, eb] = spec.edge;
    const [fr, fg, fb] = spec.fill;
    // Smooth fonts (Hamkwargs): `stroke` controls the brown outline.
    // `outline` remains the pixel-outline control for non-smooth fonts.
    if (spec.stroke > 0) {
      ctx.lineWidth = spec.stroke / p;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgb(${er},${eg},${eb})`;
      ctx.strokeText(spec.text, cx, cy);
    }
    ctx.fillStyle = `rgb(${fr},${fg},${fb})`;
    ctx.fillText(spec.text, cx, cy);
    return;
  }

  // Build the glyph mask in white. For Ballet 'f', add a separate
  // gold-colored weight layer BEFORE applying the unchanged brown outline.
  // Canvas strokeText extends half its lineWidth outside the glyph.
  if ((spec.weightBoost ?? 0) > 0) {
    ctx.lineWidth = spec.weightBoost!;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(spec.text, cx, cy);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(spec.text, cx, cy);
  if (spec.stroke > 0) {
    ctx.lineWidth = spec.stroke / p;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(spec.text, cx, cy);
  }

  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = data[i * 4 + 3] >= spec.threshold ? 1 : 0;
  }
  data.fill(0);

  const put = (x: number, y: number, color: RGB) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const k = (y * w + x) * 4;
    data[k] = color[0];
    data[k + 1] = color[1];
    data[k + 2] = color[2];
    data[k + 3] = 255;
  };

  // Optional thin pixel outline. Each step = one pixel in the low-resolution
  // text canvas (at pixel: 2.5, one step corresponds to 2.5 source pixels).
  // Set outline: 0 to disable, 1 for thin, 2 for thicker.
  const radius = Math.max(0, Math.floor(spec.outline ?? 0));
  if (radius > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy > radius * radius) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (!mask[ny * w + nx]) put(nx, ny, spec.edge);
          }
        }
      }
    }
  }
  // The enlarged gold glyph is painted last, on top of the brown outline.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) put(x, y, spec.fill);
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Make a white alpha mask for the extrusion.
 * This prevents dark edge pixels from multiplying the brown material
 * into an almost-black color.
 */
function paintSideMask(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement
): void {
  target.width = source.width;
  target.height = source.height;
  const ctx = target.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, target.width, target.height);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 255;
    img.data[i + 1] = 255;
    img.data[i + 2] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export const title3d = new THREE.Group();
const fadeMats: Array<{ m: THREE.MeshBasicMaterial; k: number }> = [];
const painters: Array<() => void> = [];

function makeMaterial(
  texture: THREE.Texture,
  color: string | null,
  fadeMultiplier: number
): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  if (color) material.color.set(color);
  fadeMats.push({ m: material, k: fadeMultiplier });
  return material;
}

for (const spec of LAYERS) {
  const frontCanvas = document.createElement('canvas');
  const sideCanvas = document.createElement('canvas');
  const frontTexture = new THREE.CanvasTexture(frontCanvas);
  const sideTexture = new THREE.CanvasTexture(sideCanvas);

  for (const tex of [frontTexture, sideTexture]) {
    tex.magFilter = spec.smooth ? THREE.LinearFilter : THREE.NearestFilter;
    tex.minFilter = spec.smooth ? THREE.LinearFilter : THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
  }

  painters.push(() => {
    paintLayer(spec, frontCanvas);
    paintSideMask(frontCanvas, sideCanvas);
    frontTexture.needsUpdate = true;
    sideTexture.needsUpdate = true;
  });

  const layer = new THREE.Group();
  layer.position.set(spec.x - BASE_X, spec.y - BASE_Y, spec.z - BASE_Z);
  layer.scale.setScalar(spec.scale);
  title3d.add(layer);

  const geometry = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
  const thickness = spec.depth * DEPTH_MULTIPLIER;

  for (let i = DEPTH_STEPS; i >= 1; i--) {
    const sideMaterial = makeMaterial(
      sideTexture,
      SIDE_COLOR,
      0.95
    );
    const side = new THREE.Mesh(geometry, sideMaterial);
    side.position.copy(DEPTH_DIR).multiplyScalar((thickness * i) / DEPTH_STEPS);
    side.renderOrder = spec.order + (DEPTH_STEPS - i) * 0.01;
    layer.add(side);
  }

  const faceMaterial = makeMaterial(frontTexture, null, 1);
  const face = new THREE.Mesh(geometry, faceMaterial);
  face.position.z = 0.008;
  face.renderOrder = spec.order + 5;
  layer.add(face);
}

const paintAll = () => painters.forEach((paint) => paint());
paintAll();
Promise.all(
  LAYERS.map((spec) =>
    document.fonts.load(
      `${spec.size / spec.pixel}px "${spec.family}"`,
      spec.text
    )
  )
)
  .then(paintAll)
  .catch((error) => console.warn('Failed to load title fonts:', error));

title3d.position.set(BASE_X, BASE_Y, BASE_Z);
export const titleOverlayScene = new THREE.Scene();
titleOverlayScene.add(title3d);

/** Render after composer, rayRenderer, and dustRenderer. */
export function renderTitleOverlay(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera
): void {
  if (!title3d.visible) return;
  const previousAutoClear = renderer.autoClear;
  renderer.autoClear = false;
  try {
    renderer.clearDepth();
    renderer.render(titleOverlayScene, camera);
  } finally {
    renderer.autoClear = previousAutoClear;
  }
}

let opacity = 0;
/** The fourth argument is accepted for compatibility but intentionally ignored. */
export function updateTitle(
  t: number,
  show: boolean,
  dt: number,
  _light?: number
): void {
  const targetOpacity = show ? 0.97 : 0;
  opacity += (targetOpacity - opacity) * (1 - Math.exp(-dt * 3.2));
  for (const { m, k } of fadeMats) m.opacity = opacity * k;
  title3d.visible = opacity > 0.01;
  title3d.position.y = BASE_Y + Math.sin(t * 0.9) * 0.035;
  title3d.rotation.y = Math.sin(t * 0.35) * 0.045;
}
