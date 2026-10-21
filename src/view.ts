/** resize, toScreenXY, scatterDust */
import * as THREE from 'three';
import { S } from './state';
import { PIXEL } from './config';
import { camera, dustRenderer, rayRenderer, renderer } from './core';
import { rnd } from './helpers';
import { DUST_COUNT, cornerMat, dustGeo, dustMat } from './atmosphere';
import { weatherState } from './weather-state';
import { composer } from './postprocessing';

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const pw = Math.max(1, Math.floor(w / PIXEL));
  const ph = Math.max(1, Math.floor(h / PIXEL));
  renderer.setPixelRatio(1);
  renderer.setSize(pw, ph, false);
  composer.setSize(pw, ph);

  rayRenderer.setSize(w, h);
  dustRenderer.setSize(w, h);
  [dustMat, cornerMat].forEach(m => { m.uniforms.uScale.value = h * 0.5; });
  camera.aspect = w / h;
  camera.fov = camera.aspect < 1 ? 58 : 34;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const projVec = new THREE.Vector3();
export function toScreenXY(pos) {
  projVec.copy(pos).project(camera);
  return {
    x: (projVec.x * 0.5 + 0.5) * window.innerWidth,
    y: (-(projVec.y * 0.5) + 0.5) * window.innerHeight,
    visible: projVec.z < 1
  };
}

S.prevMood = weatherState.mood;
export function scatterDust() {
  const arr = dustGeo.attributes.position.array;
  for (let i = 0; i < DUST_COUNT; i++) {
    arr[i * 3] = rnd(-2.6, 2.6);
    arr[i * 3 + 1] = 0.2 + Math.pow(Math.random(), 1.6) * 2.3;
    arr[i * 3 + 2] = rnd(-1.8, 1.9);
  }
}
