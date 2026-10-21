/** ตัวกลางของ "โมดูล" ที่เปิดเมื่อคลิก element (board/trophy/pc/tools/desk/resume) + pixel UI layer */
import { PxLayer, type Ctx } from './px/pixel';
import { chipsBegin, chipsFlush } from './px/util';
import { S } from './state';
import { flyTo, flyOverview } from './rig';
import { SHOTS, type StopId } from './shots';
import * as THREE from 'three';
import gsap from 'gsap';
import { scene } from './core';
import { camera } from './core';
import { LI } from './legacy-compat';
import { weatherState } from './weather-state';
import { bloomPass } from './postprocessing';
import { BLOOM } from './config';

/**
 * ปรับแสงตอนซูมเข้าไปดูของ (กันภาพไหม้/overexposure ที่บอร์ดและของอื่น ๆ):
 *  - ปิดไฟตั้งโต๊ะ (S.lampScale → 0) เพราะอยู่ใกล้ของที่ดู ทำให้ไหม้ง่าย
 *  - หรี่แสงแดดจากหน้าต่าง (S.focusDim) และ bloom ลง
 *  - ไฟส่องวัตถุ (headlight) ปรับตามสภาพอากาศ: กลางวัน/ฟ้าครึมสว่างอยู่แล้ว → ใช้น้อย · กลางคืนมืด → ใช้มากขึ้น
 */
const HEADLIGHT = { day: 0.3, overcast: 0.35, dusk: 0.5, night: 1.0, nightCloud: 1.0 } as Record<string, number>;
const focusLighting = (on: boolean) => {
  gsap.to(S, { lampScale: on ? 0 : 1, focusDim: on ? 1 : 0, duration: on ? 0.9 : 0.8, ease: 'power2.out', overwrite: 'auto' });
  gsap.to(bloomPass, { strength: on ? BLOOM * 0.45 : BLOOM, duration: 0.9, overwrite: 'auto' });
  gsap.to(headlight, { intensity: on ? (HEADLIGHT[weatherState.mood] ?? 0.6) * LI : 0, duration: on ? 1.0 : 0.8, overwrite: 'auto' });
};

/** ไฟส่องวัตถุตอน inspect: ติดตามกล้อง สว่างพอให้เห็นชัดแม้ห้องมืด */
const headlight = new THREE.PointLight(0xffe9cf, 0, 5.5, 1.3); scene.add(headlight);

export const layer = new PxLayer(document.getElementById('px-ui') as HTMLCanvasElement);

export interface StageModule {
  id: StopId;
  flightDur?: number;
  enter?(): void;
  open(): void;
  close(): void;
  draw?(c: Ctx, w: number, h: number, t: number): void;
  update?(dt: number, t: number): void;
  /** คืน true ถ้าจัดการ event เองแล้ว (คลิกที่ไม่มีใครรับ = คลิกนอก → ถอยหนึ่งชั้น/ปิดโมดูล) */
  pointer?(kind: 'move' | 'down' | 'up' | 'click', x: number, y: number, ev: MouseEvent): boolean | void;
  /** ปิดชั้นรายละเอียดที่เปิดอยู่ (คืน true ถ้ามีอะไรให้ปิด) ถ้าไม่มี stage จะปิดทั้งโมดูล */
  back?(): boolean;
  /** true = กำลังอยู่ชั้นย่อยของโมดูล (ปุ่ม BACK จะเขียนว่า BACK เฉย ๆ แทน BACK TO ROOM) */
  inner?(): boolean;
  key?(e: KeyboardEvent): boolean | void;
  wheel?(e: WheelEvent): boolean | void;
}

export const stage = {
  active: null as StageModule | null,
  opened: false,
  /** true = โมดูลนี้ถูกเปิดโดย tour (เลื่อนเมาส์) → บางโมดูล (CV, โทรศัพท์) โชว์คำใบ้ให้คลิกแทนที่จะเปิดเอง */
  tourDriven: false,
  modules: new Map<StopId, StageModule>(),
  visited: new Set<StopId>(),
  hud: null as null | ((c: Ctx, w: number, h: number, t: number) => void),
  returnTo: () => flyOverview(),
  cursor: 'default',
  px: 0, py: 0,
};

export const registerModule = (m: StageModule) => stage.modules.set(m.id, m);

export function openModule(id: StopId, after?: () => void) {
  if (S.introActive) return;
  const m = stage.modules.get(id); if (!m || stage.active === m) return;
  if (stage.active) { const old = stage.active; stage.active = null; old.close(); }
  stage.active = m; stage.opened = false; stage.visited.add(id);
  document.body.classList.add('module-open');
  document.getElementById('tooltip')?.classList.remove('show');
  m.enter?.(); focusLighting(true);
  flyTo(SHOTS[id].focus, { dur: m.flightDur ?? 1.5, onComplete: () => { if (stage.active === m) { stage.opened = true; m.open(); after?.(); } } });
}
export function closeModule() {
  const m = stage.active; if (!m) return;
  stage.active = null; stage.opened = false;
  document.body.classList.remove('module-open');
  m.close(); focusLighting(false); stage.returnTo();
}

export function frame(dt: number, t: number) {
  headlight.position.copy(camera.position).add(new THREE.Vector3(0, 0.25, 0));
  const c = layer.ctx; layer.clear(); chipsBegin();
  if (stage.active) { stage.active.update?.(dt, t); stage.active.draw?.(c, layer.w, layer.h, t); }
  else if (!S.introActive) stage.hud?.(c, layer.w, layer.h, t);
  chipsFlush();
  layer.canvas.style.cursor = stage.cursor;
}

// ---- pointer/keyboard forwarding ----
const KEEP = '[data-keep], #menu-btn, #menu-panel, #vision-btn, #cv-viewer';
const fwd = (kind: 'move' | 'down' | 'up' | 'click') => (e: MouseEvent) => {
  const p = layer.toLogical(e.clientX, e.clientY); stage.px = p.x; stage.py = p.y;
  const m = stage.active; if (!m) return;
  // composedPath() ถูกจดไว้ตอน event เริ่ม — ถึงปุ่มที่กดจะถูกสร้างใหม่/ถูกถอดออกจาก DOM ระหว่างจัดการ (เช่น ปุ่ม next ของถ้วยรางวัล) ก็ยังรู้ว่าคลิกอยู่ในแผง
  const path = e.composedPath() as HTMLElement[]; if (path.some(n => n.matches?.(KEEP))) return;
  const consumed = m.pointer?.(kind, p.x, p.y, e);
  if (kind === 'click' && !consumed) { if (!m.back?.()) closeModule(); }   // คลิกที่อื่นเพื่อออก
};
addEventListener('pointermove', fwd('move')); addEventListener('pointerdown', fwd('down'));
addEventListener('pointerup', fwd('up')); addEventListener('click', fwd('click'));
addEventListener('keydown', e => {
  const m = stage.active; if (!m) return;
  if (m.key?.(e)) { (e as any)._modHandled = true; return; }
  if (e.key === 'Escape') { if (!m.back?.()) closeModule(); }
});
addEventListener('wheel', e => { if (stage.active) stage.active.wheel?.(e); }, { passive: true });
