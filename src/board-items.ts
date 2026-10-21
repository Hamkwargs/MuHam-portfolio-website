/** กระดาษบนบอร์ดจริง: 3 กลุ่ม (กลางบน = โปรไฟล์ · ซ้ายล่าง = การศึกษา · ขวาล่าง = ประสบการณ์) ผสมรูปถ่าย/ใบเสร็จ/เอกสาร/โน้ต/สมุดจด */
import * as THREE from 'three';
import { box } from './helpers';
import { boardGroup, boardX, redStringMat } from './furniture';
import { placeholderCanvas, pixelate } from './ui/art';
import { profile } from './data';

const X = boardX + 0.045;                                  // ผิวบอร์ด
const tex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; return t;
};
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const lines = (c: CanvasRenderingContext2D, x: number, y: number, w: number, n: number, col: string, gap = 3) => { c.fillStyle = col; for (let i = 0; i < n; i++) c.fillRect(x, y + i * gap, w - (rnd() > 0.6 ? Math.floor(rnd() * 8) : 0), 1); };

const T = {
  receipt: () => tex(14, 40, c => { c.fillStyle = '#f4f1e6'; c.fillRect(0, 0, 14, 40); lines(c, 2, 4, 10, 4, '#3a3340'); c.fillStyle = '#3a3340'; c.fillRect(2, 18, 10, 1); lines(c, 2, 21, 10, 7, '#6b6475'); c.fillStyle = '#1d1526'; for (let i = 0; i < 9; i++) c.fillRect(2 + i + (i & 1), 33, 1, 4);
    c.clearRect(0, 38, 14, 2); for (let i = 0; i < 14; i += 2) c.clearRect(i, 37, 1, 1); }),
  document: (stamp = '#b3322a') => tex(30, 40, c => { c.fillStyle = '#eee6cf'; c.fillRect(0, 0, 30, 40); c.fillStyle = '#1d2b53'; c.fillRect(3, 3, 14, 3); lines(c, 3, 9, 24, 12, '#6b6475', 3); c.strokeStyle = stamp; c.lineWidth = 1; c.strokeRect(17.5, 28.5, 9, 7); c.fillStyle = stamp; c.fillRect(19, 31, 6, 1); }),
  sticky: (col: string) => tex(20, 20, c => { c.fillStyle = col; c.fillRect(0, 0, 20, 20); lines(c, 3, 5, 14, 5, 'rgba(30,20,10,.55)', 3); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, 17, 20, 3); }),
  notebook: (cover: string) => tex(24, 30, c => { c.fillStyle = cover; c.fillRect(0, 0, 24, 30); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, 3, 30); c.fillStyle = '#efe3c2'; c.fillRect(6, 5, 14, 9); lines(c, 8, 8, 10, 3, '#463427', 3); c.fillStyle = '#d6c49a'; for (let i = 0; i < 6; i++) c.fillRect(0, 3 + i * 5, 3, 2); }),
  ticket: () => tex(32, 20, c => { c.fillStyle = '#f2d98a'; c.fillRect(0, 0, 32, 20); c.fillStyle = '#7e2553'; c.fillRect(0, 0, 32, 5); lines(c, 3, 9, 18, 3, '#463427', 3); c.fillStyle = '#463427'; for (let i = 0; i < 7; i++) c.fillRect(23 + i, 9, 1, 8); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, 17, 32, 3); }),
  photo: (name: string) => tex(24, 30, c => { c.fillStyle = '#f7f2e4'; c.fillRect(0, 0, 24, 30); c.drawImage(placeholderCanvas(name, 20, 20), 2, 2); lines(c, 4, 25, 12, 1, '#1f3a8a'); }),
};
const T2 = {
  map: () => tex(40, 32, c => { c.fillStyle = '#d9cfa8'; c.fillRect(0, 0, 40, 32); c.strokeStyle = '#9a8c62'; c.lineWidth = 1; for (let i = 0; i <= 40; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 32); c.stroke(); } for (let j = 0; j <= 32; j += 8) { c.beginPath(); c.moveTo(0, j); c.lineTo(40, j); c.stroke(); }
    c.strokeStyle = '#3a6ea5'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 22); c.bezierCurveTo(12, 14, 24, 28, 40, 12); c.stroke(); c.fillStyle = '#b3322a'; c.fillRect(24, 14, 3, 3); c.fillStyle = '#463427'; c.fillRect(6, 4, 10, 1); }),
  clip: () => tex(16, 34, c => { c.fillStyle = '#e4dcc4'; c.fillRect(0, 0, 16, 34); c.fillStyle = '#1d1526'; c.fillRect(2, 2, 12, 4); for (let i = 0; i < 6; i++) lines(c, 2, 9 + i * 4, 12, 2, '#6b6475', 1); c.fillStyle = '#9a9380'; c.fillRect(2, 10, 12, 9); }),
  stain: () => tex(24, 24, c => { c.clearRect(0, 0, 24, 24); c.strokeStyle = 'rgba(70,40,18,.55)'; c.lineWidth = 2; c.beginPath(); c.arc(12, 12, 8, 0, 6.3); c.stroke(); c.fillStyle = 'rgba(70,40,18,.18)'; c.beginPath(); c.arc(12, 12, 8, 0, 6.3); c.fill(); }),
  card: () => tex(28, 16, c => { c.fillStyle = '#f0ead8'; c.fillRect(0, 0, 28, 16); c.fillStyle = '#7e2553'; c.fillRect(2, 2, 8, 3); lines(c, 2, 8, 22, 3, '#6b6475', 3); }),
};
const tape = (z: number, y: number, rot = 0.2) => { const t = box(X + 0.02, y, z, 0.006, 0.04, 0.08, 0xe9d98a, { a: 0.75, r: 1, rx: rot, cs: false, parent: boardGroup }); return t; };
const paper = (kind: string, z: number, y: number, w: number, h: number, map: THREE.Texture, rot = 0, layer = 0, pin = true) => {
  const m = box(X + layer * 0.004, y, z, 0.01, h, w, 0xffffff, { map, r: 1, rx: rot, parent: boardGroup }); m.userData.kind = kind;
  if (pin) box(X + 0.012 + layer * 0.004, y + h * 0.4, z, 0.016, 0.026, 0.026, [0xd02020, 0x2f6fd0, 0xe0b020][Math.floor(rnd() * 3)], { parent: boardGroup });
  return m;
};
const thread = (a: THREE.Vector3, b: THREE.Vector3) => {
  const mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= 0.03; const pts = [a, mid, b];
  for (let i = 0; i < 2; i++) { const d = pts[i].distanceTo(pts[i + 1]); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, d, 5), redStringMat); s.position.copy(pts[i]).add(pts[i + 1]).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pts[i + 1].clone().sub(pts[i]).normalize()); boardGroup.add(s); }
};

// กลุ่มที่ 1 (กลางบน): โปรไฟล์ — รูปหน้าแบบ pixel แปะอยู่
const P = { z: 0.0, y: 2.27 };
const profTex = T.photo('profile'); const photoMesh = paper('photo', P.z, P.y + 0.01, 0.3, 0.37, profTex, 0.03, 2);
if (profile.photo) pixelate(profile.photoPixel ?? profile.photo, 40).then(url => { const im = new Image(); im.onload = () => { const c = (profTex.image as HTMLCanvasElement).getContext('2d')!; c.fillStyle = '#f7f2e4'; c.fillRect(0, 0, 24, 30); c.imageSmoothingEnabled = false; c.drawImage(im, 2, 2, 20, 20 * im.height / im.width > 22 ? 22 : 20 * im.height / im.width); profTex.needsUpdate = true; }; im.src = url; });
paper('sticky', P.z + 0.3, P.y + 0.12, 0.14, 0.14, T.sticky('#ffd23f'), -0.15, 1);
paper('receipt', P.z - 0.28, P.y - 0.03, 0.1, 0.34, T.receipt(), 0.07, 1);
paper('notebook', P.z + 0.34, P.y - 0.1, 0.16, 0.2, T.notebook('#2f5fb8'), 0.2, 1);
paper('ticket', P.z - 0.3, P.y + 0.15, 0.2, 0.125, T.ticket(), -0.1, 2);
// กลุ่มที่ 2 (ซ้ายล่าง ตามมุมกล้อง = +z): การศึกษา
const E = { z: 0.55, y: 1.58 };
paper('document', E.z + 0.02, E.y + 0.02, 0.3, 0.4, T.document('#1d5d36'), -0.04, 0);
paper('photo', E.z - 0.2, E.y - 0.08, 0.2, 0.25, T.photo('edu'), 0.14, 1);
paper('notebook', E.z + 0.25, E.y - 0.07, 0.17, 0.21, T.notebook('#2f8f5b'), -0.12, 1);
paper('sticky', E.z + 0.17, E.y + 0.2, 0.12, 0.12, T.sticky('#ff9ec0'), 0.2, 2);
paper('receipt', E.z - 0.27, E.y + 0.1, 0.09, 0.26, T.receipt(), -0.08, 1.5);
// กลุ่มที่ 3 (ขวาล่าง = -z): ประสบการณ์ทำงาน
const W2 = { z: -0.55, y: 1.58 };
paper('document', W2.z - 0.04, W2.y + 0.02, 0.3, 0.4, T.document('#b3322a'), 0.05, 0);
paper('ticket', W2.z + 0.22, W2.y - 0.12, 0.22, 0.14, T.ticket(), -0.2, 1);
paper('photo', W2.z - 0.26, W2.y - 0.06, 0.2, 0.25, T.photo('exp'), -0.12, 1);
paper('sticky', W2.z + 0.2, W2.y + 0.2, 0.12, 0.12, T.sticky('#ffd23f'), -0.18, 2);
paper('notebook', W2.z + 0.06, W2.y - 0.16, 0.15, 0.19, T.notebook('#b3322a'), 0.1, 2);
// เชือกแดง: โปรไฟล์ → การศึกษา/ประสบการณ์
const pin = (z: number, y: number) => new THREE.Vector3(X + 0.03, y, z);
thread(pin(P.z + 0.1, P.y - 0.17), pin(E.z + 0.02, E.y + 0.2)); thread(pin(P.z - 0.1, P.y - 0.17), pin(W2.z - 0.04, W2.y + 0.2));

// ของประกอบรอบ ๆ ให้บอร์ดไม่โล่ง (แผนที่ ข่าวตัดแปะ นามบัตร คราบกาแฟ เทป) — กระจายแบบไม่ซ้ำแพทเทิร์น
paper('map', 0.86, 2.2, 0.36, 0.28, T2.map(), 0.12, 0); tape(0.86, 2.34, 0.3);
paper('clip', -0.88, 2.2, 0.1, 0.22, T2.clip(), -0.1, 0); paper('clip', -0.78, 2.32, 0.08, 0.17, T2.clip(), 0.2, 1, false);
paper('card', 0.2, 1.3, 0.14, 0.08, T2.card(), -0.15, 1, false); paper('clip', 0.0, 1.45, 0.07, 0.15, T2.clip(), 0.12, 0, false);
paper('sticky', -1.0, 1.45, 0.1, 0.1, T.sticky('#9be3ff'), 0.25, 0); paper('sticky', 0.98, 1.5, 0.11, 0.11, T.sticky('#c8ffb0'), -0.2, 0);
paper('receipt', 0.92, 1.9, 0.08, 0.22, T.receipt(), -0.15, 0, false);
box(X + 0.004, 1.36, -0.05, 0.004, 0.2, 0.2, 0xffffff, { map: T2.stain(), a: 1, r: 1, cs: false, parent: boardGroup });
tape(E.z + 0.02, E.y + 0.2, -0.2); tape(W2.z - 0.04, W2.y + 0.2, 0.25); tape(P.z, P.y + 0.19, 0.05);
// เชือกภายในกลุ่ม (2–3 เส้นต่อกลุ่ม)
thread(pin(P.z + 0.3, P.y + 0.19), pin(P.z - 0.28, P.y + 0.12)); thread(pin(P.z - 0.28, P.y + 0.12), pin(P.z + 0.34, P.y - 0.04));
thread(pin(E.z - 0.2, E.y + 0.06), pin(E.z + 0.17, E.y + 0.24)); thread(pin(E.z + 0.17, E.y + 0.24), pin(E.z + 0.25, E.y - 0.02)); thread(pin(E.z - 0.27, E.y + 0.22), pin(E.z - 0.2, E.y + 0.06));
thread(pin(W2.z - 0.26, W2.y + 0.07), pin(W2.z + 0.2, W2.y + 0.24)); thread(pin(W2.z + 0.2, W2.y + 0.24), pin(W2.z + 0.22, W2.y - 0.05));
thread(pin(E.z - 0.1, E.y - 0.2), pin(W2.z + 0.1, W2.y - 0.2));            // เส้นเชื่อมการศึกษา ↔ ประสบการณ์

/** พื้นที่คลิกของแต่ละกลุ่ม (โปร่งใส) */
export interface BoardGroup { id: 'profile' | 'edu' | 'exp'; label: string; hit: THREE.Mesh; center: THREE.Vector3; shot: { pos: THREE.Vector3; look: THREE.Vector3 } }
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const mk = (id: BoardGroup['id'], label: string, z: number, y: number, w: number, h: number): BoardGroup => {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, w), hitMat); hit.position.set(X + 0.03, y, z); boardGroup.add(hit);
  const c = new THREE.Vector3(X, y, z); return { id, label, hit, center: c, shot: { pos: new THREE.Vector3(X + 1.9, y, z * 0.85), look: c } };
};
export const boardGroups: BoardGroup[] = [mk('profile', 'PROFILE', P.z, P.y, 0.9, 0.5), mk('edu', 'EDUCATION', E.z, E.y, 0.8, 0.6), mk('exp', 'EXPERIENCE', W2.z, W2.y, 0.8, 0.6)];
export const profilePhoto = photoMesh;
