/** ป้ายชื่อของแต่ละ element ในทัวร์ (HUD) — เนื้อหาจริงอยู่ใน src/content (ไฟล์ .html) */
import type { StopId } from './shots';
export const stops: Record<StopId, { label: string; th: string; icon: string }> = {
  board: { label: 'CASE BOARD', th: 'Profile, education & experience', icon: 'pin' },
  trophy: { label: 'AWARDS', th: 'Trophies & certificates', icon: 'cup' },
  pc: { label: 'COMPUTER', th: 'Projects', icon: 'folder' },
  desk: { label: 'SIDE TABLE', th: 'Contact me', icon: 'phone' },
  resume: { label: 'PICTURE FRAME', th: 'My CV', icon: 'note' },
  music: { label: 'RECORDS', th: 'Music', icon: 'tape' },
};
