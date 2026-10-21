/**
 * Pixel UI: วาด UI แบบ 8-bit ลง canvas ความละเอียดต่ำ (1 logical px = `scale` css px)
 * - ตัวอักษรถูก threshold alpha ให้ไม่มี anti-alias (ภาษาไทยก็เป็น pixel)
 * - panel / button / sprite / dither วาดด้วย rect ล้วน ๆ
 */
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/silkscreen/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-700.css';
import '@fontsource/permanent-marker/latin-400.css';
import { PAL } from './palette';

export type Ctx = CanvasRenderingContext2D;
export type Rect = { x: number; y: number; w: number; h: number };
export type FontKey = 'head' | 'body' | 'bold' | 'mark' | 'pix';

const FONT: Record<FontKey, (s: number) => string> = {
  head: s => `700 ${s}px Silkscreen, Inter, sans-serif`,
  body: s => `400 ${s}px Inter, sans-serif`,
  bold: s => `700 ${s}px Inter, sans-serif`,
  mark: s => `400 ${s}px "Permanent Marker", Inter, sans-serif`,
  pix: s => `400 ${s}px "Pixelify Sans", Inter, sans-serif`,
};

const glyphCache = new Map<string, { c: HTMLCanvasElement; w: number; asc: number }>();
export let fontsReady = false;
export const fontsPromise = (async () => {
  try {
    await Promise.all([
      document.fonts.load('700 10px Silkscreen', 'ABC'), document.fonts.load('400 10px Inter', 'abc'),
      document.fonts.load('700 10px Inter', 'abc'), document.fonts.load('10px "Pixelify Sans"', 'abc'),
      document.fonts.load('10px "Permanent Marker"', 'abc'),
    ]);
  } catch { /* fallback font */ }
  glyphCache.clear(); fontsReady = true;
})();

// ---------- layer ----------
export class PxLayer {
  canvas: HTMLCanvasElement; ctx: Ctx; w = 320; h = 180; scale = 2;
  private listeners: Array<() => void> = [];
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d')!;
    addEventListener('resize', () => this.resize()); this.resize();
  }
  resize() {
    const W = innerWidth, H = innerHeight;
    this.scale = Math.max(2, Math.min(4, Math.round(W / 560)));
    this.w = Math.ceil(W / this.scale); this.h = Math.ceil(H / this.scale);
    this.canvas.width = this.w; this.canvas.height = this.h;
    this.canvas.style.width = this.w * this.scale + 'px'; this.canvas.style.height = this.h * this.scale + 'px';
    this.ctx.imageSmoothingEnabled = false;
    this.listeners.forEach(f => f());
  }
  onResize(f: () => void) { this.listeners.push(f); }
  toLogical(cx: number, cy: number) { return { x: Math.floor(cx / this.scale), y: Math.floor(cy / this.scale) }; }
  clear() { this.ctx.clearRect(0, 0, this.w, this.h); }
}

// ---------- primitives ----------
export const rect = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const inside = (px: number, py: number, r: Rect) => px >= r.x && py >= r.y && px < r.x + r.w && py < r.y + r.h;

export function line(c: Ctx, x0: number, y0: number, x1: number, y1: number, color: string, thick = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy; c.fillStyle = color;
  for (let i = 0; i < 4000; i++) {
    c.fillRect(x0, y0, thick, thick);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/** checker dither: level 0..1 */
export function dither(c: Ctx, x: number, y: number, w: number, h: number, color: string, level = 0.5) {
  c.fillStyle = color;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const on = level >= 0.75 ? ((i + j) & 1) !== 1 || (i & 1) === 0 : level >= 0.5 ? ((i + j) & 1) === 0 : level >= 0.25 ? (i & 1) === 0 && (j & 1) === 0 : false;
    if (on) c.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
  }
}

export interface PanelOpt { fill?: string; border?: string; light?: string; dark?: string; shadow?: string | false; notch?: number; }
/** กรอบ 8-bit: มุมเว้า + ขอบ 1px + bevel สว่าง/มืด + เงาตกกระทบ */
export function panel(c: Ctx, x: number, y: number, w: number, h: number, o: PanelOpt = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const fill = o.fill ?? PAL.night, border = o.border ?? PAL.amber, n = o.notch ?? 2;
  if (o.shadow !== false) { const s = o.shadow ?? PAL.ink; rect(c, x + n + 2, y + h, w - n, 2, s); rect(c, x + w, y + n + 2, 2, h - n, s); }
  rect(c, x + n, y, w - 2 * n, h, border); rect(c, x, y + n, w, h - 2 * n, border);
  rect(c, x + 1, y + n - 1 + 0, w - 2, h - 2 * n + 2, border);
  rect(c, x + n, y + 1, w - 2 * n, h - 2, fill); rect(c, x + 1, y + n, w - 2, h - 2 * n, fill);
  rect(c, x + 1, y + 1 + (n > 1 ? 1 : 0), w - 2, h - 2 - (n > 1 ? 2 : 0), fill);
  const light = o.light ?? PAL.white, dark = o.dark ?? PAL.ink;
  rect(c, x + n + 1, y + 1, w - 2 * n - 2, 1, light); rect(c, x + 1, y + n + 1, 1, h - 2 * n - 2, light);
  rect(c, x + n + 1, y + h - 2, w - 2 * n - 2, 1, dark); rect(c, x + w - 2, y + n + 1, 1, h - 2 * n - 2, dark);
}

// ---------- text ----------
const mc = document.createElement('canvas').getContext('2d')!;
export function measure(str: string, font: FontKey = 'body', size = 11) { mc.font = FONT[font](size); return Math.ceil(mc.measureText(str).width); }
function glyph(str: string, font: FontKey, size: number, color: string) {
  const key = `${font}|${size}|${color}|${str}`; let g = glyphCache.get(key); if (g) return g;
  const w = measure(str, font, size) + 3, asc = Math.ceil(size * 1.2), hgt = asc + Math.ceil(size * 0.6);
  const cv = document.createElement('canvas'); cv.width = Math.max(1, w); cv.height = hgt;
  const cx = cv.getContext('2d', { willReadFrequently: true })!; cx.font = FONT[font](size); cx.textBaseline = 'alphabetic'; cx.fillStyle = '#000'; cx.fillText(str, 1, asc);
  const id = cx.getImageData(0, 0, cv.width, cv.height), d = id.data;
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color)!, r = parseInt(m[1], 16), gg = parseInt(m[2], 16), b = parseInt(m[3], 16);
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 96) { d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; } else d[i + 3] = 0; }
  cx.putImageData(id, 0, 0); g = { c: cv, w, asc }; glyphCache.set(key, g); return g;
}
export interface TextOpt { font?: FontKey; size?: number; color?: string; align?: 'left' | 'center' | 'right'; shadow?: string; }
/** วาดข้อความ: y = baseline */
export function text(c: Ctx, str: string, x: number, y: number, o: TextOpt = {}) {
  if (!str) return 0;
  const font = o.font ?? 'body', size = o.size ?? 11, color = o.color ?? PAL.paper;
  const g = glyph(str, font, size, color); let dx = Math.round(x);
  if (o.align === 'center') dx -= Math.round(g.w / 2); else if (o.align === 'right') dx -= g.w;
  const dy = Math.round(y) - g.asc;
  if (o.shadow) { const s = glyph(str, font, size, o.shadow); c.drawImage(s.c, dx + 1, dy + 1); }
  c.drawImage(g.c, dx, dy); return g.w;
}
const seg = typeof Intl !== 'undefined' && (Intl as any).Segmenter ? new (Intl as any).Segmenter('th', { granularity: 'word' }) : null;
export function wrap(str: string, maxW: number, font: FontKey = 'body', size = 11): string[] {
  const out: string[] = [];
  for (const para of String(str).split('\n')) {
    const words: string[] = seg ? [...seg.segment(para)].map((s: any) => s.segment) : para.split(/(\s+)/);
    let cur = '';
    for (const w of words) {
      if (measure((cur + w).trimEnd(), font, size) <= maxW || !cur) cur += w; else { out.push(cur.trimEnd()); cur = w.trimStart(); }
    }
    out.push(cur.trimEnd());
  }
  return out;
}
/** วาดย่อหน้า คืนค่า y ถัดไป */
export function paragraph(c: Ctx, str: string, x: number, y: number, maxW: number, o: TextOpt & { lh?: number; maxLines?: number } = {}) {
  const lh = o.lh ?? Math.round((o.size ?? 11) * 1.35); let lines = wrap(str, maxW, o.font ?? 'body', o.size ?? 11);
  if (o.maxLines && lines.length > o.maxLines) lines = lines.slice(0, o.maxLines);
  lines.forEach((l, i) => text(c, l, x, y + i * lh, o)); return y + lines.length * lh;
}

// ---------- buttons ----------
export function button(c: Ctx, label: string, r: Rect, o: { hot?: boolean; down?: boolean; color?: string; textColor?: string; size?: number } = {}) {
  const col = o.color ?? PAL.amber, off = o.down ? 1 : 0;
  panel(c, r.x, r.y + off, r.w, r.h, { fill: o.hot ? col : PAL.plum, border: o.hot ? PAL.white : col, light: o.hot ? PAL.white : PAL.dusk, shadow: o.down ? false : PAL.ink, notch: 2 });
  text(c, label, r.x + r.w / 2, r.y + off + Math.round(r.h / 2 + (o.size ?? 8) / 2 - 1), { font: 'head', size: o.size ?? 8, align: 'center', color: o.hot ? PAL.ink : (o.textColor ?? col) });
}

// ---------- sprites ----------
const SPR_COL: Record<string, string> = { k: PAL.ink, a: PAL.amber, o: PAL.orange, r: PAL.red, w: PAL.white, p: PAL.paper, q: PAL.paper3, g: PAL.green, d: PAL.greenMid, b: PAL.blue, t: PAL.teal, n: PAL.corkDark, c: PAL.cork, y: PAL.yellow, m: PAL.mauve, s: PAL.gray };
export const SPRITES: Record<string, string[]> = {
  cap: ['..kkkkkk..', '.kbbbbbbk.', 'kbbbwwbbbk', '.kkkkkkkk.', '..kbbbbk..', '..kbbbbk..', '..kkkkkk..'],
  case: ['...kkkk...', '...k..k...', 'kkkkkkkkkk', 'koooooooook', 'kooookkoook', 'koooooooook', 'kkkkkkkkkk'].map(s => s.slice(0, 10)),
  folder: ['kkkk......', 'kaaakkkkkk', 'kaaaaaaaak', 'kaaaaaaaak', 'kaaaaaaaak', 'kaaaaaaaak', 'kkkkkkkkkk'],
  star: ['....k....', '....k....', '...kyk...', 'kkkkyykkk', '.kyyyyyk.', '..kyyyk..', '.kyykyyk.', '.kkk.kkk.'].map(s => s.slice(0, 9)),
  cup: ['kkkkkkkkk', 'kayyyyyak', 'k.kyyyk.k', '.k.kyk.k.', '...kyk...', '...kyk...', '..kkkkk..', '.kaaaaak.', '.kkkkkkk.'],
  phone: ['.kkkkkkk.', 'kddddddgk', 'kk.....kk', '.k.....k.', '..kkkkk..', '.kkoooookk'.slice(0, 9), '.koooooook'.slice(0, 9), '.kkkkkkk.'],
  mail: ['kkkkkkkkkk', 'kpkppppkpk', 'kpppkkpppk', 'kppppppppk', 'kppppppppk', 'kkkkkkkkkk'],
  pin: ['..kkk..', '.krrrk.', 'krwrrrk', 'krrrrrk', '.krrrk.', '..kkk..', '...k...', '...k...'],
  note: ['kkkkkkkk', 'kyyyyyyk', 'kykkkkyk', 'kyyyyyyk', 'kykkkyyk', 'kyyyyyyk', 'kkkkkkkk'],
  tape: ['kkkkkkkkkk', 'ksssssssak', 'kskwkkwkak', 'ksskkkkaak', 'ksssssssak', 'kkkkkkkkkk'],
  link: ['.kkk..kkk.', 'kbbbkkbbbk', 'kbkkkkkkbk', 'kbbbkkbbbk', '.kkk..kkk.'],
  arrowL: ['...k', '..kk', '.kkk', 'kkkk', '.kkk', '..kk', '...k'], arrowR: ['k...', 'kk..', 'kkk.', 'kkkk', 'kkk.', 'kk..', 'k...'],
};
export function sprite(c: Ctx, key: string, x: number, y: number, s = 1, tint?: string) {
  const sp = SPRITES[key]; if (!sp) return { w: 0, h: 0 };
  sp.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') rect(c, x + i * s, y + j * s, s, s, tint ?? SPR_COL[ch] ?? PAL.white); }));
  return { w: sp[0].length * s, h: sp.length * s };
}
