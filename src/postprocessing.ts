/** EffectComposer + bloom */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BLOOM } from './config';
import { camera, renderer, scene } from './core';

// Composer
// r128 ใช้ render target แบบ 8-bit (clamp ที่ 1.0) -> คงไว้เพื่อให้ bloom ไม่แรงเกินเดิม
export const composer = new EffectComposer(
  renderer,
  new THREE.WebGLRenderTarget(256, 256, { type: THREE.UnsignedByteType })
);
composer.addPass(new RenderPass(scene, camera));
export const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), BLOOM, 0.7, 0.75);
composer.addPass(bloomPass);
