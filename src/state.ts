/** shared mutable state (S) และ hooks */
/** ตัวแปร mutable ที่หลายโมดูลใช้ร่วมกัน (ES module แก้ค่า let ข้ามไฟล์ไม่ได้ เลยรวมไว้ที่นี่) */
export const S: Record<string, any> = {
  lampScale: 1,
  currentTemp: 29,
  activeLampLighting: undefined,
  hoveredItem: null,
  detectiveVision: false,
  toastTimer: null,
  lampOn: true,
  lampLevel: 1,
  introActive: undefined,
  bootDone: false,
  tutorialActive: false,   // true เฉพาะตอนสมุดโน้ตเปิดอยู่
  focusDim: 0,
  introE: 1,
  introLight: 1,
  prevMood: undefined,
};

