/** ลังแผ่นเสียง + เครื่องเล่น: สลีฟแผ่น = อัลบั้ม (src/content/albums) · คลิกแล้วเลือกเพลงเพื่อเล่น */
import * as THREE from 'three';
import { scene } from './core';
import { box } from './helpers';
import { registerInteractable } from './interactables';
import { albums, type Album } from './data';
import { placeholderCanvas } from './ui/art';
import { player } from './music';

export const REC = { x: 1.5, z: 2.4, w: 0.36, d: 0.5, h: 0.3 };
export const recGroup = new THREE.Group();
const { x: CX, z: CZ, w: W, d: D, h: H } = REC, T = 0.02, WOOD = 0x8a6238;
box(CX, T / 2, CZ, W, T, D, 0x6b4a28, { parent: recGroup });
box(CX, H / 2, CZ + D / 2 - T / 2, W, H, T, WOOD, { parent: recGroup }); box(CX, H / 2, CZ - D / 2 + T / 2, W, H + 0.06, T, WOOD, { parent: recGroup });
box(CX - W / 2 + T / 2, H / 2, CZ, T, H, D, WOOD, { parent: recGroup }); box(CX + W / 2 - T / 2, H / 2, CZ, T, H, D, WOOD, { parent: recGroup });
box(CX, 0.09, CZ + D / 2 + 0.006, 0.2, 0.035, 0.01, 0xd8b257, { m: 0.6, parent: recGroup });

export interface Sleeve { group: THREE.Group; album: number; home: THREE.Vector3; data: Album }
export const sleeves: Sleeve[] = [];
const coverTex = (a: Album) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const c = cv.getContext('2d')!; c.fillStyle = a.color; c.fillRect(0, 0, 32, 32); c.globalAlpha = 0.55; c.drawImage(placeholderCanvas(a.id, 32, 32), 0, 0); c.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter;
  if (a.cover) new THREE.TextureLoader().load(a.cover, im => { c.imageSmoothingEnabled = false; c.drawImage(im.image, 0, 0, 32, 32); t.needsUpdate = true; });
  return t;
};
const DECOR = [0x3a2a3f, 0x2d4a5a, 0x5a3a2d, 0x4a4a2d, 0x2d2d3a];
const total = albums.length + 4;
for (let i = 0; i < total; i++) {
  const g = new THREE.Group(), isAlbum = i >= total - albums.length, ai = i - (total - albums.length), z = CZ - D / 2 + 0.06 + i * ((D - 0.12) / Math.max(1, total - 1));
  const sw = W - 0.05, a = isAlbum ? albums[ai] : undefined;
  box(0, 0, 0, sw, sw, 0.008, isAlbum ? 0xffffff : DECOR[i % DECOR.length], { map: a ? coverTex(a) : null, r: 0.85, parent: g });
  const home = new THREE.Vector3(CX, 0.02 + sw / 2 + 0.01, z); g.position.copy(home); g.rotation.x = -0.2; recGroup.add(g);
  if (isAlbum) sleeves.push({ group: g, album: ai, home, data: a! });
}
// โต๊ะเล็ก + เครื่องเล่นแผ่นเสียง
const TX = 2.1, TZ = 2.5;
box(TX, 0.2, TZ, 0.5, 0.4, 0.4, 0x3a2a1f, { parent: recGroup }); box(TX, 0.43, TZ, 0.44, 0.06, 0.34, 0x2b2b30, { m: 0.2, parent: recGroup }); box(TX, 0.465, TZ + 0.14, 0.07, 0.012, 0.03, 0xd8b257, { m: 0.6, parent: recGroup });
export const platter = new THREE.Group(); platter.position.set(TX - 0.02, 0.475, TZ);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 22), new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.35, metalness: 0.3 })); platter.add(disc);
export const labelMat = new THREE.MeshStandardMaterial({ color: 0xd23a2f, roughness: 0.6 });
const label = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.014, 16), labelMat); platter.add(label);
const tick = box(0.1, 0.008, 0, 0.05, 0.004, 0.012, 0xcfcfd8, { parent: platter }); void tick;
recGroup.add(platter);
box(TX + 0.17, 0.5, TZ - 0.1, 0.012, 0.012, 0.2, 0xcfcfd8, { m: 0.8, parent: recGroup, ry: 0.35 });
player.onChange(() => { if (player.album) labelMat.color.set(player.album.color); });
scene.add(recGroup);
registerInteractable(recGroup, { name: 'Record crate', title: 'Records · music', desc: 'Pick an album and play it', type: 'music', noHighlight: false, center: new THREE.Vector3(CX + 0.3, 0.3, CZ) });
