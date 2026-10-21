/** กล้องแบบ "shot": GSAP ขยับ rig ส่วน animate() จะผสมกับกล้อง parallax ปกติด้วยค่า mix */
import * as THREE from 'three';
import gsap from 'gsap';
import { camera } from './core';
import { cameraLook } from './ui-camera';

gsap.ticker.lagSmoothing(0); // ให้ tween ตามเวลาจริงแม้เฟรมช้า

export interface Shot { pos: THREE.Vector3; look: THREE.Vector3; parallax?: number }
export const shot = (px: number, py: number, pz: number, lx: number, ly: number, lz: number, parallax = 0.05): Shot =>
  ({ pos: new THREE.Vector3(px, py, pz), look: new THREE.Vector3(lx, ly, lz), parallax });

/** mix: 0 = กล้องปกติตามเมาส์ · 1 = กล้องตาม rig */
export const rig = { mix: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), parallax: 0.05 };

export function flyTo(s: Shot, o: { dur?: number; ease?: string; onComplete?: () => void } = {}) {
  gsap.killTweensOf(rig); gsap.killTweensOf(rig.pos); gsap.killTweensOf(rig.look);
  if (rig.mix < 0.001) { rig.pos.copy(camera.position); rig.look.copy(cameraLook); }
  rig.mix = 1;
  const dur = o.dur ?? 1.5, ease = o.ease ?? 'power3.inOut';
  gsap.to(rig.pos, { x: s.pos.x, y: s.pos.y, z: s.pos.z, duration: dur, ease });
  gsap.to(rig.look, { x: s.look.x, y: s.look.y, z: s.look.z, duration: dur, ease });
  gsap.to(rig, { parallax: s.parallax ?? 0.05, duration: dur, ease, onComplete: o.onComplete });
}
export function flyOverview(dur = 1.4) {
  gsap.killTweensOf(rig); gsap.killTweensOf(rig.pos); gsap.killTweensOf(rig.look);
  gsap.to(rig, { mix: 0, duration: dur, ease: 'power2.inOut' });
}
