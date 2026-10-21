/** โมดูล "โต๊ะข้างประตู": กล้องมองจากมุมสูง · ขยับของได้ · โทรศัพท์+โพสต์อิท = ช่องทางติดต่อ · CV พับ → คลี่ → ดูละเอียด/ดาวน์โหลด · เก็บกุญแจ · จุดเทียน */
import * as THREE from 'three';
import gsap from 'gsap';
import { LI } from '../legacy-compat';
import { camera, scene } from '../core';
import { items, candle, TABLE, type TableItem } from '../side-table';
import { weatherState } from '../weather-state';
import { registerModule } from '../stage';
import { brackets, screenBoxObj } from '../px/util';
import { contacts } from '../data';
import { sheet } from '../ui/sheet';
import { showDialog, hideDialog } from '../ui/dialog';
import { inventory } from '../ui/inventory';

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(TABLE.y + 0.05)), pt = new THREE.Vector3();
const fill = new THREE.PointLight(0xffe2b0, 0, 3.6, 1.5); fill.position.set(TABLE.x - 0.7, 2.1, TABLE.cz); scene.add(fill);
let ready = false, hover: TableItem | null = null, drag: { it: TableItem; off: THREE.Vector3; moved: boolean; sx: number; sy: number } | null = null, lit = false;
const setRay = (cx: number, cy: number) => { ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); };
let lastHit: THREE.Intersection | null = null;
function pick(cx: number, cy: number): TableItem | null {
  setRay(cx, cy); const live = items.filter(i => i.group.visible), h = ray.intersectObjects(live.map(i => i.group), true); lastHit = h[0] ?? null; if (!h.length) return null;
  let o: THREE.Object3D | null = h[0].object; while (o && !live.some(i => i.group === o)) o = o.parent; return live.find(i => i.group === o) ?? null;
}
const clampOk = (x: number, z: number) => x > TABLE.minX && x < TABLE.maxX && z > TABLE.minZ && z < TABLE.maxZ;
const isDark = () => weatherState.isNight || weatherState.mood === 'dusk';

function light(on: boolean) {
  if (on === lit) return; lit = on;
  if (on) { candle.flame.visible = true; gsap.to(candle.light, { intensity: 0.9 * LI, duration: 0.6 }); }
  else { gsap.to(candle.light, { intensity: 0, duration: 0.3, onComplete: () => { candle.flame.visible = false; } }); smoke(); }
}
function smoke() {
  const p = new THREE.Vector3(); candle.flame.getWorldPosition(p);
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xb9b2bd, transparent: true, opacity: 0.7 })); m.position.copy(p); scene.add(m);
    gsap.to(m.position, { y: p.y + 0.5 + Math.random() * 0.2, x: p.x + (Math.random() - 0.5) * 0.14, z: p.z + (Math.random() - 0.5) * 0.14, duration: 2.6, delay: i * 0.14, ease: 'sine.out' });
    gsap.to(m.scale, { x: 2.6, y: 2.6, z: 2.6, duration: 2.6, delay: i * 0.14 }); gsap.to(m.material, { opacity: 0, duration: 2.6, delay: i * 0.14, onComplete: () => { scene.remove(m); m.geometry.dispose(); } });
  }
}
function contactSheet() {
  const rows = contacts.map(c => `<div class="crow"><b>${c.label}</b><span title="${c.value}">${c.value}</span><button class="sbtn ghost" data-copy="${c.value}" type="button">COPY</button><a class="sbtn" href="${c.href}" target="_blank" rel="noopener">OPEN ↗</a></div>`).join('');
  sheet.open({ kicker: 'POST-IT', title: 'Call me, maybe?', subtitle: 'All the ways to reach me', html: rows, theme: 'sticky', side: 'right', onClose: () => {} });
}
function itemClick(it: TableItem) {
  if (it.id === 'phone') contactSheet();
  else if (it.id === 'candle') light(!lit);
  else if (it.id === 'key') {
    gsap.to(it.group.position, { y: TABLE.y + 0.35, duration: 0.5, ease: 'power2.out' }); gsap.to(it.group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, onComplete: () => { it.group.visible = false; } });
    inventory.add('key', 'Old brass key'); showDialog({ name: 'ITEM', text: 'You picked up an old brass key. Maybe it opens the door next to the table?', autoHide: 4500 });
  }
}
function back() { if (sheet.isOpen) { sheet.close(); return true; } return false; }

// ---- tour: โทรศัพท์สั่นเรียกให้คลิก ----
let hintOn = false, shake: gsap.core.Timeline | null = null;
const phoneItem = () => items.find(i => i.id === 'phone')!;
function phoneHint(on: boolean) {
  const g = phoneItem().group; shake?.kill(); shake = null; g.rotation.z = 0; g.rotation.y = 0.5; hintOn = on;
  if (!on) return;
  shake = gsap.timeline({ repeat: -1, repeatDelay: 0.8 })
    .to(g.rotation, { z: 0.07, y: 0.56, duration: 0.045, repeat: 9, yoyo: true, ease: 'none' })
    .to(g.rotation, { z: 0, y: 0.5, duration: 0.06 });
}
export const deskTour = {
  phone(on: boolean) { if (ready) phoneHint(on); },
  contact() { if (!ready) return; phoneHint(false); contactSheet(); },
};

registerModule({
  id: 'desk', flightDur: 1.6,
  inner: () => sheet.isOpen,
  enter() { gsap.to(fill, { intensity: 1.0 * LI, duration: 1.2 }); },
  open() { ready = true; if (isDark()) setTimeout(() => ready && light(true), 900); },
  close() { phoneHint(false); gsap.to(fill, { intensity: 0, duration: 0.8 }); ready = false; sheet.close(); hideDialog(); light(false); hover = null; drag = null; },
  back,
  update(_dt, t) { if (lit) candle.light.intensity = (0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 5.3) * 0.06) * LI; },
  pointer(kind, _x, _y, ev) {
    if (!ready || sheet.isOpen) return false;
    if (kind === 'move') {
      if (drag) {
        if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 5) drag.moved = true;
        if (drag.moved) { setRay(ev.clientX, ev.clientY); if (ray.ray.intersectPlane(plane, pt)) { const nx = pt.x + drag.off.x, nz = pt.z + drag.off.z; if (clampOk(nx, nz)) drag.it.group.position.set(nx, TABLE.y + 0.05, nz); } }
        document.body.style.cursor = 'grabbing'; return true;
      }
      hover = pick(ev.clientX, ev.clientY); document.body.style.cursor = hover ? 'grab' : 'default';
    } else if (kind === 'down') {
      const it = pick(ev.clientX, ev.clientY); if (!it) return false; if (it.id === 'phone') phoneHint(false); setRay(ev.clientX, ev.clientY); const off = new THREE.Vector3();
      if (ray.ray.intersectPlane(plane, pt)) off.set(it.group.position.x - pt.x, 0, it.group.position.z - pt.z); drag = { it, off, moved: false, sx: ev.clientX, sy: ev.clientY }; return true;
    } else if (kind === 'up') {
      if (drag) { const d = drag; drag = null; d.it.group.position.y = TABLE.y; if (!d.moved) { itemClick(d.it); swallow = true; } else swallow = true; }
    } else if (kind === 'click') { if (swallow) { swallow = false; return true; } return !!pick(ev.clientX, ev.clientY); }
    return false;
  },
  draw(c, w, h) {
    if (!ready || sheet.isOpen) return;
    items.filter(i => i.group.visible).forEach(i => { const r = screenBoxObj(i.group, w, h), act = hover === i; const hint = hintOn && i.id === 'phone'; if (act || hint) brackets(c, r, hint ? 'Click · call me, maybe?' : i.label.toUpperCase(), true); });
  },
});
let swallow = false;
