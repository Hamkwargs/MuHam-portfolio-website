/**
 * ไฟล์รูป/เสียง/เอกสารทั้งหมดอยู่ใน src/assets/{images,audio,docs} (ดู HOW-TO-ADD-CONTENT.md)
 * ใช้ import.meta.glob → Vite รู้ว่ามีไฟล์อะไรบ้าง ถ้าไฟล์ยังไม่มีเว็บจะใช้ placeholder ให้เอง ไม่พัง
 */
const images = import.meta.glob('./assets/images/**/*.{png,jpg,jpeg,webp,gif,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const audio = import.meta.glob('./assets/audio/**/*.{mp3,ogg,wav,m4a,flac}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const docs = import.meta.glob('./assets/docs/**/*.{pdf,png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const norm = (n: string) => n.replace(/^\.?\/?(src\/)?assets\//, '').replace(/^\//, '');
/** 'profile.jpg' | 'images/profile.jpg' | 'assets/images/profile.jpg' → URL (หรือ undefined ถ้าไม่มีไฟล์) */
export function assetUrl(name?: string): string | undefined {
  if (!name) return undefined; const n = norm(name);
  for (const [kind, map] of [['images', images], ['docs', docs], ['audio', audio]] as const) {
    const key = n.startsWith(kind + '/') ? `./assets/${n}` : `./assets/${kind}/${n}`; if (map[key]) return map[key];
  }
  return undefined;
}
export interface Track { file: string; url: string; title: string }
/** รายการเพลงในโฟลเดอร์อัลบั้ม src/assets/audio/<folder>/ เรียงตามชื่อไฟล์ (01-xxx.mp3, 02-yyy.mp3 …) */
export function albumTracks(folder: string): Track[] {
  const pre = `./assets/audio/${folder.replace(/\/$/, '')}/`;
  return Object.entries(audio).filter(([k]) => k.startsWith(pre)).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([k, url]) => { const file = k.slice(pre.length); return { file, url, title: file.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '').replace(/[-_]+/g, ' ').trim() }; });
}

/** 'photo.jpg' → URL ของ 'photo-pixel.png' ถ้ามีไฟล์ (สร้างด้วย npm run assets) ไม่มีก็ undefined → ระบบจะ pixelate ให้ตอน runtime */
export function pixelUrl(name?: string): string | undefined {
  if (!name) return undefined; const base = name.replace(/\.[^./]+$/, ''); return assetUrl(`${base}-pixel.png`);
}
