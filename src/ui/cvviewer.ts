/** ตัวดู CV แบบละเอียด: กรอบ pixel + รูป CV จริง + ปุ่มดาวน์โหลด + คลิกขวาเพื่อเลือกดาวน์โหลด */
import './pixel-css';
import { cv } from '../data';
const v = document.createElement('div'); v.id = 'cv-viewer'; v.setAttribute('data-keep', '');
v.innerHTML = `<div class="cvv-box"><div class="cvv-head"><span title="Curriculum Vitae">CURRICULUM VITAE</span><span class="cvv-btns">${cv.pdf ? `<a class="sbtn" id="cvv-dl" href="${cv.pdf}" download="CV.pdf">⬇ DOWNLOAD PDF</a>` : ''}<button class="sbtn ghost" id="cvv-x" type="button">✕ CLOSE</button></span></div><div class="cvv-scroll">${cv.image ? `<img alt="CV" src="${cv.image}">` : '<p style="color:#9af5bf">Add src/assets/images/cv.png</p>'}</div></div><div id="cvv-menu" hidden><a href="${cv.pdf ?? '#'}" download="CV.pdf">⬇ Download PDF</a><a href="${cv.image ?? '#'}" target="_blank" rel="noopener">↗ Open image in new tab</a></div>`;
document.body.appendChild(v);
const menu = v.querySelector('#cvv-menu') as HTMLElement; let onClose: (() => void) | undefined;
export const cvViewer = {
  get isOpen() { return v.classList.contains('on'); },
  open(cb?: () => void) { onClose = cb; v.classList.add('on'); }, close() { v.classList.remove('on'); menu.hidden = true; const f = onClose; onClose = undefined; f?.(); },
};
v.querySelector('#cvv-x')!.addEventListener('click', () => cvViewer.close());
v.addEventListener('click', e => { menu.hidden = true; if (e.target === v) cvViewer.close(); });
v.addEventListener('contextmenu', e => { e.preventDefault(); menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; menu.hidden = false; });
addEventListener('keydown', e => { if (e.key === 'Escape' && cvViewer.isOpen) { e.stopPropagation(); cvViewer.close(); } }, true);
