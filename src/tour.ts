/**
 * Scroll tour: เลื่อนเมาส์/ปัดนิ้ว/กดปุ่ม → กล้องพาไปทีละ "station" และ **เปิดของให้เอง** ไม่ต้องคลิก
 *   board (ภาพรวม → Profile → Education → Experience) → trophy (ทีละใบ ช้า ๆ) → pc (เลือกโปรเจกต์เอง)
 *   → CV (มีคำใบ้ให้คลิก) → โต๊ะโทรศัพท์ (โทรศัพท์สั่น → เลื่อนต่อ = เปิดหน้า "Call me, maybe?")
 * ไม่มีระบบจำว่าดูแล้ว: เลื่อนดูซ้ำได้ตลอด
 */
import { S } from './state';
import { flyOverview } from './rig';
import { type StopId, TOUR_ORDER } from './shots';
import { stops } from './content';
import { stage, openModule, closeModule } from './stage';
import { awards, docSheets } from './data';
import { boardTour } from './modules/board';
import { trophyTour } from './modules/trophy';
import { deskTour } from './modules/desk';
import { PAL } from './px/palette';
import { panel, sprite, rect, inside, SPRITES, type Rect } from './px/pixel';

interface Step { stop: StopId; label: string; run?: () => void; slow?: boolean }
const nTrophy = Math.max(1, awards.length + docSheets.length);
export const STEPS: Step[] = [
  { stop: 'board', label: 'The case board', run: () => boardTour.show('overview') },
  { stop: 'board', label: 'Who am I', run: () => boardTour.show('profile') },
  { stop: 'board', label: 'Education', run: () => boardTour.show('edu') },
  { stop: 'board', label: 'Experience', run: () => boardTour.show('exp') },
  ...Array.from({ length: nTrophy }, (_, i): Step => ({ stop: 'trophy', label: `Awards & certificates ${i + 1}/${nTrophy}`, run: () => trophyTour.select(i), slow: true })),
  { stop: 'pc', label: 'Projects \u00b7 pick a case file' },
  { stop: 'resume', label: 'R\u00e9sum\u00e9 \u00b7 click to open' },
  { stop: 'desk', label: 'The phone is ringing\u2026', run: () => deskTour.phone(true) },
  { stop: 'desk', label: 'Call me, maybe?', run: () => deskTour.contact() },
];
const firstOf = (id: StopId) => STEPS.findIndex(s => s.stop === id);

export const tour = { index: -1, last: -1 };
const body = document.body;

function setTouring(on: boolean) { body.classList.toggle('touring', on); }

export function go(i: number) {
  if (i < 0) { exit(); return; }
  i = Math.min(i, STEPS.length - 1); const st = STEPS[i];
  tour.index = i; tour.last = i; setTouring(true); stage.tourDriven = true;
  if (stage.active && stage.active.id === st.stop) st.run?.();
  else openModule(st.stop, () => st.run?.());
  updateBar();
}
export const goTo = go;

/** ออกจาก tour กลับภาพรวมห้อง */
export function exit() {
  tour.index = -1; setTouring(false); stage.tourDriven = false;
  if (stage.active) closeModule(); else flyOverview(1.5);
  updateBar();
}
stage.returnTo = () => { tour.index = -1; setTouring(false); stage.tourDriven = false; flyOverview(1.5); updateBar(); };

/** เปิดโมดูลโดยคลิกของในห้อง/เมนู (ไม่ใช่ tour): เปิดตรง ๆ แล้วเลื่อนต่อจากจุดนี้ได้ */
export const openStop = (id: StopId) => {
  stage.tourDriven = false; tour.index = Math.max(0, firstOf(id)); tour.last = tour.index; setTouring(true);
  openModule(id); updateBar();
};

function step(dir: number) {
  if (tour.index < 0) { if (dir > 0) go(0); return; }
  if (dir > 0) { if (tour.index >= STEPS.length - 1) exit(); else go(tour.index + 1); }
  else go(tour.index - 1);
}

// ---------- input: wheel / swipe / keys ----------
const blocked = () => S.tutorialActive || S.introActive || !!document.getElementById('menu-panel')?.classList.contains('open') || !!document.getElementById('cv-viewer')?.classList.contains('on');
const cooldown = () => { const nx = STEPS[Math.min(STEPS.length - 1, Math.max(0, tour.index + 1))]; return (stage.active?.id === 'trophy' || nx?.slow) && tour.index >= 0 ? 1800 : 1300; };

/** ใต้เมาส์เป็นกล่องที่เลื่อนอ่านได้ (เช่น เนื้อหาใน sheet) → ปล่อยให้มันเลื่อนเอง ไม่ข้าม station */
function scrollableAt(t: EventTarget | null, down: boolean): boolean {
  let n = t as HTMLElement | null;
  while (n && n !== document.body && n.nodeType === 1) {
    if (n.scrollHeight > n.clientHeight + 2) {
      const oy = getComputedStyle(n).overflowY;
      if (oy === 'auto' || oy === 'scroll') { const atEnd = down ? n.scrollTop + n.clientHeight >= n.scrollHeight - 2 : n.scrollTop <= 0; if (!atEnd) return true; }
    }
    n = n.parentElement;
  }
  return false;
}

let acc = 0, lastWheel = 0, lock = 0, own = false, fired = false;
addEventListener('wheel', e => {
  if (blocked()) return;
  const now = performance.now();
  if (now - lastWheel > 220) { acc = 0; fired = false; own = scrollableAt(e.target, e.deltaY > 0); }   // เริ่มท่าทางใหม่ (ตัด inertia ของท่าเดิม)
  lastWheel = now;
  if (own || fired || now < lock) return;
  acc += e.deltaY;
  if (Math.abs(acc) > 70) { fired = true; lock = now + cooldown(); step(acc > 0 ? 1 : -1); acc = 0; }
}, { passive: true });

let ty = 0, tOwn = false;
addEventListener('touchstart', e => { ty = e.touches[0].clientY; tOwn = scrollableAt(e.target, true) || scrollableAt(e.target, false); }, { passive: true });
addEventListener('touchend', e => {
  if (blocked() || tOwn || performance.now() < lock) return;
  const d = ty - e.changedTouches[0].clientY; if (Math.abs(d) > 60) { lock = performance.now() + cooldown(); step(d > 0 ? 1 : -1); }
}, { passive: true });

addEventListener('keydown', e => {
  if (blocked() || (e as any)._modHandled) return;
  const tag = (e.target as HTMLElement)?.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const lr = !stage.active;   // ลูกศรซ้าย/ขวา ให้โมดูลใช้เอง (เช่น เปลี่ยนถ้วย) ตอนอยู่ในโมดูล
  if (['ArrowDown', 'PageDown'].includes(e.key) || (lr && e.key === 'ArrowRight')) { e.preventDefault(); step(1); }
  else if (['ArrowUp', 'PageUp'].includes(e.key) || (lr && e.key === 'ArrowLeft')) { e.preventDefault(); step(-1); }
  else if (e.key === 'Escape' && !stage.active) go(-1);
});

// ---------- แถบนำทาง (DOM): BACK / PREV / NEXT ใช้ได้ทั้งเมาส์และนิ้ว ----------
const bar = document.createElement('div'); bar.id = 'tour-bar'; bar.setAttribute('data-keep', '');
bar.innerHTML = `<button class="tb-back" type="button" hidden>\u25c2 BACK</button><button class="tb-prev" type="button" aria-label="Previous stop" title="Previous (\u2191)">\u25b2</button><div class="tb-mid"><b class="tb-count"></b><span class="tb-label"></span></div><button class="tb-next" type="button" aria-label="Next stop" title="Next (\u2193 / scroll)">NEXT \u25bc</button>`;
document.body.appendChild(bar);
const backBtn = document.createElement('button'); backBtn.id = 'back-btn'; backBtn.type = 'button'; backBtn.setAttribute('data-keep', ''); backBtn.title = 'Go back (Esc)'; backBtn.hidden = true;
document.body.appendChild(backBtn);
const q = <T extends HTMLElement>(s: string) => bar.querySelector(s) as T;
q('.tb-prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
q('.tb-next').addEventListener('click', e => { e.stopPropagation(); step(1); });
const doBack = (e: Event) => { e.stopPropagation(); const m = stage.active; if (m) { if (!m.back?.()) closeModule(); } else go(-1); };
backBtn.addEventListener('click', doBack); q('.tb-back').addEventListener('click', doBack);

export function updateBar() {
  const m = stage.active, i = tour.index, n = STEPS.length;
  const hidden = S.tutorialActive || S.introActive;
  bar.classList.toggle('show', !hidden);
  q('.tb-prev').toggleAttribute('hidden', i < 0);
  q<HTMLButtonElement>('.tb-next').textContent = i < 0 ? '\u25b6 TAKE THE TOUR' : i >= n - 1 ? 'FINISH \u2713' : 'NEXT \u25bc';
  q('.tb-count').textContent = i < 0 ? '' : `${i + 1}/${n}`;
  q('.tb-label').textContent = i < 0 ? 'Scroll, swipe or press the button' : STEPS[i].label;
  backBtn.hidden = hidden || !m;
  backBtn.textContent = m?.inner?.() ? '\u25c2 BACK' : '\u25c2 BACK TO ROOM';
  q('.tb-back').toggleAttribute('hidden', hidden || !m);
  document.body.classList.toggle('in-module', !!m);
}
setInterval(updateBar, 160);

// ---------- HUD (pixel): แถบไอคอน station ด้านขวา (เฉพาะตอนอยู่ภาพรวมห้อง) ----------
let rails: Rect[] = [], hover = -1;
export function hudClickLogical(lx: number, ly: number): boolean {
  if (S.tutorialActive || S.introActive || stage.active) return false;
  const i = rails.findIndex(r => inside(lx, ly, r)); if (i >= 0) { go(firstOf(TOUR_ORDER[i])); return true; }
  return false;
}
stage.hud = (c, w, h) => {
  hover = -1; rails = [];
  const n = TOUR_ORDER.length, x = w - 22, top = Math.round(h / 2 - (n * 20) / 2);
  rect(c, x + 7, top + 8, 2, (n - 1) * 20, PAL.dusk);
  TOUR_ORDER.forEach((id, i) => {
    const r: Rect = { x, y: top + i * 20, w: 16, h: 16 }; rails.push(r);
    const hov = inside(stage.px, stage.py, r); if (hov) hover = i;
    panel(c, r.x, r.y, r.w, r.h, { fill: PAL.night, border: hov ? PAL.amber : PAL.dusk, light: PAL.plum, shadow: false, notch: 1 });
    const sp = SPRITES[stops[id].icon]; sprite(c, stops[id].icon, r.x + Math.round((16 - sp[0].length) / 2), r.y + Math.round((16 - sp.length) / 2), 1);
  });
  document.body.style.cursor = hover >= 0 ? 'pointer' : document.body.style.cursor === 'pointer' && !S.hoveredItem ? 'default' : document.body.style.cursor;
};
