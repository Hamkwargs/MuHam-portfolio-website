/** ลำแสงผ่านหน้าต่าง ฝุ่น ฝน และ particle lighting */
import * as THREE from 'three';
import { S } from './state';
import { dustRenderer, dustScene, rayScene, scene } from './core';
import { rnd } from './helpers';
import { bz, winBottom, winTop, winW } from './room';
import { deskLight } from './furniture';
import { weatherState } from './weather-state';

const rayGroup = new THREE.Group();
rayScene.add(rayGroup);

// ===== Light shaft: แผ่นบางซ้อนกันหลายชั้น ขอบฟุ้งนุ่ม ไม่มีเส้นตัดชัด =====
const SHAFT_SLOPE = 0.66;               // แสงตกลงกี่หน่วย ต่อระยะ z 1 หน่วย
const SHAFT_X = winW / 2 - 0.1;
const SHAFT_Z0 = bz + 0.1;
const SHAFT_YB = winBottom + 0.05, SHAFT_YT = winTop - 0.05;
const SHAFT_YSH = 1.45;                 // ลำแสงที่ y0 ต่ำกว่านี้ชนพนักโซฟา → ถูกบังตั้งแต่เลยโซฟาไป
const SOFA_BACK_Z = -1.96;              // ขอบหน้าพนักโซฟา
export const SLICE_OPACITY = 0.055;            // ความเข้มต่อชั้น (ปรับตรงนี้)

function makeHazeTexture(seed, fb = 0.3) {
  const S = 96, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / (S - 1), v = y / (S - 1), f = 0.3;
    const edge = ss(0, f, u) * ss(0, f, 1 - u) * ss(0, f, v) * ss(0, fb, 1 - v);
    const n = 0.72 + 0.28 * (Math.sin(u * 6 + seed * 1.7) * Math.sin(v * 4 + seed * 2.9) * 0.6 + Math.sin(u * 13 + v * 5 + seed * 4.1) * 0.4);
    const i = (y * S + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
    img.data[i + 3] = Math.round(255 * edge * n);
  }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}
const hazeTex = [makeHazeTexture(1), makeHazeTexture(2.3), makeHazeTexture(4.1)];
// เวอร์ชันขอบล่างคมกว่า ใช้กับเงาของโซฟา
const hazeTexCut = [makeHazeTexture(1, 0.06), makeHazeTexture(2.3, 0.06), makeHazeTexture(4.1, 0.06)];
export const rayMeshes = [];
function addSlice(z, yBot, yTop, halfW, k, ti, cut = false) {
  const mat = new THREE.MeshBasicMaterial({
    map: (cut ? hazeTexCut : hazeTex)[ti % 3], color: 0xffd58a, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, yTop - yBot), mat);
  m.position.set(0, (yTop + yBot) / 2, z);
  m.userData.k = k;
  rayGroup.add(m); rayMeshes.push(m);
}
// ชั้นหลักของลำแสง (หน้าต่างทั้งบาน ลาดลงมาถึงพื้น)
const FRONT_SLICES = 16;
for (let i = 0; i < FRONT_SLICES; i++) {
  const t = i / (FRONT_SLICES - 1);
  const z = -2.15 + t * 3.15;
  const shift = SHAFT_SLOPE * (z - SHAFT_Z0);
  // เลยพนักโซฟาไปแล้ว แสงช่วงล่างถูกโซฟาบัง → ขอบล่างของ shaft ยกขึ้นเป็นเส้นเงาเฉียงลงพื้น
  const behindSofa = z > SOFA_BACK_Z;
  const yTop = SHAFT_YT - shift;
  const yBot = Math.max(0.04, (behindSofa ? SHAFT_YSH : SHAFT_YB) - shift);
  if (yTop - yBot < 0.12) continue;
  addSlice(z, yBot, yTop, SHAFT_X * 1.1, 1 - 0.55 * t, i, behindSofa && yBot > 0.25);
}
// ชั้นหมอกแสงด้านหลังโซฟา (โซฟาบังด้านหน้า เห็นเป็น silhouette)
[-2.44, -2.38, -2.32, -2.26].forEach((z, i) => addSlice(z, 0.12, SHAFT_YT, SHAFT_X * 1.05, 1.15, i));

// ฝุ่นกลางวัน: SHAFT_DUST เม็ดแรกอยู่ในลำแสงเท่านั้น ที่เหลือลอยทั่วห้องแบบบางๆ
export const SHAFT_DUST = 50;
export function inShaft(x, y, z) {
  if (Math.abs(x) > SHAFT_X) return false;
  if (z >= -2.46 && z <= -2.2) return y >= 0.15 && y <= SHAFT_YT;   // หลังโซฟา
  if (z < SHAFT_Z0 || y < 0.05) return false;
  const y0 = y + SHAFT_SLOPE * (z - SHAFT_Z0);
  return y0 >= (z > SOFA_BACK_Z ? SHAFT_YSH : SHAFT_YB) && y0 <= SHAFT_YT;
}
export function respawnInShaft(arr, i) {
  let x, y, z, lo;
  if (Math.random() < 0.3) {
    z = rnd(-2.44, -2.24); y = rnd(0.3, 2.3); x = rnd(-1.4, 1.4);
  } else {
    do {
      z = rnd(SHAFT_Z0 + 0.3, 1.2);
      lo = (z > SOFA_BACK_Z ? SHAFT_YSH : SHAFT_YB) + 0.05;
      y = rnd(lo, SHAFT_YT - 0.05) - SHAFT_SLOPE * (z - SHAFT_Z0);
    } while (y < 0.15);
    x = rnd(-SHAFT_X * 0.9, SHAFT_X * 0.9);
  }
  arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z;
}

// Material ของจุดฝุ่น: มี alpha ต่อเม็ด (ใช้ทำให้ฝุ่นนอกลำแสงบางลง)
function makePointMat(size) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: size * dustRenderer.getPixelRatio() },
      uScale: { value: window.innerHeight * 0.5 },
      uOpacity: { value: 1 }
    },
    vertexShader: `
      attribute vec3 color; attribute float aAlpha;
      varying vec3 vC; varying float vA;
      uniform float uSize; uniform float uScale;
      void main() {
        vC = color; vA = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (uScale / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA; uniform float uOpacity;
      void main() { gl_FragColor = vec4(vC, vA * uOpacity); }`,
    transparent: true, depthWrite: false, blending: THREE.NormalBlending
  });
}

export const RAIN_COUNT = 280;
const rainPos = new Float32Array(RAIN_COUNT * 3);
for (let i = 0; i < RAIN_COUNT; i++) {
  rainPos[i * 3] = rnd(-2.2, 2.2);
  rainPos[i * 3 + 1] = rnd(0.5, 4.0);
  rainPos[i * 3 + 2] = rnd(-3.4, -2.9);
}
export const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
export const rainMat = new THREE.PointsMaterial({ color: 0x6f8399, size: 0.04, transparent: true, opacity: 0, depthWrite: false });
scene.add(new THREE.Points(rainGeo, rainMat));

export const DUST_COUNT = 130;
const dustPos = new Float32Array(DUST_COUNT * 3);
export const dustVel = [];
for (let i = 0; i < DUST_COUNT; i++) {
  const bias = Math.pow(Math.random(), 1.6);
  const y = 0.2 + bias * 2.3;
  const spreadFactor = 1.0 - (y / 3.0) * 0.4;
  dustPos[i * 3] = rnd(-2.6, 2.6) * spreadFactor;
  dustPos[i * 3 + 1] = y;
  dustPos[i * 3 + 2] = rnd(-1.8, 1.9) * spreadFactor;
  dustVel.push([rnd(-0.008, 0.008), rnd(0.012, 0.038), rnd(-0.008, 0.008)]);
}
export const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
export const dustMat = makePointMat(0.040);
// CHANGED: ย้ายจาก rayScene -> dustScene
dustScene.add(new THREE.Points(dustGeo, dustMat));

export const CORNER_COUNT = 70;
const cornerPos = new Float32Array(CORNER_COUNT * 3);
export const cornerVel = [];
export const corners = [[-3.0, -2.0], [-3.0, 2.5], [3.0, -2.0], [3.0, 2.5]];
for (let i = 0; i < CORNER_COUNT; i++) {
  const c = corners[i % corners.length];
  cornerPos[i * 3] = c[0] + rnd(-0.45, 0.45);
  cornerPos[i * 3 + 1] = rnd(0.2, 2.7);
  cornerPos[i * 3 + 2] = c[1] + rnd(-0.45, 0.45);
  cornerVel.push([rnd(-0.005, 0.005), rnd(0.008, 0.025), rnd(-0.005, 0.005)]);
}
export const cornerGeo = new THREE.BufferGeometry();
cornerGeo.setAttribute('position', new THREE.BufferAttribute(cornerPos, 3));
export const cornerMat = makePointMat(0.030);
// CHANGED: ย้ายจาก rayScene -> dustScene
dustScene.add(new THREE.Points(cornerGeo, cornerMat));

// ============================================================
// PARTICLE LIGHT RESPONSE
// ============================================================
const dustColors = new Float32Array(DUST_COUNT * 3).fill(1);
const cornerColors = new Float32Array(CORNER_COUNT * 3).fill(1);

dustGeo.setAttribute("color", new THREE.BufferAttribute(dustColors, 3));
cornerGeo.setAttribute("color", new THREE.BufferAttribute(cornerColors, 3));
dustGeo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(DUST_COUNT).fill(1), 1));
cornerGeo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(CORNER_COUNT).fill(1), 1));


const DAY_COLOR = new THREE.Color(0xffd58a);
const OVERCAST_COLOR = new THREE.Color(0xcfdcea);   // ฝุ่นตอนฟ้าครึม (โทนเย็น)
const LAMP_COLOR = new THREE.Color(0xffc96b);

// CHANGED: ปรับให้สว่างขึ้นเล็กน้อย เพื่อให้เห็นชัดบนฉากมืด
const NIGHT_GRAY = new THREE.Color(0x9aa0a8);
const NIGHT_DARK = new THREE.Color(0x3a3f46);
const NIGHT_EDGE = new THREE.Color(0x0d0f12);

const currentColor = new THREE.Color();
const targetColor = new THREE.Color();

let particleDustOpacity = 0.72;
let particleCornerOpacity = 0.42;

export function updateParticleLighting() {
  const lightX = deskLight.position.x;
  const lightY = deskLight.position.y;
  const lightZ = deskLight.position.z;

  const positions = dustGeo.attributes.position.array;
  const colors = dustGeo.attributes.color.array;

  // ---------------- MAIN DUST ----------------
  for (let i = 0; i < DUST_COUNT; i++) {
    const index = i * 3;
    const x = positions[index];
    const y = positions[index + 1];
    const z = positions[index + 2];

    if (!weatherState.isNight) {
      // DAY / OVERCAST
      targetColor.copy(weatherState.isRain ? OVERCAST_COLOR : DAY_COLOR);
    } else if (S.lampOn) {
      // NIGHT + LAMP ON
      const dx = x - lightX;
      const dy = y - lightY;
      const dz = z - lightZ;
      const distanceFromLamp = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const lampInfluence = THREE.MathUtils.clamp(
        1 - ((distanceFromLamp - 0.25) / 1.65), 0, 1
      ) * S.lampLevel;

      targetColor.copy(NIGHT_DARK).lerp(LAMP_COLOR, lampInfluence);
      targetColor.multiplyScalar(0.35 + lampInfluence * 0.65);
    } else {
      // NIGHT + LAMP OFF
      const dx = x - 0;
      const dz = z - 0.4;
      const distanceFromCenter = Math.sqrt(dx * dx + dz * dz);

      const centerInfluence = THREE.MathUtils.clamp(
        1 - (distanceFromCenter / 3.0), 0, 1
      );

      targetColor.copy(NIGHT_EDGE).lerp(NIGHT_GRAY, centerInfluence);
      // CHANGED: สว่างขึ้นจากเดิม (0.15 + 0.35)
      targetColor.multiplyScalar(0.3 + centerInfluence * 0.5);
    }

    currentColor.setRGB(colors[index], colors[index + 1], colors[index + 2]);
    currentColor.lerp(targetColor, 0.10);

    colors[index] = currentColor.r;
    colors[index + 1] = currentColor.g;
    colors[index + 2] = currentColor.b;
  }
  dustGeo.attributes.color.needsUpdate = true;

  // alpha ต่อเม็ด: กลางวัน เม็ดที่ไม่ใช่ฝุ่นในลำแสงจะบาง
  const dAlpha = dustGeo.attributes.aAlpha.array;
  for (let i = 0; i < DUST_COUNT; i++) {
    const target = weatherState.isNight ? 1.0 : weatherState.isRain ? 0.4 : (i >= SHAFT_DUST ? 0.22 : 1.0);
    dAlpha[i] += (target - dAlpha[i]) * 0.08;
  }
  dustGeo.attributes.aAlpha.needsUpdate = true;

  // ---------------- CORNER PARTICLES ----------------
  const cornerPositions = cornerGeo.attributes.position.array;
  const cornerColorArray = cornerGeo.attributes.color.array;

  for (let i = 0; i < CORNER_COUNT; i++) {
    const index = i * 3;
    const x = cornerPositions[index];
    const y = cornerPositions[index + 1];
    const z = cornerPositions[index + 2];

    if (!weatherState.isNight) {
      targetColor.copy(weatherState.isRain ? OVERCAST_COLOR : DAY_COLOR);
    } else if (S.lampOn) {
      const dx = x - lightX;
      const dy = y - lightY;
      const dz = z - lightZ;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const influence = THREE.MathUtils.clamp(
        1 - ((distance - 0.25) / 1.8), 0, 1
      ) * S.lampLevel;

      targetColor.copy(NIGHT_EDGE).lerp(LAMP_COLOR, influence);
      targetColor.multiplyScalar(0.22 + influence * 0.60);
    } else {
      // Lamp OFF: มุมห้องแทบหายไป
      targetColor.copy(NIGHT_EDGE).multiplyScalar(0.25);
    }

    currentColor.setRGB(cornerColorArray[index], cornerColorArray[index + 1], cornerColorArray[index + 2]);
    currentColor.lerp(targetColor, 0.10);

    cornerColorArray[index] = currentColor.r;
    cornerColorArray[index + 1] = currentColor.g;
    cornerColorArray[index + 2] = currentColor.b;
  }
  cornerGeo.attributes.color.needsUpdate = true;

  // ---------------- GLOBAL OPACITY ----------------
  let targetDustOpacity;
  let targetCornerOpacity;

  if (!weatherState.isNight) {
    // DAY: ฝุ่นในลำแสงชัด ฝุ่นที่อื่นบางๆ (คุมด้วย aAlpha ต่อเม็ด)
    targetDustOpacity = weatherState.isRain ? 0.5 : 0.72;
    targetCornerOpacity = weatherState.isRain ? 0.2 : 0.14;
  } else if (S.lampOn) {
    targetDustOpacity = 0.30 + S.lampLevel * 0.25;
    targetCornerOpacity = 0.08 + S.lampLevel * 0.10;
  } else {
    // NIGHT + LAMP OFF: ปิดฝุ่นกลางห้อง เหลือแค่ฝุ่นจาง ๆ ตามมุม
    targetDustOpacity = 0.0;
    targetCornerOpacity = 0.10;
  }

  if (weatherState.isNight && !S.lampOn) {
    particleDustOpacity = 0;
    dustMat.uniforms.uOpacity.value = 0;

    particleCornerOpacity += (targetCornerOpacity - particleCornerOpacity) * 0.08;
    cornerMat.uniforms.uOpacity.value = particleCornerOpacity;
  } else {
    particleDustOpacity += (targetDustOpacity - particleDustOpacity) * 0.08;
    particleCornerOpacity += (targetCornerOpacity - particleCornerOpacity) * 0.08;

    dustMat.uniforms.uOpacity.value = particleDustOpacity;
    cornerMat.uniforms.uOpacity.value = particleCornerOpacity;
  }
}
