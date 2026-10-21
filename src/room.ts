/** โครงห้อง: พื้น เพดาน ผนัง หน้าต่าง ม่าน ประตู ตู้หนังสือ */
import * as THREE from 'three';
import { scene } from './core';
import { box, rnd } from './helpers';
import { getAlignedWallpaper, walnutTex } from './textures';

export const W = 7.4, H = 3.3, DEP = 7.4, ZC = 1.2, bz = -2.6;
const wainscotH = 0.9;
const upperH = H - wainscotH;

box(0, -0.15, ZC, W + 0.4, 0.3, DEP, 0xffffff, { map: walnutTex, r: 0.75 });
box(0, H + 0.05, ZC, W + 0.4, 0.1, DEP, 0x221309, { r: 0.9 });
for (let z = -1.8; z <= 3.8; z += 1.4) {
  box(0, H - 0.08, z, W + 0.2, 0.16, 0.18, 0x3d2010);
}

const wpSideLeft = getAlignedWallpaper(-DEP / 2, DEP, upperH);
box(-W / 2 - 0.1, wainscotH / 2, ZC, 0.2, wainscotH, DEP, 0x3d2315);
box(-W / 2 - 0.1, wainscotH + upperH / 2, ZC, 0.2, upperH, DEP, 0xffffff, { map: wpSideLeft });

const wpSideRight = getAlignedWallpaper(-DEP / 2, DEP, upperH);
box(W / 2 + 0.1, wainscotH / 2, ZC, 0.2, wainscotH, DEP, 0x3d2315);
box(W / 2 + 0.1, wainscotH + upperH / 2, ZC, 0.2, upperH, DEP, 0xffffff, { map: wpSideRight });

export const winW = 3.2, winH = 1.6, winBottom = 0.9, winTop = 2.5;
const sideWallW = (W - winW) / 2;
const topWallH = H - winTop;

const wpBackLeft = getAlignedWallpaper(-W / 2, sideWallW, winH);
const wpBackRight = getAlignedWallpaper(W / 2 - sideWallW, sideWallW, winH);
const wpBackTop = getAlignedWallpaper(-W / 2, W, topWallH);

box(0, wainscotH / 2, bz, W, wainscotH, 0.2, 0x3d2315);
box(-W / 2 + sideWallW / 2, winBottom + winH / 2, bz, sideWallW, winH, 0.2, 0xffffff, { map: wpBackLeft });
box(W / 2 - sideWallW / 2, winBottom + winH / 2, bz, sideWallW, winH, 0.2, 0xffffff, { map: wpBackRight });
box(0, winTop + topWallH / 2, bz, W, topWallH, 0.2, 0xffffff, { map: wpBackTop });

export const skyMesh = box(0, 1.7, -5.2, 9, 6, 0.1, 0xffc478, { e: 0xffb252, ei: 2.2, cs: false, rs: false });

box(0, winBottom - 0.05, bz + 0.08, winW + 0.2, 0.1, 0.16, 0x2b170c);
box(0, winTop + 0.05, bz + 0.08, winW + 0.2, 0.1, 0.16, 0x2b170c);
box(-winW / 2 - 0.05, (winBottom + winTop) / 2, bz + 0.08, 0.1, winH + 0.2, 0.16, 0x2b170c);
box(winW / 2 + 0.05, (winBottom + winTop) / 2, bz + 0.08, 0.1, winH + 0.2, 0.16, 0x2b170c);
export const blindSlats = [];   // เก็บไว้ให้ intro ค่อยๆ เปิดม่าน
for (let y = winBottom + 0.08; y <= winTop - 0.05; y += 0.11) {
  blindSlats.push(box(0, y, bz + 0.08, winW, 0.035, 0.08, 0xd4bc8b, { rx: -0.28, r: 0.7 }));
}

export const shellCount = scene.children.length; // ทุกอย่างหลังจุดนี้ = เฟอร์นิเจอร์ (ใช้เป็น occluder ของ shaft/ฝุ่น)

// Window Interactive Box (คลิกเปลี่ยนเวลา / Hover ไม่เรืองแสง)
export const windowInteractGroup = new THREE.Group();
const windowHitbox = new THREE.Mesh(
  new THREE.BoxGeometry(winW, winH, 0.35),
  new THREE.MeshBasicMaterial({ visible: false })
);
windowHitbox.position.set(0, (winBottom + winTop) / 2, bz + 0.1);
windowInteractGroup.add(windowHitbox);
scene.add(windowInteractGroup);

export const drX = W / 2 - 0.02, drZ = -1.4;
export const drW = 1.3, drH = 2.45;
box(drX, drH / 2, drZ, 0.08, drH + 0.1, drW + 0.12, 0x241208);
// บานประตูหมุนรอบบานพับด้านหลัง (เปิดได้เมื่อมีกุญแจ — ดู door.ts)
export const doorLeaf = new THREE.Group(); doorLeaf.position.set(drX, 0, drZ - drW / 2); scene.add(doorLeaf);
box(0.02, drH / 2, drW / 2, 0.05, drH, drW, 0x3d2010, { r: 0.7, parent: doorLeaf });
box(0.02, 1.62, drW / 2, 0.06, 1.1, 0.8, 0xd8c8a8, { a: 0.85, r: 0.3, e: 0x332211, ei: 0.3, parent: doorLeaf });
box(0.025, 1.62, drW / 2, 0.07, 1.1, 0.04, 0x241208, { parent: doorLeaf });
box(0.025, 1.62, drW / 2, 0.07, 0.04, 0.8, 0x241208, { parent: doorLeaf });
box(-0.02, 1.05, drW / 2 + drW * 0.38, 0.08, 0.08, 0.08, 0xd8b257, { m: 0.85, r: 0.25, parent: doorLeaf });

export const bkX = W / 2 - 0.43, bkZ = 1.2;
box(bkX, 0.55, bkZ, 0.72, 1.1, 2.5, 0x4a2a16, { r: 0.7 });
box(bkX + 0.32, 0.55, bkZ, 0.04, 1.02, 2.42, 0x331c0e);
box(bkX - 0.02, 0.55, bkZ, 0.66, 0.04, 2.42, 0x3a1e0f);

for (let z = -0.95; z <= 0.95; z += 0.14) {
  box(bkX - 0.04, 0.33, bkZ + z, 0.42, rnd(0.22, 0.34), 0.11,
    ['#8a3324', '#1e3f5a', '#3b5323', '#aa7c11', '#3d2b1f'][Math.floor(rnd(0, 5))], { rz: rnd(-0.06, 0.04) });
  box(bkX - 0.04, 0.82, bkZ + z, 0.42, rnd(0.22, 0.33), 0.11,
    ['#2a4b7c', '#7a2a1d', '#c29235', '#404040'][Math.floor(rnd(0, 4))], { rz: rnd(-0.04, 0.08) });
}
