
/**
 * Door destination interaction
 *
 * - No key required
 * - Silkscreen text on the door
 * - Click destination or use Arrow keys + Enter
 * - Escape to cancel
 * - Soft sunlight behind the open door
 * - Camera zooms toward doorway before redirect
 * - Camera stays at doorway until navigation
 * - Browser Back restores normal room view
 */

import * as THREE from 'three';
import gsap from 'gsap';

import { camera, scene } from './core';
import {
  drX,
  drZ,
  drW,
  drH,
  doorLeaf,
  doorSkyMesh,
} from './room';

import { registerInteractable } from './interactables';
import { flyTo, flyOverview, shot, rig } from './rig';

// ========================================
// CONFIG
// ========================================

const CAMERA_DURATION = 1.65;
const DOOR_OPEN_DURATION = 1.6;
const ENTER_DURATION = 1.35;
const RETURN_DURATION = 1.35;

const DOOR_OPEN_ANGLE = -Math.PI * 0.55;

const destinations = [
  {
    label: 'PROJECTS',
    url: 'https://www.youtube.com/',
  },
  {
    label: 'GALLERY',
    url: 'https://www.bbc.com/',
  },
  {
    label: 'SECRET ROOM',
    url: 'https://www.wikipedia.org/',
  },
];

const doorCamera = shot(
  1.9,
  1.65,
  -1.4,
  drX,
  1.35,
  drZ,
  0
);

const enterCamera = shot(
  drX - 0.55,
  1.45,
  drZ,
  drX + 2.5,
  1.45,
  drZ,
  0
);

type DoorState =
  | 'idle'
  | 'zooming'
  | 'choosing'
  | 'opening'
  | 'entering'
  | 'navigating'
  | 'closing';

let state: DoorState = 'idle';
let selectedIndex = 0;
let session = 0;

let uiRoot: HTMLDivElement | null = null;
let uiContent: HTMLDivElement | null = null;
let animationFrame = 0;

let doorTween: gsap.core.Tween | null = null;
let resetTween: gsap.core.Tween | null = null;

const projected = new THREE.Vector3();

// ========================================
// DOOR HITBOX
// ========================================

const hit = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, drH, drW),
  new THREE.MeshBasicMaterial({
    visible: false,
  })
);

hit.position.set(drX - 0.02, drH / 2, drZ);

const interactionGroup = new THREE.Group();
interactionGroup.add(hit);
scene.add(interactionGroup);

registerInteractable(interactionGroup, {
  name: 'Door',
  title: 'The door',
  desc: 'Where does it lead?',
  type: 'door',
  noHighlight: true,
  center: new THREE.Vector3(drX - 0.1, 1.3, drZ),
});

// ========================================
// SUNLIGHT
// ========================================

function showSunlight() {
  doorSkyMesh.visible = true;
}

function hideSunlight() {
  doorSkyMesh.visible = false;
}

hideSunlight();

// ========================================
// SILKSCREEN STYLES
// ========================================

function injectStyles() {
  if (document.getElementById('door-styles')) return;

  const style = document.createElement('style');
  style.id = 'door-styles';

  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap');

    #door-ui-root {
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      overflow: hidden;
    }

    .door-ui-content {
      position: absolute;
      left: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 260px;
      padding: 0;
      margin: 0;
      background: transparent;
      border: none;
      box-shadow: none;
      font-family: 'Silkscreen', monospace;
      text-align: center;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      transform-origin: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .door-ui-content.visible {
      opacity: 1;
    }

    .door-ui-title {
      margin: 0 0 25px;
      color: #f3e3c3;
      font-size: 17px;
      font-weight: 700;
      white-space: nowrap;
      text-shadow: 0 2px 5px rgba(0,0,0,0.95);
    }

    .door-ui-options {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 22px;
      width: 100%;
    }

    .door-ui-option {
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
      outline: none;
      color: #f0e2c9;
      font-family: 'Silkscreen', monospace;
      font-size: 16px;
      line-height: 1.5;
      text-align: center;
      white-space: nowrap;
      cursor: pointer;
      text-shadow: 0 2px 5px rgba(0,0,0,0.95);
      transition: color 0.15s ease, text-shadow 0.15s ease;
    }

    .door-ui-option:hover,
    .door-ui-option.selected,
    .door-ui-option:focus-visible {
      color: #ffd15e;
      text-shadow:
        0 0 9px rgba(255,193,72,0.6),
        0 2px 5px rgba(0,0,0,0.95);
    }

    .door-ui-help {
      margin-top: 28px;
      color: #c9b18a;
      font-size: 9px;
      white-space: nowrap;
      text-shadow: 0 2px 4px rgba(0,0,0,0.95);
    }

    .door-ui-back {
      margin-top: 14px;
      padding: 0;
      background: transparent;
      border: none;
      box-shadow: none;
      color: #cdb58c;
      font-family: 'Silkscreen', monospace;
      font-size: 10px;
      cursor: pointer;
      text-shadow: 0 2px 4px rgba(0,0,0,0.95);
    }

    .door-ui-back:hover {
      color: #ffd15e;
    }
  `;

  document.head.appendChild(style);
}

// ========================================
// PROJECT UI ONTO DOOR
// ========================================

function projectPoint(x: number, y: number, z: number) {
  projected.set(x, y, z);

  doorLeaf.localToWorld(projected);
  projected.project(camera);

  return {
    x: (projected.x * 0.5 + 0.5) * window.innerWidth,
    y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
    z: projected.z,
  };
}

function updateUIPosition() {
  if (!uiContent) return;

  camera.updateMatrixWorld();
  doorLeaf.updateWorldMatrix(true, false);

  const center = projectPoint(-0.075, drH * 0.52, drW / 2);
  const top = projectPoint(-0.075, drH * 0.94, drW / 2);
  const bottom = projectPoint(-0.075, drH * 0.1, drW / 2);
  const left = projectPoint(-0.075, drH * 0.52, drW * 0.1);
  const right = projectPoint(-0.075, drH * 0.52, drW * 0.9);

  const doorHeight = Math.abs(bottom.y - top.y);
  const doorWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  const contentHeight = uiContent.offsetHeight || 230;
  const contentWidth = uiContent.offsetWidth || 260;

  const scale = Math.max(
    0.15,
    Math.min(
      (doorHeight * 0.82) / contentHeight,
      (doorWidth * 0.88) / contentWidth,
      1.2
    )
  );

  uiContent.style.left = `${center.x}px`;
  uiContent.style.top = `${center.y}px`;
  uiContent.style.transform =
    `translate(-50%, -50%) scale(${scale})`;

  uiContent.style.visibility =
    center.z >= -1 && center.z <= 1
      ? 'visible'
      : 'hidden';
}

function stopTracking() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

function startTracking() {
  stopTracking();

  const update = () => {
    if (!uiContent) {
      animationFrame = 0;
      return;
    }

    updateUIPosition();
    animationFrame = requestAnimationFrame(update);
  };

  animationFrame = requestAnimationFrame(update);
}

// ========================================
// UI LIFECYCLE
// ========================================

function removeUI() {
  stopTracking();
  uiRoot?.remove();
  uiRoot = null;
  uiContent = null;
}

function createUI() {
  removeUI();
  injectStyles();

  uiRoot = document.createElement('div');
  uiRoot.id = 'door-ui-root';

  uiContent = document.createElement('div');
  uiContent.className = 'door-ui-content';

  uiRoot.appendChild(uiContent);
  document.body.appendChild(uiRoot);

  startTracking();

  const content = uiContent;

  requestAnimationFrame(() => {
    if (uiContent === content) {
      content.classList.add('visible');
    }
  });
}

// ========================================
// SELECTION
// ========================================

function updateSelection() {
  if (!uiContent) return;

  const buttons =
    uiContent.querySelectorAll<HTMLButtonElement>(
      '[data-door-index]'
    );

  buttons.forEach((button) => {
    const index = Number(button.dataset.doorIndex);
    const selected = index === selectedIndex;

    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function selectDestination(index: number) {
  if (state !== 'choosing') return;

  selectedIndex =
    ((index % destinations.length) + destinations.length) %
    destinations.length;

  updateSelection();
}

// ========================================
// RENDER DESTINATIONS
// ========================================

function renderChoices() {
  if (!uiContent) return;

  uiContent.innerHTML = `
    <div class="door-ui-title">
      WHERE TO NEXT?
    </div>

    <div class="door-ui-options">
      ${destinations.map(
        (destination, index) => `
          <button
            type="button"
            class="door-ui-option"
            data-door-index="${index}"
            aria-pressed="false"
          >
            ${destination.label}
          </button>
        `
      ).join('')}
    </div>

    <div class="door-ui-help">
      ↑ ↓ SELECT · ENTER TO OPEN
    </div>

    <button
      type="button"
      class="door-ui-back"
      data-door-back
    >
      ESC · BACK
    </button>
  `;

  uiContent
    .querySelectorAll<HTMLButtonElement>('[data-door-index]')
    .forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        selectDestination(Number(button.dataset.doorIndex));
        openDoor();
      });
    });

  uiContent
    .querySelector<HTMLButtonElement>('[data-door-back]')
    ?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeDoorInteraction();
    });

  updateSelection();
  updateUIPosition();
}

// ========================================
// ZOOM TO DOOR
// ========================================

function zoomToDoor() {
  if (state !== 'idle') return;

  session++;
  const currentSession = session;

  resetTween?.kill();
  doorTween?.kill();

  state = 'zooming';
  selectedIndex = 0;

  removeUI();
  hideSunlight();
  doorLeaf.rotation.y = 0;

  flyTo(doorCamera, {
    dur: CAMERA_DURATION,
    ease: 'power3.inOut',

    onComplete: () => {
      if (
        currentSession !== session ||
        state !== 'zooming'
      ) {
        return;
      }

      state = 'choosing';
      createUI();
      renderChoices();
    },
  });
}

// ========================================
// OPEN DOOR
// ========================================

function openDoor() {
  if (state !== 'choosing') return;

  session++;
  const currentSession = session;

  state = 'opening';
  removeUI();
  doorTween?.kill();

  showSunlight();

  doorTween = gsap.to(doorLeaf.rotation, {
    y: DOOR_OPEN_ANGLE,
    duration: DOOR_OPEN_DURATION,
    ease: 'power2.inOut',

    onComplete: () => {
      if (
        currentSession !== session ||
        state !== 'opening'
      ) {
        return;
      }

      zoomThroughDoor(currentSession);
    },
  });
}

// ========================================
// ZOOM + REDIRECT
// ========================================

function zoomThroughDoor(currentSession: number) {
  if (
    currentSession !== session ||
    state !== 'opening'
  ) {
    return;
  }

  state = 'entering';

  flyTo(enterCamera, {
    dur: ENTER_DURATION,
    ease: 'power2.in',

    onComplete: () => {
      if (
        currentSession !== session ||
        state !== 'entering'
      ) {
        return;
      }

      const destination = destinations[selectedIndex];

      // IMPORTANT:
      // Do NOT reset camera or door here.
      // Keep the final doorway view until
      // the browser navigates away.
      state = 'navigating';

      window.location.assign(destination.url);
    },
  });
}

// ========================================
// RESET ONLY AFTER RETURNING
// ========================================

function resetDoorAfterNavigation() {
  session++;

  doorTween?.kill();
  resetTween?.kill();

  doorTween = null;
  resetTween = null;

  gsap.killTweensOf(doorLeaf.rotation);

  removeUI();

  doorLeaf.rotation.y = 0;
  hideSunlight();

  gsap.killTweensOf(rig);
  gsap.killTweensOf(rig.pos);
  gsap.killTweensOf(rig.look);

  rig.mix = 0;
  rig.parallax = 0.05;

  selectedIndex = 0;
  state = 'idle';

  document.body.style.cursor = 'default';
}

// Browser Back / Forward Cache restoration.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    resetDoorAfterNavigation();
  }
});

// ========================================
// CLOSE / CANCEL
// ========================================

export function closeDoorInteraction() {
  if (
    state === 'idle' ||
    state === 'closing' ||
    state === 'navigating'
  ) {
    return;
  }

  session++;
  const currentSession = session;

  state = 'closing';

  removeUI();

  resetTween?.kill();
  doorTween?.kill();

  gsap.killTweensOf(doorLeaf.rotation);

  hideSunlight();

  doorTween = gsap.to(doorLeaf.rotation, {
    y: 0,
    duration: 1,
    ease: 'power2.inOut',
  });

  flyOverview(RETURN_DURATION);

  selectedIndex = 0;
  document.body.style.cursor = 'default';

  resetTween = gsap.delayedCall(
    RETURN_DURATION + 0.05,
    () => {
      if (currentSession !== session) return;

      removeUI();

      doorLeaf.rotation.y = 0;
      hideSunlight();

      state = 'idle';
      doorTween = null;
      resetTween = null;
    }
  );
}

// ========================================
// KEYBOARD CONTROLS
// ========================================

document.addEventListener(
  'keydown',
  (event: KeyboardEvent) => {
    if (state === 'idle' || state === 'navigating') return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDoorInteraction();
      return;
    }

    if (state !== 'choosing') return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectDestination(selectedIndex + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectDestination(selectedIndex - 1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openDoor();
    }
  },
  true
);

// ========================================
// PREVENT ROOM CLICK INTERFERENCE
// ========================================

function isDoorUIEvent(event: Event) {
  return Boolean(
    uiContent &&
    event.target instanceof Node &&
    uiContent.contains(event.target)
  );
}

document.addEventListener('pointerdown', (event) => {
  if (isDoorUIEvent(event)) {
    event.stopPropagation();
  }
});

document.addEventListener('click', (event) => {
  if (isDoorUIEvent(event)) {
    event.stopPropagation();
  }
});

// ========================================
// PUBLIC DOOR INTERACTION
// ========================================

export function useDoor() {
  if (state !== 'idle') return;
  zoomToDoor();
}
