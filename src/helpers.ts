/** ฟังก์ชันช่วย: rnd, box() สร้าง voxel, pixTex() สร้าง pixel texture */
import * as THREE from 'three';
import { scene } from './core';

export const rnd = (a, b) => a + Math.random() * (b - a);

interface BoxOpts {
  r?: number; m?: number; e?: number; ei?: number; map?: THREE.Texture | null; a?: number;
  cs?: boolean; rs?: boolean; rx?: number; ry?: number; rz?: number; parent?: THREE.Object3D;
}
export function box(x, y, z, w, h, d, color, o: BoxOpts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.88, metalness: o.m ?? 0.05,
    emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1,
    map: o.map || null, transparent: !!o.a, opacity: o.a ?? 1
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = o.cs ?? true;
  mesh.receiveShadow = o.rs ?? true;
  if (o.rx) mesh.rotation.x = o.rx;
  if (o.ry) mesh.rotation.y = o.ry;
  if (o.rz) mesh.rotation.z = o.rz;
  if (o.parent) o.parent.add(mesh);
  else scene.add(mesh);
  return mesh;
}

export function pixTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
