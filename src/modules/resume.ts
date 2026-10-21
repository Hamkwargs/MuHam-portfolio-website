/**
 * โมดูล "กรอบรูป CV"
 * - คลิกกรอบในห้อง → ซูมแล้วเปิด CV จริงทันที (ตัวดู CV มีปุ่มดาวน์โหลด PDF)
 * - มาถึงด้วย tour (เลื่อนเมาส์) → ซูมแล้วโชว์คำใบ้ "คลิกเพื่อเปิด CV" ให้เลือกเอง
 */
import * as THREE from 'three';
import { camera } from '../core';
import { cvPic, setCvCrisp } from '../frames';
import { registerModule, closeModule, stage } from '../stage';
import { cvViewer } from '../ui/cvviewer';
import { screenBox, brackets } from '../px/util';

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let peek = false;
const onPic = (ev: MouseEvent) => { ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObject(cvPic, false).length > 0; };
function openViewer() {
  peek = false;
  cvViewer.open(() => { if (stage.tourDriven) setTimeout(() => { peek = true; }, 60); else closeModule(); });
}

registerModule({
  id: 'resume', flightDur: 1.5,
  enter() { setCvCrisp(true); },
  open() { if (stage.tourDriven) peek = true; else openViewer(); },
  close() { peek = false; cvViewer.close(); setCvCrisp(false); },
  back() { if (cvViewer.isOpen) { cvViewer.close(); return true; } return false; },
  pointer(kind, _x, _y, ev) {
    if (!peek) return false;
    const hit = onPic(ev);
    if (kind === 'move') document.body.style.cursor = hit ? 'pointer' : 'default';
    if (kind === 'click' && hit) { openViewer(); return true; }
    return false;
  },
  draw(c, w, h, t) {
    if (!peek) return;
    brackets(c, screenBox(cvPic, w, h), Math.floor(t * 2) % 2 ? 'Click to open my CV' : 'Click to open my CV  \u25b8', true);
  },
});
