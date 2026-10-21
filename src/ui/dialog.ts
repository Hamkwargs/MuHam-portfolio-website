/** กล่องข้อความแบบเกม (DOM + กรอบ pixel) ใช้ร่วมกัน: แจ้งเตือน/คำบรรยาย/ตัวเลือก */
import './pixel-css';
export interface DialogAction { label: string; onClick?: () => void; href?: string; download?: boolean }
const el = document.createElement('div'); el.id = 'dialog'; el.setAttribute('data-keep', ''); el.hidden = true;
el.innerHTML = '<div class="dlg-name"></div><div class="dlg-text"></div><div class="dlg-actions"></div>'; document.body.appendChild(el);
let timer = 0;
export function showDialog(o: { name?: string; text: string; actions?: DialogAction[]; autoHide?: number }) {
  (el.querySelector('.dlg-name') as HTMLElement).textContent = o.name ?? ''; (el.querySelector('.dlg-text') as HTMLElement).textContent = o.text;
  const a = el.querySelector('.dlg-actions') as HTMLElement;
  a.replaceChildren(...(o.actions ?? []).map(x => { const n = document.createElement(x.href ? 'a' : 'button') as HTMLAnchorElement & HTMLButtonElement; n.className = 'sbtn'; n.textContent = x.label; if (x.href) { n.href = x.href; if (x.download) n.setAttribute('download', 'CV.pdf'); else { n.target = '_blank'; n.rel = 'noopener'; } } else n.type = 'button'; n.addEventListener('click', () => { x.onClick?.(); hideDialog(); }); return n; }));
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); clearTimeout(timer); if (o.autoHide) timer = window.setTimeout(hideDialog, o.autoHide);
}
export function hideDialog() { el.classList.remove('on'); setTimeout(() => { if (!el.classList.contains('on')) el.hidden = true; }, 250); }

export const dialogOpen = () => !el.hidden && el.classList.contains('on');
