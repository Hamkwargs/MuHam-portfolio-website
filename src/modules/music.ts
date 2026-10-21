/** โมดูล "แผ่นเสียง": คลิกอัลบั้มเพื่อเล่นทันที (หรือกดหยุด) แล้วกล้องกลับมามองห้องเลย — เพลงเล่นต่อ ดู/สั่งได้จากแถบ Now playing */
import * as THREE from 'three';
import gsap from 'gsap';
import { LI } from '../legacy-compat';
import { camera, scene } from '../core';
import { REC, sleeves, platter, type Sleeve } from '../records';
import { player } from '../music';
import { registerModule, closeModule } from '../stage';
import { brackets, screenBoxObj } from '../px/util';
import { showDialog } from '../ui/dialog';
import { PAL } from '../px/palette';
import { panel, text, button, inside, type Rect } from '../px/pixel';
import '../ui/player';

const fill = new THREE.PointLight(0xffe6bd, 0, 3.4, 1.5); fill.position.set(REC.x + 0.4, 1.3, REC.z + 0.9); scene.add(fill);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let ready = false, hover: Sleeve | null = null, hoverStop = false, stopR: Rect = { x: 0, y: 0, w: 0, h: 0 };
const pick = (cx: number, cy: number): Sleeve | null => { ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(sleeves.map(s => s.group), true); if (!h.length) return null; let o: THREE.Object3D | null = h[0].object; while (o && !sleeves.some(s => s.group === o)) o = o.parent; return sleeves.find(s => s.group === o) ?? null; };

registerModule({
  id: 'music', flightDur: 1.5,
  enter() { gsap.to(fill, { intensity: 1.0 * LI, duration: 1.1 }); },
  open() { ready = true; },
  close() { ready = false; hover = null; gsap.to(fill, { intensity: 0, duration: 1 }); },
  update(dt) { if (player.playing) platter.rotation.y -= dt * 2.2; },
  pointer(kind, x, y, ev) {
    if (!ready) return false;
    if (kind === 'move') { hoverStop = player.playing && inside(x, y, stopR); hover = pick(ev.clientX, ev.clientY); document.body.style.cursor = hover || hoverStop ? 'pointer' : 'default'; }
    else if (kind === 'click') {
      if (player.playing && inside(x, y, stopR)) { player.stop(); closeModule(); return true; }
      const s = pick(ev.clientX, ev.clientY);
      if (s) { if (!player.play(s.album, 0)) showDialog({ name: 'RECORDS', text: 'No tracks in this album yet. Add audio files to src/assets/audio/ (see HOW-TO-ADD-CONTENT.md).', autoHide: 4500 }); closeModule(); return true; }
    }
    return false;
  },
  draw(c, w, h) {
    if (!ready) return;
    sleeves.forEach(s => brackets(c, screenBoxObj(s.group, w, h), s.data.title.toUpperCase(), hover === s));
    panel(c, w / 2 - 92, h - 34, 184, 20, { fill: PAL.night, border: PAL.amber, light: PAL.plum }); text(c, 'Pick an album to play it', w / 2, h - 20, { font: 'bold', size: 11, color: PAL.paper, align: 'center' });
    if (player.playing) { stopR = { x: w / 2 - 50, y: h - 62, w: 100, h: 20 }; button(c, '■ STOP MUSIC', stopR, { hot: hoverStop, color: PAL.red, size: 7 }); }
  },
});
// เล่นต่อเนื่องแม้ไม่ได้เปิดโมดูล: หมุนแผ่นบนเครื่องเล่น
const spin = () => { if (player.playing) platter.rotation.y -= 0.03; requestAnimationFrame(spin); }; spin();
