
/** entry point: import ทุกโมดูล + animate loop */
import './style.css';
import './legacy-compat'; // ต้อง import ก่อนโค้ด Three.js อื่นทั้งหมด
import * as THREE from 'three';
import { LI } from './legacy-compat';
import { S } from './state';
import { CAM } from './config';
import {
  camera,
  dustRenderer,
  dustScene,
  rayRenderer,
  rayScene,
  scene,
} from './core';
import { rnd } from './helpers';
import { interactiveObjects } from './interactables';
import {
  coffeeSteam,
  deskLight,
  lampShade,
  sfZ,
} from './furniture';
import { neonOutside, windowLight } from './lights';
import {
  CORNER_COUNT,
  DUST_COUNT,
  RAIN_COUNT,
  SHAFT_DUST,
  SLICE_OPACITY,
  cornerGeo,
  cornerVel,
  corners,
  dustGeo,
  dustVel,
  inShaft,
  rainGeo,
  rainMat,
  rayMeshes,
  respawnInShaft,
  updateParticleLighting,
} from './atmosphere';
import { weatherState } from './weather-state';
import { composer } from './postprocessing';
import {
  badges,
  cur,
  mouse,
  mouseClient,
  mouseNDC,
  raycaster,
  setHighlight,
  tooltipDesc,
  tooltipEl,
  tooltipTitle,
  updateCoffeeBubble,
} from './interaction';
import { updateIntro } from './intro';
import { showNotebook } from './tutorial';
import {
  cameraLook,
  cameraTarget,
  focusTarget,
  normalTarget,
} from './ui-camera';
import { rig, flyTo } from './rig';
import { frame as stageFrame, stage } from './stage';

import './tour';
import './board-items';
import './modules/board';
import './modules/trophy';
import './modules/pc';
import './seasonal';

import { updateTitle } from './title3d';

import './frames';
import './modules/resume';
import './records';
import './modules/music';

import { useDoor } from './door';

import './side-table';
import './modules/desk';
import './ui';

import { openModule, closeModule } from './stage';
import { goTo, tour } from './tour';
import { scatterDust, toScreenXY } from './view';

import './textures';
import './room';
import './weather';
import './occluders';

// ========================================
// INITIALIZATION
// ========================================

const rigPos = new THREE.Vector3();

const timer = new THREE.Timer();
timer.connect(document);

let lastFrameMs = performance.now();

let startupStarted = false;
let framePresented = false;
let notebookQueued = false;

// ========================================
// LOADING -> INTRO -> NOTEBOOK
// ========================================

function revealTutorialAfterFrame() {
  if (framePresented) return;

  framePresented = true;

  // รอผ่านสอง animation frames
  // เพื่อให้ browser มีโอกาสนำภาพฉากขึ้นแสดง
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      S.bootDone = true;   // เริ่ม intro (กล้องซูมเข้าห้อง) ทันทีที่ loading จางหาย

      const boot = document.getElementById('boot');

      if (!boot) return;

      const done = (event: TransitionEvent) => {
        if (
          event.target !== boot ||
          event.propertyName !== 'opacity'
        ) {
          return;
        }

        boot.removeEventListener('transitionend', done);
        boot.remove();
      };

      boot.addEventListener('transitionend', done);

      boot.classList.add('done');

      if (
        matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches
      ) {
        boot.removeEventListener('transitionend', done);
        boot.remove();
      }
    })
  );
}

// ========================================
// MAIN ANIMATION LOOP
// ========================================

function animate() {
  timer.update();

  const t = timer.getElapsed();

  const nowMs = performance.now();

  const dt = Math.min(
    0.1,
    (nowMs - lastFrameMs) / 1000
  );

  lastFrameMs = nowMs;

  // ========================================
  // INTRO
  // ========================================

  updateIntro(dt);

  // สมุดโน้ตเด้งขึ้นทันทีหลังกล้องซูมเข้าห้องเสร็จ (intro จบ)
  if (!notebookQueued && S.bootDone && !S.introActive) {
    notebookQueued = true;
    setTimeout(showNotebook, 350);
  }

  // ========================================
  // WEATHER STATE
  // ========================================

  if (weatherState.mood !== S.prevMood) {
    S.prevMood = weatherState.mood;

    if (S.prevMood !== 'day') {
      scatterDust();
    }
  }

  // ========================================
  // MOUSE PARALLAX
  // ========================================

  cur.x += (mouse.x - cur.x) * 0.045;
  cur.y += (mouse.y - cur.y) * 0.045;

  // introE:
  // 0 = กล้องไกลจากห้อง
  // 1 = ตำแหน่งกล้องปกติ

  normalTarget.set(
    CAM.x + cur.x * CAM.moveX * S.introE,
    CAM.y -
      cur.y * CAM.moveY * S.introE +
      (1 - S.introE) * 0.7,
    CAM.z + (1 - S.introE) * 4
  );

  cameraTarget.copy(normalTarget);

  const lookTarget = focusTarget;

  lookTarget.set(
    CAM.x + cur.x * 0.35 * S.introE,
    CAM.lookY,
    0
  );

  // ========================================
  // INSPECTION CAMERA
  // ========================================

  if (rig.mix > 0.001 && !S.introActive) {
    rigPos.copy(rig.pos);

    rigPos.x += cur.x * rig.parallax;
    rigPos.y -= cur.y * rig.parallax * 0.5;

    cameraTarget.lerp(rigPos, rig.mix);
    lookTarget.lerp(rig.look, rig.mix);
  }

  const ease =
    1 -
    Math.exp(
      -dt * (rig.mix > 0.5 ? 14 : 9)
    );

  camera.position.lerp(cameraTarget, ease);
  cameraLook.lerp(lookTarget, ease);

  camera.lookAt(cameraLook);

  // ========================================
  // COFFEE INTERACTION
  // ========================================

  updateCoffeeBubble();

  const steamTime = performance.now() * 0.00035;

  coffeeSteam.forEach((particle, i) => {
    const phase =
      (steamTime + particle.userData.phase) % 1;

    particle.position.set(
      0.25 +
        Math.sin(phase * 9 + i * 2.1) *
        (0.012 + phase * 0.07),

      0.43 + phase * 0.32,

      sfZ +
        1.05 +
        Math.cos(phase * 7 + i) * 0.025
    );

    particle.scale.setScalar(
      0.65 + phase * 1.6
    );

    particle.material.opacity =
      0.28 * Math.sin(Math.PI * phase);
  });

  // ========================================
  // OBJECT INTERACTION
  // ========================================

  raycaster.setFromCamera(mouseNDC, camera);

  // ห้าม Hover วัตถุขณะ Tutorial,
  // Intro หรือกำลัง Inspect

  const hits =
    S.tutorialActive ||
    S.introActive ||
    stage.active
      ? []
      : raycaster.intersectObjects(
          interactiveObjects,
          true
        );

  let newHovered = null;

  if (hits.length > 0) {
    let curr = hits[0].object;

    while (curr && curr !== scene) {
      if (
        curr.userData &&
        curr.userData.info
      ) {
        newHovered = curr;
        break;
      }

      curr = curr.parent;
    }
  }

  // ========================================
  // HOVER HIGHLIGHT
  // ========================================

  if (S.hoveredItem !== newHovered) {
    if (S.hoveredItem) {
      setHighlight(
        S.hoveredItem,
        false
      );
    }

    S.hoveredItem = newHovered;

    if (S.hoveredItem) {
      setHighlight(
        S.hoveredItem,
        true
      );
    }

    if (S.hoveredItem) {
      document.body.style.cursor = 'pointer';

      tooltipTitle.innerText =
        S.hoveredItem.userData.info.title;

      tooltipDesc.innerText =
        S.hoveredItem.userData.info.desc;

      tooltipEl.classList.add('show');
    } else {
      document.body.style.cursor = 'default';
      tooltipEl.classList.remove('show');
    }
  }

  if (S.hoveredItem) {
    tooltipEl.style.left =
      `${mouseClient.x}px`;

    tooltipEl.style.top =
      `${mouseClient.y}px`;
  }

  // ========================================
  // DETECTIVE VISION
  // ========================================

  if (S.detectiveVision) {
    badges.forEach(({ el, obj }) => {
      const pos =
        obj.userData.info.center;

      const screenPos =
        toScreenXY(pos);

      if (screenPos.visible) {
        el.style.left =
          `${screenPos.x}px`;

        el.style.top =
          `${screenPos.y}px`;

        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  } else {
    badges.forEach(({ el }) => {
      el.style.display = 'none';
    });
  }

  // ========================================
  // DESK LIGHT
  // ========================================

  S.lampLevel +=
    ((S.lampOn ? 1 : 0) - S.lampLevel) *
    0.12;

  const flicker =
    1 +
    Math.sin(t * 8) * 0.02 +
    Math.sin(t * 17) * 0.015;

  deskLight.intensity =
    S.activeLampLighting.intensity *
    S.lampLevel *
    flicker *
    LI *
    (S.lampScale ?? 1);

  lampShade.material.emissiveIntensity =
    S.activeLampLighting.shadeIntensity *
    (0.05 + 0.95 * S.lampLevel) *
    flicker *
    (0.15 +
      0.85 * (S.lampScale ?? 1));

  // ========================================
  // PARTICLE LIGHTING
  // ========================================

  updateParticleLighting();

  // ========================================
  // WINDOW LIGHT
  // ========================================

  const sunPulse =
    Math.sin(t * 0.5) * 0.3;

  windowLight.intensity =
    (weatherState.baseSunIntensity +
      sunPulse) *
    (0.15 + 0.85 * S.introLight) *
    (1 - 0.5 * S.focusDim) *
    LI;

  // ========================================
  // LIGHT RAYS
  // ========================================

  rayMeshes.forEach((m, idx) => {
    const wave =
      1 +
      Math.sin(
        t * 0.7 +
        idx * 0.4
      ) *
      0.1;

    m.material.opacity =
      m.userData.k *
      SLICE_OPACITY *
      wave *
      weatherState.beamOpacityMult *
      S.introLight;
  });

  // ========================================
  // NEON LIGHT
  // ========================================

  if (weatherState.isNight) {
    const neonFlicker =
      (Math.sin(t * 3.5) > 0.85
        ? 0.8
        : 0.25) +
      Math.sin(t * 11) * 0.1;

    neonOutside.intensity =
      Math.max(0, neonFlicker) * LI;
  } else {
    neonOutside.intensity = 0;
  }

  // ========================================
  // RAIN
  // ========================================

  if (weatherState.isRain) {
    rainMat.opacity = 0.5;

    const rArr =
      rainGeo.attributes.position.array;

    for (
      let i = 0;
      i < RAIN_COUNT;
      i++
    ) {
      rArr[i * 3 + 1] -= 0.11;
      rArr[i * 3] -= 0.015;

      if (
        rArr[i * 3 + 1] < 0.6
      ) {
        rArr[i * 3 + 1] = 3.6;
        rArr[i * 3] =
          rnd(-2.2, 2.2);
      }
    }

    rainGeo.attributes.position.needsUpdate =
      true;
  } else {
    rainMat.opacity = 0;
  }

  // ========================================
  // DUST PARTICLES
  // ========================================

  const p =
    dustGeo.attributes.position;

  for (
    let i = 0;
    i < DUST_COUNT;
    i++
  ) {
    p.array[i * 3] +=
      dustVel[i][0] * 0.01;

    p.array[i * 3 + 1] +=
      dustVel[i][1] * 0.01;

    p.array[i * 3 + 2] +=
      dustVel[i][2] * 0.01;

    if (
      weatherState.isSunny &&
      i < SHAFT_DUST
    ) {
      if (
        !inShaft(
          p.array[i * 3],
          p.array[i * 3 + 1],
          p.array[i * 3 + 2]
        )
      ) {
        respawnInShaft(
          p.array,
          i
        );
      }
    } else if (
      p.array[i * 3 + 1] > 2.6
    ) {
      p.array[i * 3 + 1] = 0.2;
      p.array[i * 3] =
        rnd(-2.4, 2.4);

      p.array[i * 3 + 2] =
        rnd(-1.6, 1.8);
    }
  }

  dustGeo.attributes.position.needsUpdate =
    true;

  // ========================================
  // CORNER PARTICLES
  // ========================================

  const cp =
    cornerGeo.attributes.position;

  for (
    let i = 0;
    i < CORNER_COUNT;
    i++
  ) {
    cp.array[i * 3] +=
      cornerVel[i][0] * 0.01;

    cp.array[i * 3 + 1] +=
      cornerVel[i][1] * 0.01;

    cp.array[i * 3 + 2] +=
      cornerVel[i][2] * 0.01;

    if (
      cp.array[i * 3 + 1] > 2.8
    ) {
      const c =
        corners[i % corners.length];

      cp.array[i * 3] =
        c[0] +
        rnd(-0.45, 0.45);

      cp.array[i * 3 + 1] = 0.2;

      cp.array[i * 3 + 2] =
        c[1] +
        rnd(-0.45, 0.45);
    }
  }

  cornerGeo.attributes.position.needsUpdate =
    true;

  // ========================================
  // STAGE & TITLE
  // ========================================

  stageFrame(dt, t);

  updateTitle(
    t,
    !S.introActive &&
      !stage.active &&
      rig.mix < 0.15,
    dt
  );

  // ========================================
  // RENDER THREE.JS
  // ========================================

  composer.render();

  rayRenderer.render(
    rayScene,
    camera
  );

  dustRenderer.render(
    dustScene,
    camera
  );

  // ========================================
  // FIRST FRAME -> TUTORIAL
  // ========================================

  if (!startupStarted) {
    startupStarted = true;
    revealTutorialAfterFrame();
  }

  requestAnimationFrame(animate);
}

animate();

// ========================================
// DEBUG HOOKS
// ========================================

if (
  new URLSearchParams(
    location.search
  ).has('debug')
) {
  (window as any).__room = {
    ws: weatherState,
    door: useDoor,

    fly: () =>
      flyTo(
        {
          pos: new THREE.Vector3(
            1.3,
            1.2,
            0.6
          ),
          look: new THREE.Vector3(
            2.7,
            0.6,
            -2.2
          ),
          parallax: 0,
        },
        {
          dur: 0.1,
        }
      ),

    open: openModule,
    close: closeModule,
    goTo,
    tour,
    S,
    stage,
  };
}
