/** รูป pixel ที่สร้างจากโค้ด: placeholder (ยังไม่มีรูปจริง) และ pixelate() แปลงรูปจริงเป็น 8-bit อัตโนมัติ */
const PICO = ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** รูป pixel ตัวอย่าง (ซิลลูเอตเมืองตอนค่ำ) แต่ละ seed หน้าตาต่างกัน */
export function placeholderCanvas(seed: string, w = 40, h = 30): HTMLCanvasElement {
  let s = hash(seed) || 1; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d')!;
  const skies = [['#29184a', '#7e2553', '#ff77a8'], ['#10203f', '#1d2b53', '#29adff'], ['#2a1130', '#ab5236', '#ffa300'], ['#0c2218', '#164d32', '#6be39a']][Math.floor(r() * 4)];
  skies.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, Math.floor((i * h) / 3), w, Math.ceil(h / 3) + 1); });
  c.fillStyle = '#fff1e8'; c.fillRect(Math.floor(r() * (w - 6)) + 2, 3 + Math.floor(r() * 4), 3, 3);
  for (let x = 0; x < w;) { const bw = 3 + Math.floor(r() * 5), bh = 6 + Math.floor(r() * 12); c.fillStyle = '#120d14'; c.fillRect(x, h - bh, bw, bh);
    for (let y = h - bh + 2; y < h - 1; y += 3) for (let xx = x + 1; xx < x + bw - 1; xx += 2) if (r() > 0.45) { c.fillStyle = r() > 0.3 ? '#ffec27' : '#ffa300'; c.fillRect(xx, y, 1, 1); } x += bw + (r() > 0.6 ? 1 : 0); }
  return cv;
}
export const placeholderArt = (seed: string, w = 40, h = 30) => placeholderCanvas(seed, w, h).toDataURL();

/** รูปจริง → pixel art 16 สี + ordered dithering (ทำครั้งเดียวตอนโหลด ใช้เวลาไม่กี่ ms) */
export function pixelate(url: string, w = 56): Promise<string> {
  return new Promise(res => {
    const img = new Image(); img.onload = () => {
      const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth)), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const c = cv.getContext('2d', { willReadFrequently: true })!; c.imageSmoothingQuality = 'high'; c.drawImage(img, 0, 0, w, h);
      const id = c.getImageData(0, 0, w, h), d = id.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, t = (BAYER[y & 3][x & 3] / 16 - 0.5) * 48; let best = 0, bd = 1e9;
        const r0 = d[i] + t, g0 = d[i + 1] + t, b0 = d[i + 2] + t;
        PICO.forEach((p, k) => { const dd = (p[0] - r0) ** 2 + (p[1] - g0) ** 2 + (p[2] - b0) ** 2; if (dd < bd) { bd = dd; best = k; } });
        d[i] = PICO[best][0]; d[i + 1] = PICO[best][1]; d[i + 2] = PICO[best][2]; d[i + 3] = 255;
      }
      c.putImageData(id, 0, 0); res(cv.toDataURL());
    };
    img.onerror = () => res(placeholderArt(url)); img.src = url;
  });
}
