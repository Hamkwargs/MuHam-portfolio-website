/** กรอบรูปบนผนัง: ใบใหญ่ = CV (pixel เป็นค่าเริ่มต้น พอซูมเข้าดูจะเปลี่ยนเป็นภาพคมชัด) · ใบเล็ก = รูปตกแต่ง — สว่าง/มืดตามไฟห้อง */
import * as THREE from 'three';
import { box } from './helpers';
import { bz } from './room';
import { framesGroup } from './furniture';
import { assetUrl, pixelUrl } from './assets';
import { placeholderCanvas, pixelate } from './ui/art';
import { cv } from './data';

const Z0 = bz + 0.12;
const mkTex = (c: HTMLCanvasElement | HTMLImageElement, pixel: boolean) => { const t = new THREE.Texture(c as any); t.needsUpdate = true; t.magFilter = pixel ? THREE.NearestFilter : THREE.LinearFilter; t.minFilter = pixel ? THREE.NearestFilter : THREE.LinearMipmapLinearFilter; return t; };
function frame(cx: number, cy: number, w: number, h: number, border: number, tex: THREE.Texture) {
  box(cx, cy, Z0, w, h, 0.03, border, { parent: framesGroup }); box(cx, cy, Z0 + 0.014, w - 0.08, h - 0.08, 0.02, 0xe8dfc6, { r: 0.9, parent: framesGroup });
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.04 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, h - 0.12), mat); pic.position.set(cx, cy, Z0 + 0.026); framesGroup.add(pic); return { pic, mat };
}
const imgToCanvas = (src: string, size: [number, number], cb: (c: HTMLCanvasElement) => void) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = size[0]; c.height = size[1]; const x = c.getContext('2d')!; x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, size[0], size[1]); cb(c); }; im.src = src; };

// ---- ใบใหญ่: CV ----
const CVW = 0.46, CVH = 0.62;
const cvBase = placeholderCanvas('cv-frame', 28, 38);
const cvFrame = frame(2.25, 2.05, CVW, CVH, 0x331c0e, mkTex(cvBase, true));
let pixelTex: THREE.Texture | null = null, crispTex: THREE.Texture | null = null;
if (cv.image) {
  const pu = pixelUrl('cv.png') ?? undefined;
  (pu ? Promise.resolve(pu) : pixelate(cv.image, 56)).then(u => imgToCanvas(u, [56, 78], c => { pixelTex = mkTex(c, true); if (!crispTex || !showingCrisp) { cvFrame.mat.map = pixelTex; cvFrame.mat.emissiveMap = pixelTex; cvFrame.mat.needsUpdate = true; } }));
}
let showingCrisp = false;
export const cvPic = cvFrame.pic;
export function setCvCrisp(on: boolean) {
  showingCrisp = on; if (!cv.image) return;
  if (on && !crispTex) { new THREE.TextureLoader().load(cv.image, t => { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; crispTex = t; if (showingCrisp) apply(); }); return; }
  apply();
}
function apply() { const t = showingCrisp ? crispTex : pixelTex; if (!t) return; cvFrame.mat.map = t; cvFrame.mat.emissiveMap = t; cvFrame.mat.needsUpdate = true; }

// ---- ใบเล็ก: รูปตกแต่ง (รูปจริง/รูป pixel ถ้ามี) ----
const decorUrl = assetUrl('frame-pixel.png') ?? assetUrl('frame-real.jpg');
const decor = frame(2.85, 2.18, 0.42, 0.52, 0x1a1a1a, mkTex(placeholderCanvas('frame-pixel', 28, 34), true));
if (decorUrl) imgToCanvas(decorUrl, [56, 70], c => { const t = mkTex(c, true); decor.mat.map = t; decor.mat.emissiveMap = t; decor.mat.needsUpdate = true; });
