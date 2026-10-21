/** สร้างกรอบ pixel-art (9-slice) สำหรับ DOM ด้วย canvas แล้วเก็บเป็น CSS variable: border-image: var(--pxb-paper) 3 fill / 12px */
const MAP = ['..bbbbb..', '.bfffffb.', 'bfffffffb', 'bfffffffb', 'bfffffffb', 'bfffffffb', 'bfffffffb', '.bfffffb.', '..bbbbb..'];
export function pixelBorder(border: string, fill: string): string {
  const c = document.createElement('canvas'); c.width = c.height = 9; const x = c.getContext('2d')!;
  MAP.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; x.fillStyle = ch === 'b' ? border : fill; x.fillRect(i, j, 1, 1); }));
  return `url(${c.toDataURL()})`;
}
const root = document.documentElement.style;
root.setProperty('--pxb-paper', pixelBorder('#463427', '#f3ead4'));
root.setProperty('--pxb-sheet', pixelBorder('#5a3520', '#e9dfc4'));
root.setProperty('--pxb-night', pixelBorder('#f4b73c', '#1d1526'));
root.setProperty('--pxb-crt', pixelBorder('#6be39a', '#0c2218'));
root.setProperty('--pxb-red', pixelBorder('#8c231f', '#d23a2f'));
root.setProperty('--pxb-sticky', pixelBorder('#a8741a', '#ffe27a'));
