/** โมดูล "บอร์ดจริง": ซูมเข้าบอร์ดในฉาก มี 3 กลุ่มกระดาษ — hover = กรอบล้อม (ไม่เรืองแสง) · คลิก = เปิดกระดาษบันทึก (HTML) + โพลารอยด์ */
import * as THREE from 'three';
import { camera } from '../core';
import { flyTo } from '../rig';
import { SHOTS } from '../shots';
import { registerModule } from '../stage';
import { boardGroups, type BoardGroup } from '../board-items';
import { screenBox, brackets } from '../px/util';
import { education, experience, profile } from '../data';
import type { Doc } from '../doc';
import { sheet } from '../ui/sheet';
import { polaroid } from '../ui/polaroid';
import { inside } from '../px/pixel';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let ready = false, hover: BoardGroup | null = null, current: BoardGroup | null = null, pend = 0;
const rects = new Map<string, { x: number; y: number; w: number; h: number }>();

function pick(cx: number, cy: number) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(boardGroups.map(g => g.hit), false)[0]; return boardGroups.find(g => g.hit === hit?.object) ?? null;
}
/** รายการโพลารอยด์ที่เลื่อนได้: ใส่กี่รูปก็ได้ (4, 8, 20 …) — เกิน 4 ใบจะย่อขนาดอัตโนมัติ + มี scroll + ใช้ลูกศรเลื่อนได้ */
interface TL { n: number; sel: number; select(i: number): void }
let tl: TL | null = null;
const stackOf = (kids: HTMLElement[], n = kids.length) => {
  const stack = document.createElement('div'); stack.className = 'pola-stack'; const grid = document.createElement('div'); grid.className = 'pola-grid';
  stack.style.setProperty('--ps', String(n <= 4 ? 1 : n <= 6 ? 0.82 : n <= 9 ? 0.68 : n <= 16 ? 0.56 : 0.46)); grid.append(...kids); stack.append(grid); return stack;
};
function timeline(items: Doc[], kicker: string, g: BoardGroup) {
  void g; const tilts = [-4, 3, -2, 5, -3];
  if (!items.length) { tl = null; sheet.open({ kicker, title: 'Nothing here yet', html: '<p>Add files to this section (see HOW-TO-ADD-CONTENT.md) and they will show up here automatically.</p>', onClose: () => back() }); return; }
  let sel = 0;
  const polas = items.map((d, i) => polaroid({ photo: d.meta.photo, caption: d.meta.caption || d.meta.title, seed: d.id, tilt: tilts[i % 5], onClick: () => select(i) }));
  const view = (i: number) => { const d = items[i]; return { kicker: `${kicker} · ${i + 1}/${items.length}`, title: d.meta.title, subtitle: [d.meta.school || d.meta.company, d.meta.period].filter(Boolean).join(' · '), html: d.body }; };
  const select = (i: number) => {
    sel = (i + items.length) % items.length; if (tl) tl.sel = sel;
    polas.forEach((p, k) => p.classList.toggle('sel', k === sel)); sheet.update(view(sel)); polas[sel].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };
  polas[0].classList.add('sel'); tl = { n: items.length, sel: 0, select };
  sheet.open({ ...view(0), left: stackOf(polas), onClose: () => back() });
}
function profileSheet() {
  let pix = false;
  const p = polaroid({ photo: profile.photo, caption: profile.name, seed: 'profile', tilt: -3, pixel: false, onClick: () => { pix = !pix; p.querySelector('img')!.classList.toggle('px', pix); } });
  p.style.width = '230px'; (p.querySelector('img') as HTMLElement).style.cssText = 'width:214px;height:230px'; const left = stackOf([p], 1);
  sheet.open({ kicker: `PLAYER 1 · LEVEL ${profile.level}`, title: profile.name, subtitle: `${profile.role} · ${profile.cls}`, html: `<p><em>${esc(profile.tagline ?? '')}</em></p>` + profile.body, left, stamp: 'ACCESS GRANTED', onClose: () => back() });
}
function openGroup(g: BoardGroup) {
  current = g; hover = null; tl = null; flyTo({ pos: g.shot.pos, look: g.shot.look, parallax: 0.02 }, { dur: 0.9 });
  clearTimeout(pend); pend = window.setTimeout(() => { if (g.id === 'profile') profileSheet(); else if (g.id === 'edu') timeline(education, 'EDUCATION', g); else timeline(experience, 'EXPERIENCE', g); }, 650);
}
function back(): boolean {
  if (!current) return false; clearTimeout(pend); const was = sheet.isOpen || true; sheet.close(); current = null; tl = null; flyTo(SHOTS.board.focus, { dur: 0.9 }); return was;
}

/** ให้ tour สั่งเปลี่ยนมุมมองบอร์ด: overview / profile / edu / exp */
export const boardTour = {
  show(id: 'overview' | BoardGroup['id']) {
    if (!ready) return;
    clearTimeout(pend);
    if (id === 'overview') { if (current) back(); return; }
    const g = boardGroups.find(x => x.id === id); if (!g) return;
    sheet.close(); openGroup(g);
  },
};

registerModule({
  id: 'board', flightDur: 1.4,
  inner: () => !!current,
  open() { ready = true; current = null; },
  close() { ready = false; clearTimeout(pend); sheet.close(); current = null; hover = null; tl = null; },
  key(e) {
    if (!tl || tl.n < 2) return false;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { tl.select(tl.sel + 1); e.preventDefault(); return true; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { tl.select(tl.sel - 1); e.preventDefault(); return true; }
    return false;
  },
  back,
  pointer(kind, x, y, ev) {
    if (!ready || current) return kind === 'click' && !!current;
    if (kind === 'move') { hover = pick(ev.clientX, ev.clientY); document.body.style.cursor = hover ? 'pointer' : 'default'; }
    else if (kind === 'click') { const g = pick(ev.clientX, ev.clientY); if (g) { openGroup(g); return true; } }
    void x; void y; void inside;
  },
  draw(c, w, h) {
    if (!ready || current) return;
    boardGroups.forEach(g => { const r = screenBox(g.hit, w, h); rects.set(g.id, r); brackets(c, r, g.label, hover === g); });
  },
});
