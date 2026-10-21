/** แสงหลักของห้อง (ambient, hemisphere, window spot, neon) */
import * as THREE from 'three';
import { LI } from './legacy-compat';
import { scene } from './core';

// =========================================================================
// สภาพแวดล้อม: แสง, ท้องฟ้า, ฝน และลำแสง
// =========================================================================
export const ambientLight = new THREE.AmbientLight(0x402b1f, 0.85 * LI);
scene.add(ambientLight);

export const hemiLight = new THREE.HemisphereLight(0xffdfa8, 0x1f1109, 0.4 * LI);
scene.add(hemiLight);

export const windowLight = new THREE.SpotLight(0xffc77d, 9.5 * LI, 30, 0.75, 0.45, 1.2);
windowLight.position.set(0, 2.5, -7.5);
windowLight.target.position.set(0, 0.3, 0.5);
windowLight.castShadow = true;
windowLight.shadow.mapSize.set(2048, 2048);
windowLight.shadow.bias = -0.0004;
scene.add(windowLight, windowLight.target);

export const neonOutside = new THREE.PointLight(0x1a75ff, 0, 10, 2);
neonOutside.position.set(-1.8, 1.8, -3.2);
scene.add(neonOutside);
