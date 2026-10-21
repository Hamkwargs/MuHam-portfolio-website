// Build-time image tool:  npm run assets
// Put ORIGINAL photos in  src/assets/images/_originals/  (any size, jpg/png/webp)
// For each one this writes into src/assets/images/ :
//   <name>.jpg        web-optimised copy (max 1400px wide, quality 82)         -> shown when the visitor clicks to see it
//   <name>-pixel.png  tiny 8-bit version (64px wide, 16 colours, dithered)     -> shown by default (no runtime processing)
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';

const SRC = 'src/assets/images/_originals', OUT = 'src/assets/images', PIX = Number(process.env.PIXEL_WIDTH || 64);
if (!existsSync(SRC)) { console.log(`Create ${SRC} and put your photos there.`); process.exit(0); }
mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter(f => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f));
if (!files.length) console.log(`No images found in ${SRC}`);
for (const f of files) {
  const { name } = parse(f), input = join(SRC, f);
  await sharp(input).rotate().resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, `${name}.jpg`));
  await sharp(input).rotate().resize({ width: PIX, kernel: 'lanczos3' }).modulate({ saturation: 1.15 }).png({ palette: true, colours: 16, dither: 0.9, effort: 8 }).toFile(join(OUT, `${name}-pixel.png`));
  console.log(`✓ ${f} -> ${name}.jpg + ${name}-pixel.png`);
}
