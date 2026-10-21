/** แผ่น "กระดาษบันทึก" (DOM) ใช้ร่วมกันทุกโมดูล: ซ้าย = พื้นที่ของโมดูล (โพลารอยด์/ถ้วย) · ขวา = กระดาษที่เรนเดอร์ HTML ด้วยฟอนต์อ่านง่าย */
import '@fontsource/inter/latin-400.css'; import '@fontsource/inter/latin-600.css'; import '@fontsource/inter/latin-700.css';
import './pixel-css';
import { hydrateImages } from '../doc';

export interface SheetAction { label: string; href?: string; download?: boolean; onClick?: () => void; kind?: 'primary' | 'ghost' }
export interface SheetOpts { kicker?: string; title: string; subtitle?: string; html: string; stamp?: string; actions?: SheetAction[]; left?: HTMLElement | null; theme?: 'paper' | 'crt' | 'dark' | 'sticky'; side?: 'center' | 'right'; onClose?: () => void }

const el = document.createElement('div'); el.id = 'sheet'; el.className = 'sheet'; el.setAttribute('data-keep', ''); el.hidden = true;
el.innerHTML = `<div class="sheet-left"></div><div class="sheet-stack"><i class="pp p3"></i><i class="pp p2"></i><i class="pp p1"></i><div class="folder-tab"><span class="tab-t"></span></div><article class="sheet-paper"><button class="sheet-x" type="button" title="Close" aria-label="Close">✕</button><div class="paper-in"><header><div class="kicker"></div><h2 class="title"></h2><div class="sub"></div></header><div class="stamp"></div><div class="md"></div><footer class="actions"></footer></div></article></div>`;
document.body.appendChild(el);
const q = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
let onClose: (() => void) | undefined;
q('.sheet-x').addEventListener('click', () => api.close(true));

function fill(o: Partial<SheetOpts>) {
  if (o.kicker !== undefined) { q('.kicker').textContent = o.kicker; q('.tab-t').textContent = o.kicker || 'CASE FILE'; }
  if (o.title !== undefined) { const t = q('.title'); t.textContent = o.title; t.title = o.title; }
  if (o.subtitle !== undefined) q('.sub').textContent = o.subtitle;
  if (o.html !== undefined) { q('.md').innerHTML = o.html; hydrateImages(q('.md')); }
  if (o.stamp !== undefined) { const s = q('.stamp'); s.textContent = o.stamp; s.style.display = o.stamp ? '' : 'none'; }
  if (o.actions) { const f = q('footer'); f.replaceChildren(...o.actions.map(a => { const n = document.createElement(a.href ? 'a' : 'button') as HTMLAnchorElement & HTMLButtonElement; n.className = 'sbtn ' + (a.kind ?? 'primary'); n.textContent = a.label;
    if (a.href) { n.href = a.href; if (a.download) n.setAttribute('download', ''); else { n.target = '_blank'; n.rel = 'noopener'; } } else n.type = 'button'; if (a.onClick) n.addEventListener('click', a.onClick); return n; })); }
}
el.addEventListener('click', e => { const b = (e.target as HTMLElement).closest('[data-copy]') as HTMLElement | null; if (!b) return; try { navigator.clipboard?.writeText(b.dataset.copy!); } catch { /* ignore */ } const t = b.textContent; b.textContent = 'COPIED ✓'; setTimeout(() => { b.textContent = t; }, 1300); });
el.addEventListener('click', e => { const b = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null; if (b) api.onAction?.(b.dataset.act!, b); });
// เอียงโพลารอยด์/รูปตามเมาส์ (3D tilt)
let tiltRaf = 0;
addEventListener('pointermove', e => {
  if (el.hidden || tiltRaf) return; tiltRaf = requestAnimationFrame(() => { tiltRaf = 0;
    el.querySelectorAll<HTMLElement>('.pola, .tilt').forEach(n => { const r = n.getBoundingClientRect(), dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.4))), dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight * 0.4))); n.style.setProperty('--ry', `${dx * 14}deg`); n.style.setProperty('--rx', `${-dy * 14}deg`); }); });
});
const api = {
  onAction: undefined as undefined | ((name: string, el: HTMLElement) => void),
  el, get isOpen() { return !el.hidden && el.classList.contains('on'); },
  get left() { return q('.sheet-left'); },
  open(o: SheetOpts) {
    onClose = o.onClose; el.dataset.theme = o.theme ?? 'paper'; el.dataset.side = o.side ?? 'center'; el.hidden = false; fill({ kicker: '', subtitle: '', stamp: '', actions: [], ...o });
    q('.sheet-left').replaceChildren(...(o.left ? [o.left] : [])); q('.sheet-left').style.display = o.left ? '' : 'none';
    requestAnimationFrame(() => el.classList.add('on'));
  },
  /** เปลี่ยนเนื้อหากระดาษ (เช่นคลิกโพลารอยด์ใบอื่น) พร้อมแอนิเมชันพลิกหน้า */
  update(o: Partial<SheetOpts>) { const p = q('.sheet-paper'); p.classList.remove('flip'); void p.offsetWidth; p.classList.add('flip'); fill(o); q('.sheet-paper').scrollTop = 0; },
  close(notify = false) { el.classList.remove('on'); setTimeout(() => { if (!el.classList.contains('on')) el.hidden = true; }, 260); const f = onClose; onClose = undefined; if (notify) f?.(); },
};
export const sheet = api;
