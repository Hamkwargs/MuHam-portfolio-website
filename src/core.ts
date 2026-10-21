/** canvas/renderer/scene/camera หลัก + renderer แยกของลำแสงและฝุ่น */
import * as THREE from 'three';

const mainCanvas = document.getElementById('scene-canvas');
export const renderer = new THREE.WebGLRenderer({ canvas: mainCanvas, antialias: false });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0704);
export const sceneFog = new THREE.FogExp2(0x28160c, 0.032);
scene.fog = sceneFog;
export const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

const rayCanvas = document.getElementById('ray-canvas');
export const rayRenderer = new THREE.WebGLRenderer({ canvas: rayCanvas, alpha: true, antialias: true });
rayRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
rayRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
export const rayScene = new THREE.Scene();

// NEW: renderer/scene แยกสำหรับ dust (normal blend ไม่ผ่าน screen)
const dustCanvas = document.getElementById('dust-canvas');
export const dustRenderer = new THREE.WebGLRenderer({ canvas: dustCanvas, alpha: true, antialias: true });
dustRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
dustRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
export const dustScene = new THREE.Scene();
