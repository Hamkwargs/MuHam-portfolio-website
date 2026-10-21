import * as THREE from 'three';
import { camera } from '../core';
import { rect, type Ctx, type Rect } from './pixel';
import { PAL } from './palette';

const v = new THREE.Vector3();

// ---- ป้ายชื่อ DOM (chips) ----
const chipQ: { x: number; y: number; label: string; active: boolean }[] = [];
const chipPool: HTMLDivElement[] = [];
export const chipsBegin = () => { chipQ.length = 0; };
export function chipsFlush() {
  chipQ.forEach((q, i) => {
    let n = chipPool[i];
    if (!n) { n = document.createElement('div'); n.className = 'px-chip'; document.body.appendChild(n); chipPool[i] = n; }
    if (n.textContent !== q.label) n.textContent = q.label;
    n.classList.toggle('active', q.active); n.style.display = 'block';
    n.style.left = Math.round(q.x) + 'px'; n.style.top = Math.round(Math.max(34, q.y - 6)) + 'px';
  });
  for (let i = chipQ.length; i < chipPool.length; i++) chipPool[i].style.display = 'none';
}
/** กรอบบนจอ (พิกัด logical) ของ mesh/box ที่ฉายจากกล้องปัจจุบัน */
export function screenBox(obj: THREE.Object3D, lw: number, lh: number): Rect {
  obj.updateWorldMatrix(true, false);
  const g = (obj as THREE.Mesh).geometry as THREE.BufferGeometry; g.computeBoundingBox(); const b = g.boundingBox!;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    v.set(x, y, z).applyMatrix4(obj.matrixWorld).project(camera); const sx = (v.x * 0.5 + 0.5) * lw, sy = (-v.y * 0.5 + 0.5) * lh; x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
export const toScreen = (p: THREE.Vector3, lw: number, lh: number) => { v.copy(p).project(camera); return { x: (v.x * 0.5 + 0.5) * lw, y: (-v.y * 0.5 + 0.5) * lh }; };

/** วงเล็บมุมรอบกลุ่ม (แทนการเรืองแสง) + ป้ายชื่อ */
export function brackets(c: Ctx, r: Rect, label: string, active: boolean) {
  const L = Math.max(8, Math.min(18, r.w / 6)), col = active ? PAL.amber : PAL.paper, t = active ? 2 : 1, x0 = Math.round(r.x), y0 = Math.round(r.y), x1 = Math.round(r.x + r.w), y1 = Math.round(r.y + r.h);
  if (active) [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([cx, cy, sx, sy]) => { rect(c, sx > 0 ? cx : cx - L, sy > 0 ? cy : cy - t, L, t, col); rect(c, sx > 0 ? cx : cx - t, sy > 0 ? cy : cy - L, t, L, col); });
  // ป้ายชื่อ: วาดเป็น DOM (ตัวอักษรคมอ่านง่าย ไม่ใช่ pixel เล็ก ๆ)
  const cv = c.canvas as HTMLCanvasElement, k = cv.clientWidth / Math.max(1, cv.width);
  chipQ.push({ x: x0 * k, y: y0 * k, label, active });
}

const box3 = new THREE.Box3();
/** กรอบบนจอของ Object3D ใด ๆ (ใช้ Box3 ของทั้งกลุ่ม) */
export function screenBoxObj(obj: THREE.Object3D, lw: number, lh: number): Rect {
  box3.setFromObject(obj); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const x of [box3.min.x, box3.max.x]) for (const y of [box3.min.y, box3.max.y]) for (const z of [box3.min.z, box3.max.z]) {
    v.set(x, y, z).project(camera); const sx = (v.x * 0.5 + 0.5) * lw, sy = (-v.y * 0.5 + 0.5) * lh; x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
