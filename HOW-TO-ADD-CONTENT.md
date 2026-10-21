# วิธีเพิ่มเนื้อหา รูป และเพลง (คู่มือฉบับเดียว)

ทุกอย่างอยู่ในโฟลเดอร์ `src/` — **เพิ่มหรือแก้ไฟล์แล้วเว็บอัปเดตเอง ไม่ต้องแก้โค้ด** (ถ้ารัน `npm run dev` อยู่ จะเห็นผลทันที)
ชื่อไฟล์แยกตัวพิมพ์เล็ก/ใหญ่ (`Photo.JPG` ≠ `photo.jpg`) · ถ้าไฟล์ยังไม่มี เว็บจะใช้ภาพตัวอย่างแทน ไม่พัง

```
src/
  content/   ข้อความทั้งหมด เขียนเป็นไฟล์ .html (ข้อ 1)
  assets/
    images/  รูปทุกชนิด (ข้อ 2)
    audio/   เพลง แยกโฟลเดอร์ตามอัลบั้ม (ข้อ 3)
    docs/    ไฟล์ให้ดาวน์โหลด เช่น cv.pdf (ข้อ 4)
public/
  loading.gif   gif หน้า loading
```

---

## 1) ไฟล์เนื้อหา (`src/content/**/*.html`)

ไฟล์ละ 1 รายการ แต่ละไฟล์มี 2 ส่วน: **ข้อมูล** (`<meta>`) กับ **เนื้อหา** (HTML ธรรมดา จัดหน้าเองได้เต็มที่)

```html
<!doctype html>
<meta charset="utf-8">
<meta name="order" content="1">
<meta name="title" content="Year 1">
<meta name="school" content="Example University">
<meta name="period" content="2022 – 2023">
<meta name="caption" content="Freshman year">
<meta name="photo" content="year1.jpg">

<h3>Year 1 · Foundations</h3>
<p><strong>Example University</strong></p>
<ul><li>Programming fundamentals</li></ul>
```

* `order` = ลำดับ (เลขน้อยขึ้นก่อน) · ถ้าไม่ใส่ จะเรียงตามชื่อไฟล์
* ชื่อไฟล์อะไรก็ได้ แนะนำขึ้นต้นด้วยเลข `01-…`, `02-…`
* เนื้อหาใช้ tag ได้ทุกอย่าง (`h2 h3 p ul ol table img a blockquote div` …) และใส่ `class` / `style=""` ได้
* class สำเร็จรูปสำหรับจัดหน้า: `cols` (คอลัมน์อัตโนมัติ), `cols-2`, `cols-3`, `gallery` (ตารางรูป), `callout` (กล่องเน้น), `tags` (ป้ายแท็ก), `center`, `right`, `muted`
* ถูกลบออกอัตโนมัติเพื่อความปลอดภัย: `<script> <iframe> <style> <form>` และ `onclick=` ฯลฯ (ใช้ `style=""` แทน `<style>`)
* **ตัวอย่างพร้อมก๊อป**: `src/content/_templates/entry.html` (โฟลเดอร์ `_templates` เว็บไม่โหลด)

### แต่ละโฟลเดอร์คืออะไร

| โฟลเดอร์ / ไฟล์ | ควบคุมอะไร | `<meta>` ที่ใช้ |
| --- | --- | --- |
| `profile/profile.html` | ชื่อ ตำแหน่ง ข้อความแนะนำตัว (กลุ่มโปรไฟล์บนบอร์ด) | `name role tagline class level photo photoPixel` |
| `education/*.html` | 1 ไฟล์ = 1 โพลารอยด์ (กลุ่มซ้ายล่างของบอร์ด) | `order title school period caption photo` |
| `experience/*.html` | 1 ไฟล์ = 1 โพลารอยด์ (กลุ่มขวาล่างของบอร์ด) | `order title company period caption photo` |
| `awards/*.html` | 1 ไฟล์ = 1 ถ้วยรางวัล | `order title year org kind caption photo` (`kind` = `cup` / `star` / `medal`) |
| `docs/*.html` | ใบประกาศนียบัตร (แสดงเป็นกรอบใบเซอร์ในมุมมองถ้วยรางวัล) | `order tab title issuer date image` |
| `projects/*.html` | โปรเจกต์บนคอมพิวเตอร์ | `order title year role status hook difficulty impact tags link photo` (`status` = `SOLVED` / `ONGOING`, `difficulty`/`impact` = 1–5, `tags` คั่นด้วย `,`) |
| `albums/*.html` | ปกอัลบั้มแผ่นเสียง | `order title artist folder cover color` (ดูข้อ 3) |
| `contact/contact.html` | โพสต์อิทข้างโทรศัพท์ | 1 `<li>` ต่อ 1 ช่องทาง: `<li><a data-label="EMAIL" href="mailto:me@x.com">me@x.com</a></li>` |
| `site.html` | ประตูพาไปหน้าถัดไปเมื่อเจอกุญแจ | `nextLabel nextPage doorLocked doorOpen` |

### ใส่ได้กี่รายการ? (ไม่จำกัด)

* **Education / Experience**: เพิ่มไฟล์กี่ไฟล์ก็ได้ — 4 ใบแรกแสดงขนาดปกติ, 5 ใบขึ้นไปโพลารอยด์จะ**ย่อลงเองและเลื่อน (scroll) ได้**, กดลูกศร ← ↑ → ↓ เพื่อเปลี่ยนใบ (ถ้ามีมากกว่าหนึ่ง) · ถ้าโฟลเดอร์ว่าง จะขึ้นข้อความ "Nothing here yet" แทนที่จะพัง
* **Awards / docs**: เพิ่มได้ไม่จำกัด ปุ่ม ◀ ▶ (หรือลูกศรบนคีย์บอร์ด/ล้อเมาส์) เลื่อนดูทีละชิ้น ไม่ปิดหน้าต่าง · เกิน 3 ชิ้นจะสุ่มลำดับทุกครั้งที่เปิด
* **Projects**: เพิ่มได้ไม่จำกัด รายการบนจอคอมจะเลื่อนได้เอง
* รูปภาพ**ในเนื้อหา**ของแต่ละรายการ: ใส่กี่รูปก็ได้ (`<img>` หลายอัน หรือใช้ `<div class="gallery">`)
* หมายเหตุ: กระดาษ/โน้ต/รูปที่แปะบนบอร์ด 3 มิติเป็นของตกแต่งตายตัว ไม่ได้เพิ่มตามจำนวนไฟล์ — ที่เพิ่มตามไฟล์คือโพลารอยด์ในหน้าต่างที่เปิดตอนคลิกกลุ่มนั้น

---

## 2) รูปภาพ (`src/assets/images/`)

**วิธีที่ถูกต้อง (แนะนำ)**

1. วางรูปต้นฉบับ (ขนาดเท่าไหร่ก็ได้) ไว้ที่ `src/assets/images/_originals/`
2. รัน `npm run assets` — สคริปต์จะสร้างให้ในโฟลเดอร์ `images/`
   * `ชื่อ.jpg` — ฉบับย่อสำหรับเว็บ (กว้างไม่เกิน 1400px ราว 100 KB) แสดงตอนคลิกดูรูปจริง
   * `ชื่อ-pixel.png` — ฉบับ pixel 8-bit (ราว 1–3 KB) แสดงเป็นค่าเริ่มต้น
3. อ้างถึงรูปด้วยชื่อปกติ เช่น `photo: kyoto.jpg` — ถ้ามี `kyoto-pixel.png` เว็บจะใช้เอง ไม่ต้องประมวลผลในเบราว์เซอร์ผู้เข้าชม

ข้ามขั้นที่ 2 ได้: วางรูปลงใน `images/` ตรง ๆ เว็บจะแปลงเป็น pixel ให้ตอนเปิดดู (ใช้ได้ แต่รูปจากมือถือ 12 ล้านพิกเซลจะโหลดช้า — ควรรัน `npm run assets`)

**อ้างรูปจากที่ไหนได้บ้าง**

| ที่ใช้ | เขียนอย่างไร |
| --- | --- |
| โพลารอยด์ของ education / experience / awards | `<meta name="photo" content="kyoto.jpg">` (ข้อความใต้รูปมาจาก `caption`) |
| ใบประกาศใน `docs/` | `<meta name="image" content="toeic.png">` (สแกนใบเซอร์) |
| ในเนื้อหา (ทุกไฟล์) | `<img src="kyoto.jpg" alt="คำอธิบาย">` — ใส่กี่รูปก็ได้ รูปจะเป็น pixel จนกว่าผู้ชมจะคลิก |
| ปกอัลบั้ม | `<meta name="cover" content="noir-cover.png">` |
| รูปโปรไฟล์ | `<meta name="photo" content="profile.jpg">` ใน `profile.html` (ทำ `profile-pixel.png` เองก็ได้ ระบุที่ `photoPixel`) |

ชื่อพิเศษ: `cv.png` = CV แบบรูปในกรอบภาพใหญ่ (A4 แนวตั้ง เช่น 1240×1754) · `frame-pixel.png` / `frame-real.jpg` = รูปในกรอบเล็กข้าง ๆ (ไม่บังคับ)
อยากให้รูปใดแสดงคมชัดเสมอ (ไม่เป็น pixel): ใส่ `data-nopixel` เช่น `<img src="logo.png" data-nopixel>` · รูปจากเว็บอื่น (`https://…`) จะแสดงปกติเสมอ

---

## 3) เพลง — 1 อัลบั้ม มีหลายเพลงทำอย่างไร

**หลักการ: อัลบั้ม = 1 โฟลเดอร์เสียง + 1 ไฟล์ปก (`.html`)**  เพลงทุกไฟล์ในโฟลเดอร์นั้นคือเพลงของอัลบั้มนั้นอัตโนมัติ

ตัวอย่าง อัลบั้ม "Midnight Case Files" มี 3 เพลง:

1. สร้างโฟลเดอร์ `src/assets/audio/noir/` แล้วใส่เพลง (mp3 / ogg / wav / m4a / flac):
   ```
   src/assets/audio/noir/
     01-first-song.mp3
     02-second-song.mp3
     03-third-song.mp3
   ```
2. สร้างปกอัลบั้ม `src/content/albums/01-noir.html`:
   ```html
   <!doctype html>
   <meta charset="utf-8">
   <meta name="order" content="1">
   <meta name="title" content="Midnight Case Files">
   <meta name="artist" content="Detective FM">
   <meta name="folder" content="noir">           <!-- ชื่อโฟลเดอร์จากข้อ 1 -->
   <meta name="cover" content="noir-cover.png">  <!-- (ไม่บังคับ) รูปจาก images/ -->
   <meta name="color" content="#d23a2f">         <!-- สีซองเมื่อไม่มีปก -->
   <p>คำอธิบายอัลบั้ม (ไม่บังคับ)</p>
   ```

**อยากได้อัลบั้มที่ 2** → ทำซ้ำ: โฟลเดอร์ใหม่ `src/assets/audio/rain/` + ไฟล์ `src/content/albums/02-rain.html` (`folder` = `rain`)

กฎการตั้งชื่อ
* ชื่อไฟล์เพลงในอัลบั้มเดียวกัน**ไม่ต้องมีส่วนที่เหมือนกัน** — อัลบั้มถูกกำหนดด้วย*โฟลเดอร์* ไม่ใช่ชื่อไฟล์
* ลำดับเพลง = ตัวอักษรของชื่อไฟล์ → ขึ้นต้นด้วยเลข `01-`, `02-` (ถ้ามีเกิน 9 เพลงใช้ `01`–`12` สองหลักเสมอ)
* ชื่อที่แสดงใน Now playing = ชื่อไฟล์ตัดเลขนำหน้าและนามสกุล, `-` `_` กลายเป็นเว้นวรรค: `03-rainy-window.mp3` → **rainy window** (เอาเมาส์ชี้ชื่อเพื่อดูชื่อไฟล์จริง)
* ชื่อเพลงซ้ำกันข้ามอัลบั้มได้ (คนละโฟลเดอร์)
* ถ้าไม่ใส่ `folder` เว็บจะใช้ชื่อไฟล์ปก (เช่น `01-noir`) เป็นชื่อโฟลเดอร์
* กดอัลบั้มบนชั้นแผ่นเสียง = เล่นเพลงแรก, เล่นจบเพลงจะไปเพลงถัดไปเอง และวนกลับเพลงแรกเมื่อจบอัลบั้ม; ใช้ ⏮ ⏯ ⏭ ที่แถบ Now playing
* ไฟล์ `sample-tone` สองไฟล์ในโฟลเดอร์ `noir/` เป็นเสียงตัวอย่าง ลบทิ้งเมื่อใส่เพลงจริง

---

## 4) เอกสารดาวน์โหลด (`src/assets/docs/`)

| ไฟล์ | ใช้ทำอะไร |
| --- | --- |
| `cv.pdf` | ปุ่ม "Download PDF" (หน้าดู CV, เมนูคลิกขวา, Player File) |

---

## 5) หน้า loading

ใช้ gif ที่ `public/loading.gif` (เปลี่ยนรูปได้โดยแทนที่ไฟล์นี้ชื่อเดิม; แนะนำสัดส่วน 16:9 พื้นดำ) — ระยะเวลาแสดงขั้นต่ำตั้งที่ `BOOT_MIN_MS` ใน `src/main.ts`
แถบดำบน/ล่างตอนจบ intro ตั้งที่ `BAR_END_VH` ใน `src/intro.ts` (`0` = หายหมด, `6` = ค้างเป็นกรอบหนัง)

---

## ตรวจก่อนอัปโหลด

```bash
npm run build     # ตรวจ type + สร้างเว็บ (dist/)
npm run preview   # ดูผลลัพธ์จริง
```
