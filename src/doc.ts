/**
 * ตัวอ่านไฟล์เนื้อหา HTML ใน src/content (แทน Markdown เดิม)
 *
 * รูปแบบไฟล์:
 *   <meta name="title" content="Year 1">      ← ข้อมูล (metadata) ใช้ <meta name=… content=…> กี่อันก็ได้
 *   <h2>หัวข้อ</h2> <p>เนื้อหา…</p>              ← เนื้อหา = HTML ธรรมดา จัดหน้าเองได้เต็มที่ (class, style, ตาราง, คอลัมน์ ฯลฯ)
 *   <img src="kyoto.jpg" alt="คำอธิบาย">       ← ชื่อไฟล์ในโฟลเดอร์ src/assets/images/ (แสดงเป็น pixel จนกว่าจะคลิก)
 *
 * ความปลอดภัย: ลบ <script>/<iframe>/<style>/on*= / javascript: ออกก่อนใช้ทุกครั้ง
 */
import { assetUrl, pixelUrl } from './assets';
import { pixelate } from './ui/art';

export interface Doc {
  id: string;
  meta: Record<string, string>;
  /** เนื้อหา HTML ที่ผ่านการล้างและแปลงรูปแล้ว พร้อมใส่ลง DOM */
  body: string;
  /** ตัวอักษรล้วน (ไว้ทำ preview) */
  text: string;
  /** ย่อหน้าแรก (<p>) แบบตัวอักษรล้วน ใช้เป็นข้อความตัวอย่าง */
  summary: string;
  /** DOM ของเนื้อหา (ไว้ให้โค้ดอื่นอ่านโครงสร้าง เช่น รายการ contact) */
  root: HTMLElement;
  list(k: string): string[];
}

const DROP = 'script,iframe,object,embed,style,link,base,meta,title,form,frame,frameset,applet';
const BLANK_GIF = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const isRemote = (s: string) => /^(https?:)?\/\//i.test(s) || /^data:/i.test(s) || /^blob:/i.test(s);

function clean(root: HTMLElement) {
  root.querySelectorAll(DROP).forEach(n => n.remove());
  root.querySelectorAll<HTMLElement>('*').forEach(n => {
    for (const a of Array.from(n.attributes)) {
      const name = a.name.toLowerCase(), val = a.value.trim().toLowerCase().replace(/[\s\u0000-\u001f]+/g, '');
      if (name.startsWith('on') || ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action') && /^(javascript|vbscript):/.test(val))) n.removeAttribute(a.name);
    }
  });
  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
    if (/^(https?:|mailto:|tel:)/i.test(a.getAttribute('href') || '')) { a.target = '_blank'; a.rel = 'noopener'; }
  });
  root.querySelectorAll<HTMLImageElement>('img').forEach(im => {
    const raw = im.getAttribute('src') || ''; if (!raw) { im.remove(); return; }
    if (isRemote(raw) || im.hasAttribute('data-nopixel')) { im.classList.add('mdimg'); im.dataset.full = isRemote(raw) ? raw : (assetUrl(raw) ?? raw); im.src = im.dataset.full; im.dataset.static = '1'; return; }
    const full = assetUrl(raw) ?? raw, pix = pixelUrl(raw) ?? '';
    im.classList.add('mdimg', 'px'); im.dataset.full = full; im.dataset.pix = pix; im.title = im.title || 'Click to see the full-quality image';
    im.setAttribute('src', pix || BLANK_GIF); im.loading = 'lazy';
  });
}

export function parseDoc(raw: string, id: string): Doc {
  const dom = new DOMParser().parseFromString(raw, 'text/html');
  const meta: Record<string, string> = {};
  dom.querySelectorAll('meta[name]').forEach(m => { const k = m.getAttribute('name')!.trim(); if (k && k !== 'viewport' && k !== 'charset') meta[k] = (m.getAttribute('content') ?? '').trim(); });
  const root = dom.body as HTMLElement; clean(root);
  return { id, meta, body: root.innerHTML.trim(), text: (root.textContent ?? '').replace(/\s+/g, ' ').trim(), summary: (root.querySelector('p')?.textContent ?? '').replace(/\s+/g, ' ').trim(), root, list: k => (meta[k] ?? '').split(',').map(s => s.trim()).filter(Boolean) };
}
export function loadDocs(glob: Record<string, string>): Doc[] {
  return Object.entries(glob).map(([path, raw]) => parseDoc(raw, path.split('/').pop()!.replace(/\.html?$/i, '')))
    .sort((a, b) => (parseFloat(a.meta.order ?? '999') - parseFloat(b.meta.order ?? '999')) || a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/** รูปในเนื้อหาเป็น pixel จนกว่าจะคลิก (ใช้ไฟล์ -pixel.png ถ้ามี ไม่งั้น pixelate ตอนเปิดดู) — เรียกหลังใส่ HTML ลง DOM */
export function hydrateImages(root: HTMLElement) {
  root.querySelectorAll<HTMLImageElement>('img.mdimg').forEach(im => {
    if (im.dataset.ready) return; im.dataset.ready = '1';
    if (im.dataset.static) { im.addEventListener('click', () => im.classList.toggle('zoom')); return; }
    const full = im.dataset.full!; if (!im.dataset.pix) pixelate(full, 64).then(u => { im.dataset.pix = u; if (im.classList.contains('px')) im.src = u; });
    im.addEventListener('click', () => { const px = im.classList.toggle('px'); im.src = px ? (im.dataset.pix || im.src) : full; im.title = px ? 'Click to see the full-quality image' : 'Click to pixelate'; });
  });
}
