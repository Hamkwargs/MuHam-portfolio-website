/** ประตูข้างโต๊ะ: ล็อกอยู่จนกว่าจะเก็บกุญแจจากโต๊ะ → ไขแล้วแสดงปุ่มไปหน้าถัดไป (ตั้งค่าที่ src/content/site.html) */
import * as THREE from 'three';
import { scene } from './core';
import { drX, drZ, drW, drH } from './room';
import { registerInteractable } from './interactables';
import { inventory } from './ui/inventory';
import { showDialog } from './ui/dialog';
import { site } from './data';

const hit = new THREE.Mesh(new THREE.BoxGeometry(0.1, drH, drW), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
hit.position.set(drX - 0.02, drH / 2, drZ);
const group = new THREE.Group(); group.add(hit); scene.add(group);
registerInteractable(group, { name: 'Door', title: 'The door', desc: 'Where does it lead?', type: 'door', noHighlight: true, center: new THREE.Vector3(drX - 0.1, 1.3, drZ) });

export function useDoor() {
  if (!inventory.has('key')) { showDialog({ name: 'DOOR', text: site.doorLocked, autoHide: 4200 }); return; }
  showDialog({ name: 'DOOR', text: site.doorOpen, actions: [{ label: `▶ ${site.nextLabel}`, href: site.nextPage }, { label: 'Stay here' }] });
}
