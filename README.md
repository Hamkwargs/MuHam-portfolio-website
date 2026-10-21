# Voxel Room — Detective Office Portfolio

Vite + TypeScript + Three.js (r186) + GSAP

## Commands
```bash
npm install
npm run dev       # dev server (HMR)
npm run build     # tsc type-check + production build -> dist/
npm run preview   # serve dist/ locally
```

## How to use
- **Scroll / swipe / arrow keys** → the camera (GSAP) glides to the next element you have **not seen yet**
  (board → trophies → computer → side table → picture frame). Close something and the camera returns to the whole room.
- **Click an element / the caption / Enter** opens it. **Esc** or **click outside** goes back one level. The ☰ menu works any time.
- URL flags: `?nointro` skips the intro · `?debug` exposes `window.__room` · `?season=oct|dec|jan|feb|apr|jun|default` previews the seasonal corner.

## Editing content (no 3D code)
See **`HOW-TO-ADD-CONTENT.md`** — the single guide for content files (`.html`), images, albums/songs and the loading screen.

## Elements
| Element | What happens |
| --- | --- |
| Board | 3 paper groups + clutter on the real board. Profile / Education (polaroid per year) / Experience (polaroid per job). Case-file stack of HTML notes slides in from the right (any number of polaroids; 5+ shrink and scroll). |
| Trophies | One 3D voxel trophy (or framed certificate from `content/docs`) at a time. Random order when there are >3 items. |
| Computer | Zooms into the real CRT: project list with hover sneak-peek → case file (HTML). |
| Side table (by the door) | Phone + post-it (all contacts), playable Rubik's cube (click a face, Shift = reverse), newspaper with the real headlines of the day (Wikipedia "In the news", fallback Hacker News), key (→ inventory → door → next page), candle (lights itself when dark, smoke when you leave). Items can be dragged. |
| Picture frame | The CV: pixel in the room, sharp when inspected. Click it → view full / download PDF. |
| Records | Click an album to play it; the camera returns to the room. Now-playing bar controls the rest. |
| Title | "Folio de Dossier" floats in the middle of the room (Great Vibes + serif, pixelated). |
| Corner by the sofa | Shoes normally; monthly props (Jan gifts, Feb chocolates, Apr water gun, Jun pride flag, Oct pumpkin, Dec tree). |

## Structure
```
index.html
src/
  main.ts            entry + animate loop
  core/config/helpers/textures/room/furniture/lights/...   3D scene
  board-items.ts     paper groups on the board       frames.ts   picture frames + hidden folders
  records.ts         record crate + turntable         title3d.ts  floating site title
  side-table.ts      phone, rubik, newspaper, key, candle   rubik.ts news.ts   door.ts
  seasonal.ts        monthly corner prop
  rig.ts shots.ts tour.ts stage.ts ui.ts               camera shots (GSAP), scroll tour, module host, menu
  doc.ts data.ts assets.ts                             HTML content + asset loaders
  music.ts                                             album player
  ui/                sheet (case-file stack) · polaroid · dialog · inventory · player · cvviewer · art (pixelate)
  px/                pixel canvas UI (HUD, brackets, buttons)
  modules/           board · trophy · pc · desk · resume · music
  content/**/*.html  ALL text content (plain HTML, layout freely)
  assets/            images · audio · docs
public/loading.gif   loading-screen gif
  legacy-compat.ts   keeps the r128 look on new Three.js
```

## legacy-compat คืออะไร
Three.js r128 -> r186 เปลี่ยน color management และหน่วยของแสง ถ้าไม่ชดเชย ห้องจะสว่าง/จืดกว่าเดิม จึงทำดังนี้
- `ColorManagement.enabled = false` + ทุก renderer ใช้ `outputColorSpace = LinearSRGBColorSpace`
- ค่าแสงทุกดวงคูณ `LI` (= PI) เหมือน non-physical lights ของ r128
- แก้สูตร distance attenuation ของ Point/SpotLight กลับเป็นแบบเก่า
- `EffectComposer` ใช้ render target 8-bit เพื่อให้ bloom ไม่แรงเกินเดิม

อยากเปลี่ยนเป็น physically-correct lighting ภายหลัง: ลบ `legacy-compat.ts`, ลบ `* LI`, ตั้ง `outputColorSpace` กลับเป็น sRGB แล้วจูนค่าแสงใหม่

## Deploy (GitHub Pages)
push ขึ้น branch `main` แล้วเปิด Settings -> Pages -> Source: GitHub Actions
workflow อยู่ที่ `.github/workflows/deploy.yml` (ตั้ง `BASE_PATH` ให้อัตโนมัติ)

## Scripts
`npm run dev` · `npm run build` · `npm run assets` (photos → web copy + pixel copy)

## Next steps
1. Replace the sample content and add your photos/music (see `HOW-TO-ADD-CONTENT.md`).
2. Test on a real GPU, phones and other browsers.
