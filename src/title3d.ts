import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/pixelify-sans/latin-700.css';
import * as THREE from 'three';
import { scene, dustScene } from './core';

/**
 * ชื่อเว็บลอยกลางห้อง: "Mon Folio : Dossier Personnel"
 * - "Folio" = ตัวอักษรหวัดแบบ pixel-art (เหมือนเดิม)
 * - "Mon" และ "Dossier Personnel" = pixel font (Pixelify Sans) พิกเซลหนา อ่านง่าย วาดบน dust layer ความละเอียดเต็ม
 * - อยู่ลึกเข้าไปในห้องกว่าเดิม (BASE_Z) ไม่ลอยหน้าของอื่น
 */

const W = 420;
const H = 140;
const HW = W / 2, HH = H / 2;                   // ข้อความ pixel-font: canvas เล็ก ขยายแบบ nearest (ได้พิกเซลหนา ๆ อ่านง่าย)

// ---------- Folio (pixel) ----------
const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
const texture = new THREE.CanvasTexture(canvas);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
texture.colorSpace = THREE.SRGBColorSpace;

// ---------- Mon + Dossier Personnel (คม) ----------
const hiCanvas = document.createElement('canvas');
hiCanvas.width = HW;
hiCanvas.height = HH;
const hiCtx = hiCanvas.getContext('2d')!;
const hiTexture = new THREE.CanvasTexture(hiCanvas);
hiTexture.magFilter = THREE.NearestFilter;
hiTexture.minFilter = THREE.NearestFilter;
hiTexture.generateMipmaps = false;
hiTexture.colorSpace = THREE.SRGBColorSpace;

function paintFolio() {
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '96px "Great Vibes", cursive';
  ctx.fillText('Folio', 108, 86);

  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = d[i * 4 + 3] >= 55 ? 1 : 0;
  d.fill(0);

  const setPixel = (px: number, py: number, r: number, g: number, b: number) => {
    if (px < 0 || py < 0 || px >= W || py >= H) return;
    const k = (py * W + px) * 4;
    d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
  };

  // outline
  const outline = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [-2, 0], [2, 0], [0, -2], [0, 2]] as const;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    if (!mask[py * W + px]) continue;
    for (const [dx, dy] of outline) {
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (!mask[ny * W + nx]) setPixel(nx, ny, 34, 20, 10);
    }
  }
  // inner shadow
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    if (!mask[py * W + px]) continue;
    const nx = px + 1, ny = py + 1;
    if (nx < W && ny < H && !mask[ny * W + nx]) setPixel(nx, ny, 92, 58, 20);
  }
  // fill
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    if (mask[py * W + px]) setPixel(px, py, 255, 236, 176);
  }
  ctx.putImageData(img, 0, 0);
  texture.needsUpdate = true;
}

/** วาดข้อความด้วย pixel font → binarize (ตัด antialias) + ขอบเข้ม 1 texel */
function pixText(str: string, size: number, fill: string, edge: string) {
  const pad = 3, m = document.createElement('canvas').getContext('2d')!;
  const font = `700 ${size}px "Pixelify Sans", monospace`; m.font = font;
  const w = Math.ceil(m.measureText(str).width) + pad * 2, h = Math.ceil(size * 1.5) + pad * 2;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d', { willReadFrequently: true })!;
  cx.font = font; cx.textBaseline = 'alphabetic'; cx.fillStyle = '#fff'; cx.fillText(str, pad, pad + size);
  const id = cx.getImageData(0, 0, w, h), d = id.data, mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = d[i * 4 + 3] >= 110 ? 1 : 0;
  d.fill(0);
  const put = (x: number, y: number, hex: string) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const k = (y * w + x) * 4; d[k] = parseInt(hex.slice(1, 3), 16); d[k + 1] = parseInt(hex.slice(3, 5), 16); d[k + 2] = parseInt(hex.slice(5, 7), 16); d[k + 3] = 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && !mask[ny * w + nx]) put(nx, ny, edge); }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) put(x, y, fill);
  cx.putImageData(id, 0, 0);
  return { cv, pad, size };
}

function paintSmall() {
  hiCtx.clearRect(0, 0, hiCanvas.width, hiCanvas.height);
  hiCtx.imageSmoothingEnabled = false;
  const mon = pixText('Mon', 15, '#fff0cf', '#22140a');
  hiCtx.drawImage(mon.cv, 38 - mon.pad, 22 - mon.pad - mon.size);
  const sub = pixText('Dossier Personnel', 16, '#f6c866', '#22140a');
  hiCtx.drawImage(sub.cv, Math.round(HW / 2 + 4 - sub.cv.width / 2), 64 - sub.pad - sub.size);
  hiTexture.needsUpdate = true;
}

function paintTitle() {
  paintFolio();
  paintSmall();
}

paintTitle();
Promise.all([
  document.fonts.load('96px "Great Vibes"', 'Folio'),
  document.fonts.load('700 16px "Pixelify Sans"', 'Mon Dossier Personnel'),
]).then(paintTitle).catch(() => { /* keep fallback render */ });

// ----------------------------
// 3D TITLE SETUP
// ----------------------------
const aspect = H / W;
const planeW = 4.05;
const planeH = planeW * aspect;

export const title3d = new THREE.Group();
const hiGroup = new THREE.Group();   // Mon + Dossier Personnel: วาดบน dust canvas ความละเอียดเต็ม (ไม่แตก pixel)
dustScene.add(hiGroup);
const fadeMats: { m: THREE.MeshBasicMaterial; k: number }[] = [];
const mk = (map: THREE.Texture, color: string | null, k: number) => {
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
  if (color) m.color = new THREE.Color(color);
  fadeMats.push({ m, k });
  return m;
};

// ความหนา (เฉพาะ Folio แบบ pixel)
for (let i = 0; i < 3; i++) {
  const depth = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mk(texture, i < 2 ? '#4a2b12' : '#6b3b18', 0.95));
  depth.position.set(0.012 * (i + 1), -0.01 * (i + 1), -0.01 * (i + 1));
  depth.renderOrder = 3 + i;
  title3d.add(depth);
}
// เงาของข้อความคม 1 ชั้น
const smallShadow = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mk(hiTexture, '#2a1608', 0.8));
smallShadow.position.set(0.012, -0.012, -0.012);
smallShadow.renderOrder = 10;
hiGroup.add(smallShadow);

const frontMesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mk(texture, null, 1));
frontMesh.renderOrder = 20;
title3d.add(frontMesh);
const smallFront = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mk(hiTexture, null, 1));
smallFront.renderOrder = 21;
hiGroup.add(smallFront);

// ตำแหน่งในห้อง: ถอยเข้าไปลึกกว่าเดิม (เดิม z = 0.88)
const BASE_X = 0;
const BASE_Y = 2.18;
const BASE_Z = -0.6;

title3d.position.set(BASE_X, BASE_Y, BASE_Z);
scene.add(title3d);

let opacity = 0;

/** เรียกทุกเฟรม */
export function updateTitle(t: number, show: boolean, dt: number) {
  opacity += ((show ? 0.97 : 0) - opacity) * (1 - Math.exp(-dt * 3.2));
  for (const { m, k } of fadeMats) m.opacity = opacity * k;
  title3d.visible = opacity > 0.01;
  title3d.position.y = BASE_Y + Math.sin(t * 0.9) * 0.035;
  title3d.rotation.y = Math.sin(t * 0.35) * 0.045;
  hiGroup.position.copy(title3d.position); hiGroup.rotation.copy(title3d.rotation); hiGroup.visible = title3d.visible;
}
