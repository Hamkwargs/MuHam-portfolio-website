/** intro สั้น ๆ ก่อนเข้าห้อง */
import * as THREE from 'three';
import { S } from './state';
import { blindSlats } from './room';

// ===== Intro สั้นๆ ก่อนเข้าห้อง: จอดำค่อยๆ สว่าง → ม่านเปิด → ไฟโต๊ะกะพริบติด → กล้องเลื่อนเข้าห้อง (ไม่มีข้อความ) =====
// คลิก/กดปุ่มใดๆ เพื่อข้าม · ปิด intro ได้โดยตั้ง INTRO.ENABLED = false
const INTRO = { ENABLED: true, END: 4.8, BAR_END_VH: 0 };   // BAR_END_VH: ความสูงแถบ letterbox ตอนจบ (0 = หายหมด · 6 = ค้างเป็นกรอบหนัง)
const introEl = document.getElementById('intro-fade');
const barTop = document.getElementById('top'), barBot = document.getElementById('bot');
const segT = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
S.introActive = INTRO.ENABLED && !new URLSearchParams(location.search).has('nointro') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
let introT = 0, introSpeed = 1;

function finishIntro() {
  S.introActive = false; S.introE = 1; S.introLight = 1;
  blindSlats.forEach(sl => { sl.rotation.x = -0.28; });
  S.lampOn = true;
  barTop.style.height = barBot.style.height = INTRO.BAR_END_VH + 'vh';
  if (INTRO.BAR_END_VH <= 0) barTop.style.display = barBot.style.display = 'none';   // หดเหลือ 0 แล้วซ่อน
  introEl.style.display = 'none';
  document.body.classList.remove('intro');
}
export function skipIntro() { introSpeed = 8; }
export function updateIntro(dt) {
  if (!S.introActive || !S.bootDone) return;   // เริ่มนับ intro หลังหน้า loading หายไปแล้ว
  introT += dt * introSpeed;
  const t = introT;
  S.introE = 1 - Math.pow(1 - segT(t, 1.7, 4.7), 3);                 // กล้องเลื่อนเข้า (ease-out)
  const b = segT(t, 2.3, 3.8); S.introLight = b * b * (3 - 2 * b);      // ม่านเปิด + แสงสาดเข้า
  blindSlats.forEach(sl => { sl.rotation.x = THREE.MathUtils.lerp(-1.5, -0.28, S.introLight); });
  S.lampOn = (t >= 3.0 && t < 3.12) || t >= 3.22;                        // ไฟโต๊ะกะพริบแล้วติด
  barTop.style.height = barBot.style.height = THREE.MathUtils.lerp(16, INTRO.BAR_END_VH, S.introE) + 'vh';
  introEl.style.opacity = String(1 - segT(t, 0.3, 1.6));
  if (t >= INTRO.END) finishIntro();
}
if (S.introActive) {
  S.lampOn = false; S.lampLevel = 0; S.introE = 0; S.introLight = 0;
  blindSlats.forEach(sl => { sl.rotation.x = -1.5; });
} else {
  finishIntro();
}
