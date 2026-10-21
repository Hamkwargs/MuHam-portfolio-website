/** helper สร้างโมเดล voxel (กล่อง) สำหรับฉากย่อยในโมดูล */
import * as THREE from 'three';

export function vbox(parent: THREE.Object3D, w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, o: { m?: number; r?: number; e?: number } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.7, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.e ? 0.6 : 0, flatShading: true });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m;
}
/** วาดรูป pixel เป็นก้อน voxel: rows = ASCII, map = ตัวอักษร→สี, s = ขนาดต่อ pixel, t = ความหนา */
export function vpixels(parent: THREE.Object3D, rows: string[], map: Record<string, number>, s: number, t: number, cx = 0, cy = 0, cz = 0, o: { m?: number; r?: number } = {}) {
  const g = new THREE.Group(); const H = rows.length, W = rows[0].length;
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch] !== undefined) vbox(g, s, s, t, map[ch], (i - (W - 1) / 2) * s, ((H - 1) / 2 - j) * s, 0, o); }));
  g.position.set(cx, cy, cz); parent.add(g); return g;
}
