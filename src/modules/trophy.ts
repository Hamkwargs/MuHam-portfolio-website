/** โมดูล "ถ้วยรางวัล": ซ้าย = ถ้วย voxel 3D ทีละถ้วย (หมุน carousel ได้, ถ้ามี >3 ถ้วยจะสุ่มลำดับ) · ขวา = กระดาษบันทึก HTML · โพลารอยด์ข้างถ้วย (ถ้ามีรูป) */
import * as THREE from 'three';
import gsap from 'gsap';
import { LI } from '../legacy-compat';
import { registerModule, closeModule } from '../stage';
import { awards, docSheets } from '../data';
import { assetUrl } from '../assets';
import type { Doc } from '../doc';
import { sheet } from '../ui/sheet';
import { polaroid } from '../ui/polaroid';
import { vbox, vpixels } from './vox';

const canvas = document.createElement('canvas');
canvas.id = 'trophy-canvas'; document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.setClearColor(0x120d14, 0.72); renderer.setPixelRatio(1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 60); camera.position.set(0, 2.1, 10.4); camera.lookAt(0, 1.2, 0);
scene.add(new THREE.AmbientLight(0xffddab, 0.55 * LI));
const key = new THREE.DirectionalLight(0xffe2a8, 1.25 * LI); key.position.set(-2, 4, 5); scene.add(key);
const rim = new THREE.PointLight(0x7fd0ff, 0.8 * LI, 14); rim.position.set(3, 2, -2); scene.add(rim);
const warm = new THREE.PointLight(0xffa24f, 0.7 * LI, 12); warm.position.set(0, 1.4, 3.2); scene.add(warm);
const GOLD = 0xd9962a, GOLD2 = 0xf0c24a, GOLD3 = 0xa8701a, WOOD = 0x5a3520, WOOD2 = 0x34200f;

function pedestal(g: THREE.Group) {
  vbox(g, 1.3, 0.22, 1.3, WOOD2, 0, 0.11, 0); vbox(g, 1.1, 0.16, 1.1, WOOD, 0, 0.3, 0); vbox(g, 0.7, 0.07, 0.04, GOLD2, 0, 0.3, 0.57, { m: 0.6 });
}
function buildCup(g: THREE.Group) {
  pedestal(g); const m = { m: 0.65, r: 0.3 };
  vbox(g, 0.7, 0.1, 0.7, GOLD3, 0, 0.42, 0, m); vbox(g, 0.22, 0.5, 0.22, GOLD, 0, 0.72, 0, m); vbox(g, 0.4, 0.1, 0.4, GOLD3, 0, 0.99, 0, m);
  [[0.6, 1.1], [0.78, 1.26], [0.94, 1.42], [1.04, 1.58], [1.1, 1.74]].forEach(([w, y], i) => vbox(g, w, 0.17, w, i % 2 ? GOLD2 : GOLD, 0, y, 0, m));
  [-1, 1].forEach(s => { vbox(g, 0.12, 0.5, 0.12, GOLD, s * 0.66, 1.46, 0, m); vbox(g, 0.18, 0.12, 0.12, GOLD, s * 0.58, 1.74, 0, m); vbox(g, 0.18, 0.12, 0.12, GOLD, s * 0.58, 1.2, 0, m); });
  vpixels(g, ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'], { y: 0xffffff }, 0.07, 0.04, 0, 1.58, 0.57, { m: 0.2, r: 0.4 });
}
function buildStar(g: THREE.Group) {
  pedestal(g); vbox(g, 0.28, 0.9, 0.28, GOLD3, 0, 0.85, 0, { m: 0.6 });
  vpixels(g, ['....y....', '....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '..yyyyy..', '.yyy.yyy.', '.yy...yy.'], { y: GOLD2 }, 0.17, 0.2, 0, 2.0, 0, { m: 0.5, r: 0.35 });
  vpixels(g, ['....y....', '...yyy...', '..yyyyy..', '...yyy...', '..yy.yy..'], { y: GOLD }, 0.17, 0.24, 0, 2.2, 0, { m: 0.5, r: 0.35 });
}
function buildMedal(g: THREE.Group) {
  pedestal(g); vbox(g, 0.12, 1.5, 0.12, WOOD, 0, 1.05, -0.2); vbox(g, 0.8, 0.1, 0.3, WOOD, 0, 1.78, -0.2);
  [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) vbox(g, 0.12, 0.14, 0.04, s > 0 ? 0xd23a2f : 0x4a74c9, s * (0.3 - i * 0.07), 1.7 - i * 0.14, 0.0); });
  const disc = ['..yyyyy..', '.yyyyyyy.', 'yyyyyyyyy', 'yyyyyyyyy', 'yyyyyyyyy', 'yyyyyyyyy', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..'];
  vpixels(g, disc, { y: GOLD3 }, 0.12, 0.14, 0, 1.0, 0.02, { m: 0.7, r: 0.3 });
  vpixels(g, disc.map(r => r.replace(/y/g, 'y').slice(0)), { y: GOLD }, 0.1, 0.12, 0, 1.0, 0.1, { m: 0.7, r: 0.3 });
  vpixels(g, ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'], { y: 0xfff1b5 }, 0.09, 0.06, 0, 1.0, 0.18, { m: 0.2 });
}
function certTexture(d: Doc) {
  const cv = document.createElement('canvas'); cv.width = 132; cv.height = 88; const x = cv.getContext('2d')!;
  const paint = () => { x.fillStyle = '#f4ecd6'; x.fillRect(0, 0, 132, 88); x.strokeStyle = '#b8913a'; x.lineWidth = 2; x.strokeRect(3, 3, 126, 82); x.lineWidth = 1; x.strokeRect(7, 7, 118, 74);
    x.fillStyle = '#463427'; x.textAlign = 'center'; x.font = 'bold 9px "Pixelify Sans", Georgia, serif'; x.fillText('CERTIFICATE', 66, 22); x.font = 'bold 8px "Pixelify Sans", Georgia, serif';
    const words = (d.meta.title || '').split(' '); let line = '', y = 40; words.forEach(w => { if ((line + w).length > 20) { x.fillText(line.trim(), 66, y); y += 11; line = ''; } line += w + ' '; }); x.fillText(line.trim(), 66, y);
    x.font = '6px Inter, sans-serif'; x.fillStyle = '#6b5a3e'; x.fillText([d.meta.issuer, d.meta.date].filter(Boolean).join(' · '), 66, 74); x.fillStyle = '#b3322a'; x.beginPath(); x.arc(108, 66, 7, 0, 7); x.fill(); };
  paint(); const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter;
  const url = assetUrl(d.meta.image); if (url) { const im = new Image(); im.onload = () => { x.drawImage(im, 0, 0, 132, 88); t.needsUpdate = true; }; im.src = url; }
  document.fonts?.ready.then(() => { if (!url) { paint(); t.needsUpdate = true; } }); return t;
}
function buildCert(g: THREE.Group, d: Doc) {
  vbox(g, 1.0, 0.07, 0.5, WOOD2, 0, 0.035, 0); vbox(g, 0.07, 0.8, 0.05, WOOD, -0.38, 0.4, -0.12, {}); vbox(g, 0.07, 0.8, 0.05, WOOD, 0.38, 0.4, -0.12);
  const f = new THREE.Group(); f.position.set(0, 1.0, 0.04); f.rotation.x = -0.12; g.add(f);
  vbox(f, 1.5, 1.05, 0.08, WOOD, 0, 0, 0); vbox(f, 1.36, 0.91, 0.09, 0xefe7d2, 0, 0, 0.004);
  const t = certTexture(d); const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.5 })); m.position.z = 0.05; f.add(m); g.scale.setScalar(1.3);
}
const ring = new THREE.Group(); scene.add(ring);
let order: Doc[] = [], items: THREE.Group[] = [], step = 0, ready = false, R = 3.4, lock = 0, rotating = false;
const N = () => order.length, sel = () => ((step % N()) + N()) % N();

function build() {
  ring.clear(); items = [];
  order = [...awards, ...docSheets]; if (order.length > 3) for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }   // มากกว่า 3 ถ้วย → สุ่มลำดับทุกครั้งที่เปิด
  R = Math.max(3.4, order.length * 0.9); ring.position.z = -R; ring.rotation.y = 0; step = 0;
  order.forEach((d, i) => {
    const g = new THREE.Group(); if (docSheets.includes(d)) buildCert(g, d); else (d.meta.kind === 'star' ? buildStar : d.meta.kind === 'medal' ? buildMedal : buildCup)(g);
    const a = (i / order.length) * Math.PI * 2; g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); items.push(g); ring.add(g);
  });
}
function size() {
  const w = innerWidth, h = innerHeight, k = 3; renderer.setSize(Math.floor(w / k), Math.floor(h / k), false); canvas.style.width = '100vw'; canvas.style.height = '100vh';
  camera.aspect = w / h; const shift = innerWidth > 900 ? 0.2 : 0; camera.setViewOffset(w, h, w * shift, 0, w, h); camera.updateProjectionMatrix();   // ดันถ้วยไปอยู่ครึ่งซ้ายของจอ
}
addEventListener('resize', size); size();

function view(i: number) { const d = order[i], cert = docSheets.includes(d); return { kicker: `${cert ? 'CERTIFICATE' : 'AWARD'} ${i + 1} / ${order.length}`, title: d.meta.title, subtitle: [d.meta.year ?? d.meta.date, d.meta.org ?? d.meta.issuer].filter(Boolean).join(' · '), html: d.body, stamp: '' }; }
function leftUi(i: number) {
  const wrap = document.createElement('div'); wrap.className = 'trophy-left';
  const slot = document.createElement('div'); slot.className = 'trophy-slot'; wrap.append(slot);
  const nav = document.createElement('div'); nav.className = 'trophy-nav';
  const mk = (t: string, fn: () => void, title: string) => { const b = document.createElement('button'); b.className = 'sbtn'; b.textContent = t; b.title = title; b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
  const dots = document.createElement('span'); dots.className = 'trophy-dots';
  nav.append(mk('◀', () => go(-1), 'Previous trophy'), dots, mk('▶', () => go(1), 'Next trophy')); wrap.append(nav);
  paintLeft(wrap, i); return wrap;
}
/** อัปเดตเฉพาะโพลารอยด์ + จุดบอกตำแหน่ง ส่วนปุ่ม ◀ ▶ คงเดิม (ไม่ถูกสร้างใหม่) */
function paintLeft(wrap: HTMLElement, i: number) {
  const d = order[i], slot = wrap.querySelector('.trophy-slot')!, dots = wrap.querySelector('.trophy-dots')!;
  slot.replaceChildren();
  if ((d.meta.photo || d.meta.caption) && !docSheets.includes(d)) { const p = polaroid({ photo: d.meta.photo, caption: d.meta.caption || d.meta.title, seed: d.id, tilt: 5 }); p.classList.add('trophy-pola'); slot.append(p); }
  const n = order.length; dots.textContent = n <= 12 ? order.map((_, k) => (k === i ? '■' : '□')).join(' ') : `${i + 1} / ${n}`;
}
function go(d: number) {
  if (!ready || N() < 2) return; step += d; ring.rotation.y = -step * (Math.PI * 2 / N());   // สลับทันที ไม่มีอนิเมชันหมุน
  sheet.update(view(sel())); const w = sheet.left.querySelector('.trophy-left') as HTMLElement | null; if (w) paintLeft(w, sel());
}

/** ให้ tour เลือกถ้วยใบที่ i ทีละใบ */
export const trophyTour = { select(i: number) { if (ready && N() > 0) go(i - sel()); } };

registerModule({
  id: 'trophy', flightDur: 1.3,
  open() { build(); ready = true; canvas.classList.add('on'); size(); sheet.open({ ...view(0), left: leftUi(0), onClose: () => closeModule() }); },
  close() { ready = false; canvas.classList.remove('on'); sheet.close(); },
  update(_dt, t) {
    if (!ready) return;
    items.forEach((g, i) => { const front = i === sel(); g.visible = front; g.rotation.y = front ? Math.sin(t * 0.8) * 0.22 - ring.rotation.y : 0; g.position.y = front ? Math.sin(t * 1.6) * 0.04 : 0; });
    renderer.render(scene, camera);
  },
  key(e) { if (e.key === 'ArrowLeft') { go(-1); return true; } if (e.key === 'ArrowRight') { go(1); return true; } },
  pointer() { /* คลิกที่ว่าง = ออก (stage จัดการ) */ },
});
