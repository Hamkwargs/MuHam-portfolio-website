import { assetUrl, pixelUrl } from '../assets';
import { placeholderArt, pixelate } from './art';

export interface PolaroidOpts { photo?: string; caption: string; seed?: string; tilt?: number; pixel?: boolean; onClick?: () => void; title?: string }
/** โพลารอยด์ (DOM): รูป + คำอธิบายเขียนด้วยหมึก — ไม่มีรูปจริงจะใช้รูป pixel ตัวอย่างแทน */
export function polaroid(o: PolaroidOpts): HTMLButtonElement {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pola'; b.style.setProperty('--tilt', `${o.tilt ?? 0}deg`); b.title = o.title ?? o.caption;
  const im = document.createElement('img'); im.alt = o.caption; im.className = o.pixel ? 'px' : '';
  const url = assetUrl(o.photo);
  if (url) { if (o.pixel) { const pu = pixelUrl(o.photo); if (pu) im.src = pu; else pixelate(url, 48).then(u => { im.src = u; }); } else im.src = url; } else { im.src = placeholderArt(o.seed ?? o.caption); im.classList.add('px'); }
  const cap = document.createElement('span'); cap.className = 'pola-cap'; cap.textContent = o.caption;
  b.append(im, cap); if (o.onClick) b.addEventListener('click', o.onClick); return b;
}
