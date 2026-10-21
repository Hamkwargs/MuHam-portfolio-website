/** ของตกแต่งตามเดือนที่มุมข้างโซฟา (ใต้กรอบรูป): ปกติมีรองเท้า 2 คู่ · เดือนสำคัญเปลี่ยนเป็นของประจำเดือน
 *  ทดสอบโดยเติม ?season=oct (jan|feb|apr|jun|oct|dec|default) ที่ท้าย URL */
import * as THREE from 'three';
import { scene } from './core';
import { box } from './helpers';
import { vpixels } from './modules/vox';

const SPOT = { x: 2.55, z: -2.15 };
const g = new THREE.Group(); g.position.set(SPOT.x, 0, SPOT.z); scene.add(g);
const bangkokMonth = () => parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', month: 'numeric' }).format(new Date()), 10);
const MONTHS: Record<string, number> = { jan: 1, feb: 2, apr: 4, jun: 6, oct: 10, dec: 12 };
const q = new URLSearchParams(location.search).get('season');
const month = q ? (MONTHS[q] ?? 0) : bangkokMonth();

function shoes() {
  const pair = (x: number, z: number, ry: number, up: number, sole: number, lace: number) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry;
    [-0.055, 0.055].forEach(dx => { box(dx, 0.02, 0, 0.09, 0.04, 0.26, sole, { parent: s }); box(dx, 0.06, 0.03, 0.08, 0.05, 0.18, up, { parent: s }); box(dx, 0.1, -0.03, 0.075, 0.07, 0.09, up, { parent: s }); box(dx, 0.085, 0.07, 0.05, 0.01, 0.05, lace, { parent: s }); }); g.add(s); };
  pair(-0.2, 0.05, 0.25, 0xf2efe6, 0xd8d3c4, 0xd23a2f); pair(0.15, -0.12, -0.35, 0x6b3f22, 0x2b1a10, 0xd6c49a);
}
const glowMat = (c: number) => ({ e: c, ei: 1.1, cs: false } as const);
function pumpkin() {
  const p = new THREE.Group(); p.position.y = 0.1; g.add(p); box(0, 0.12, 0, 0.3, 0.24, 0.26, 0xe0701c, { r: 0.7, parent: p }); box(-0.12, 0.12, 0.01, 0.08, 0.24, 0.27, 0xc85a10, { parent: p }); box(0.12, 0.12, 0.01, 0.08, 0.24, 0.27, 0xc85a10, { parent: p }); box(0, 0.27, 0, 0.045, 0.06, 0.045, 0x3f6b24, { parent: p });
  [[-0.07, 0.15], [0.07, 0.15]].forEach(([x, y]) => box(x, y, 0.135, 0.05, 0.05, 0.01, 0xffd27a, { ...glowMat(0xffa21f), parent: p })); box(0, 0.06, 0.135, 0.14, 0.04, 0.01, 0xffd27a, { ...glowMat(0xffa21f), parent: p });
  const l = new THREE.PointLight(0xff9a3a, 0.5, 1.6, 1.6); l.position.set(0, 0.2, 0.2); p.add(l);
}
function tree() {
  [[0.3, 0.07, 0x2f7a3a], [0.24, 0.17, 0x358a42], [0.18, 0.27, 0x3d9a4a], [0.1, 0.36, 0x49aa55]].forEach(([w, y, c]) => box(0, y + 0.06, 0, w, 0.1, w, c, { parent: g })); box(0, 0.025, 0, 0.06, 0.06, 0.06, 0x5a3520, { parent: g });
  box(0, 0.5, 0, 0.05, 0.05, 0.05, 0xffe066, { ...glowMat(0xffd54a), parent: g }); [[0.1, 0.16, 0.1, 0xd23a2f], [-0.09, 0.26, 0.09, 0x4aa8f0], [0.07, 0.34, -0.06, 0xffe066], [-0.1, 0.14, -0.08, 0xff9ec0], [0.03, 0.27, 0.1, 0xd23a2f]].forEach(([x, y, z, c]) => box(x, y + 0.06, z, 0.025, 0.025, 0.025, c as number, { ...glowMat(c as number), parent: g }));
}
function gifts() {
  const gift = (x: number, y: number, s: number, c: number, r: number, ry: number) => { const t = new THREE.Group(); t.position.set(x, y, 0); t.rotation.y = ry; g.add(t); box(0, s / 2, 0, s, s, s, c, { parent: t }); box(0, s / 2, 0, s + 0.004, s + 0.004, 0.03, r, { parent: t }); box(0, s / 2, 0, 0.03, s + 0.004, s + 0.004, r, { parent: t }); box(0, s + 0.02, 0, 0.07, 0.04, 0.03, r, { parent: t }); };
  gift(-0.08, 0, 0.26, 0xd23a2f, 0xffe066, 0.2); gift(0.17, 0, 0.18, 0x2f6fd0, 0xf2efe6, -0.3); gift(0.02, 0.26, 0.15, 0x3d9a4a, 0xffe066, 0.5);
}
function chocolates() {
  const b = new THREE.Group(); b.position.y = 0.0; g.add(b); const P = { p: 0xff7fa8 }, D = 0xe83b7c;
  vpixels(b, ['.pp.pp.', 'ppppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'], { p: P.p }, 0.045, 0.06, 0, 0.16, 0, { r: 0.6 }); b.rotation.x = -Math.PI / 2 + 0.0; b.position.y = 0.03; b.children[0].position.set(0, 0, 0.03);
  const inner = new THREE.Group(); inner.position.y = 0.065; b.parent!.add(inner); vpixels(inner, ['.d.d.d.', 'ddddddd', 'ddddddd', '.ddddd.', '..ddd..', '...d...'], { d: 0x4a2a18 }, 0.036, 0.02, 0, 0, 0, { r: 0.8 }); inner.rotation.x = -Math.PI / 2; inner.position.set(0, 0.075, 0);
  const lid = new THREE.Group(); lid.position.set(0, 0.07, -0.14); lid.rotation.x = -1.05; g.add(lid); vpixels(lid, ['.pp.pp.', 'ppppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'], { p: D }, 0.05, 0.015, 0, 0.15, 0); box(0, 0.12, 0.01, 0.06, 0.012, 0.02, 0xffe066, { parent: lid });
  box(0.24, 0.17, -0.04, 0.012, 0.34, 0.012, 0x2f6b2f, { parent: g, rz: 0.18 }); box(0.2, 0.34, -0.04, 0.07, 0.06, 0.07, 0xd2263a, { parent: g }); box(0.2, 0.3, -0.04, 0.05, 0.04, 0.05, 0xb01a2c, { parent: g });
}
function waterGun() {
  const w = new THREE.Group(); w.position.set(0.05, 0.28, -0.2); w.rotation.set(0, 0.0, -0.28); g.add(w);
  box(0, 0, 0, 0.42, 0.1, 0.09, 0x29adff, { r: 0.5, parent: w }); box(0.16, 0.09, 0, 0.14, 0.14, 0.09, 0xffe066, { r: 0.5, parent: w }); box(-0.08, -0.1, 0, 0.06, 0.14, 0.06, 0xff4d6d, { parent: w }); box(0.24, 0.0, 0, 0.1, 0.04, 0.04, 0xf2efe6, { parent: w });
}
function prideFlag() {
  const cols = [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982]; const f = new THREE.Group(); f.position.set(0.0, 0.0, -0.18); f.rotation.z = -0.14; g.add(f);
  box(0, 0.5, 0, 0.02, 1.0, 0.02, 0xcfcfd8, { m: 0.7, parent: f }); cols.forEach((c, i) => box(0.18, 0.94 - i * 0.055, 0, 0.34, 0.055, 0.01, c, { parent: f }));
}
const pickFn = ({ 10: pumpkin, 12: tree, 1: gifts, 2: chocolates, 4: waterGun, 6: prideFlag } as Record<number, () => void>)[month];
(pickFn ?? shoes)();
