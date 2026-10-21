/**
 * สมุดโน้ตสอนเล่น (pixel, รกนิด ๆ)
 * - เด้งขึ้นมาทันทีหลังกล้องซูมเข้าห้อง (intro จบ) · ปิดแล้วบินลง inventory · คลิกช่อง inventory เพื่อเปิดอ่านใหม่
 * - ปิดได้: ปุ่ม ✕ / GOT IT / คลิกนอกสมุด / ESC · แก้ข้อความที่ tutorial-data.ts
 */
import '@fontsource/special-elite/latin-400.css';
import { S } from './state';
import { notebook as T } from './tutorial-data';
import { inventory } from './ui/inventory';

const root = document.getElementById('notebook');
if (!root) throw new Error('Missing #notebook in index.html');
const host: HTMLElement = root;

const svg = (vb: string, d: string, fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" shape-rendering="crispEdges"><path fill="${fill}" d="${d}"/></svg>`;
const ARROW = svg('0 0 14 8', 'M0 3h10v2H0z M9 1h1v6H9z M10 2h1v4h-1z M11 3h1v2h-1z', '#2c4a8a');
const EYE = svg('0 0 12 8', 'M3 0h6v1H3z M1 1h2v1H1z M9 1h2v1H9z M0 2h1v3H0z M11 2h1v3h-1z M1 5h2v1H1z M9 5h2v1H9z M3 6h6v1H3z M5 2h2v3H5z', '#b3322a');
const QMARK = svg('0 0 7 11', 'M2 0h3v1H2z M1 1h1v1H1z M5 1h1v2H5z M4 3h1v1H4z M3 4h1v2H3z M3 7h1v1H3z M3 9h1v1H3z', '#2c4a8a');

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n;
};

let wrap: HTMLElement, okBtn: HTMLButtonElement;
function build() {
  host.replaceChildren();
  const backdrop = el('div', 'nb-backdrop');
  wrap = el('div', 'nb-wrap');
  const book = el('div', 'nb-book');
  const page = el('div', 'nb-page');

  const x = el('button', 'nb-x', '\u2715'); x.type = 'button'; x.title = 'Close'; x.setAttribute('aria-label', 'Close notes');
  const title = el('h2', 'nb-title', T.title);
  const sub = el('div', 'nb-sub', T.sub);

  const list = el('ol', 'nb-steps');
  T.steps.forEach(s => {
    const li = el('li');
    li.append(el('b', 'nb-n', String(s.n)));
    const col = el('div'); col.append(el('h3', undefined, s.head), el('p', undefined, s.body)); li.append(col);
    list.append(li);
  });

  // ของตกแต่งให้ดูรก: โน้ตลายมือ · doodle pixel · คราบกาแฟ · เทป · แสตมป์
  const notes = T.scribbles.map((t, i) => el('div', `nb-note n${i + 1}`, t));
  const dood = (cls: string, html: string) => { const d = el('span', `nb-doodle ${cls}`); d.innerHTML = html; return d; };
  const decor = [dood('eye', EYE), dood('arrow', ARROW), dood('q', QMARK), el('div', 'nb-stain'), el('i', 'nb-tape'), el('div', 'nb-stamp', T.stamp)];

  const foot = el('div', 'nb-foot');
  foot.append(el('div', 'nb-sticky', T.hint));
  okBtn = el('button', 'nb-ok', T.close); okBtn.type = 'button'; foot.append(okBtn);

  page.append(x, title, sub, list, ...notes, ...decor, foot);
  book.append(page); wrap.append(book); host.append(backdrop, wrap);

  x.addEventListener('click', e => { e.stopPropagation(); closeNotebook(); });
  okBtn.addEventListener('click', e => { e.stopPropagation(); closeNotebook(); });
  backdrop.addEventListener('click', () => closeNotebook());
  host.addEventListener('click', e => { if (e.target === host) closeNotebook(); });   // คลิกนอกสมุด = ปิด
}
build();

let isOpen = false, busy = false;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const notebookOpen = () => isOpen;

export function showNotebook() {
  if (isOpen || busy) return;
  isOpen = true; S.tutorialActive = true;                      // บล็อก hover/tour ระหว่างอ่าน
  document.getElementById('tooltip')?.classList.remove('show');
  host.hidden = false; wrap.getAnimations().forEach(a => a.cancel());
  void host.offsetWidth;
  requestAnimationFrame(() => { host.classList.add('open'); okBtn.focus({ preventScroll: true }); });
}

export function closeNotebook() {
  if (!isOpen || busy) return;
  busy = true;
  // เก็บลง inventory (ครั้งแรกจะสร้างช่องให้) แล้วบินไปที่ช่องนั้น
  const first = !inventory.has('notebook');
  if (first) inventory.add('notebook', 'Case notes \u2014 click to read again', showNotebook);
  const to = inventory.slotRect('notebook'), from = wrap.getBoundingClientRect();
  host.classList.remove('open');
  const done = () => {
    host.hidden = true; wrap.getAnimations().forEach(a => a.cancel());
    isOpen = false; busy = false; S.tutorialActive = false;
    if (first) { const slot = document.querySelector('#inventory .slot.use'); slot?.classList.add('pulse'); setTimeout(() => slot?.classList.remove('pulse'), 3600); }
  };
  if (!to || reduce()) { setTimeout(done, reduce() ? 0 : 280); return; }
  const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2), k = Math.max(0.04, to.width / from.width);
  const a = wrap.animate([
    { transform: 'rotate(-1.6deg) translate(0,0) scale(1)', opacity: 1 },
    { transform: `rotate(-14deg) translate(${dx * 0.35}px,${dy * 0.35 - 40}px) scale(.62)`, opacity: 1, offset: 0.45 },
    { transform: `rotate(-24deg) translate(${dx}px,${dy}px) scale(${k})`, opacity: 0.25 },
  ], { duration: 560, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' });
  let fin = false; const finish = () => { if (fin) return; fin = true; done(); };   // กัน done() ถูกเรียกซ้ำจาก oncancel หลังเปิดใหม่
  a.onfinish = finish; a.oncancel = finish;
}

// ESC = ปิดสมุด (ดักก่อน handler อื่น เพื่อไม่ให้ไปปิดเมนู/โมดูลด้วย)
addEventListener('keydown', e => {
  if (!isOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeNotebook(); }
}, true);
