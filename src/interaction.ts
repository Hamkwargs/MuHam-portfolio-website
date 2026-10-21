/** raycast/hover, detective vision, highlight, กาแฟ, เพลง, เมาส์ */
import * as THREE from 'three';
import { S } from './state';
import { camera } from './core';
import { interactiveObjects, onRegister } from './interactables';
import { redStringMat, sfZ } from './furniture';

// =========================================================================
// RAYCASTING & INTERACTION LOGIC
// =========================================================================
export const raycaster = new THREE.Raycaster();
export const mouseNDC = new THREE.Vector2(-999, -999);
export const mouseClient = { x: 0, y: 0 };



export const tooltipEl = document.getElementById('tooltip');
export const tooltipTitle = document.getElementById('tooltip-title');
export const tooltipDesc = document.getElementById('tooltip-desc');
export const coffeeToast = document.getElementById('coffee-toast');
const visionBtn = document.getElementById('vision-btn');
const visionText = document.getElementById('vision-text');
const badgeContainer = document.getElementById('badge-container');

export const badges: Array<{ el: HTMLDivElement; obj: any }> = [];
const makeBadge = (obj: any) => {
  const el = document.createElement('div');
  el.className = 'vision-badge';
  el.innerText = `[?] ${obj.userData.info.title}`;
  badgeContainer.appendChild(el);
  badges.push({ el, obj });
};
interactiveObjects.forEach(makeBadge);
onRegister(makeBadge);   // วัตถุที่ลงทะเบียนทีหลัง (ลังเอกสาร, โต๊ะ)

function toggleDetectiveVision() {
  S.detectiveVision = !S.detectiveVision;
  visionBtn.classList.toggle('active', S.detectiveVision);
  visionText.innerText = S.detectiveVision ? 'Detective vision: ON' : 'Detective vision: OFF';
  badges.forEach(b => {
    if (!S.detectiveVision) b.el.style.display = 'none';
  });
}
visionBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDetectiveVision();
});

// ไฮไลต์วัตถุ: ยกเว้นเส้นเชือกสีแดง และวัตถุที่กำหนด noHighlight (เช่น หน้าต่าง)
const origMeshStates = new Map();
export function setHighlight(obj, enable) {
  if (obj.userData?.info?.noHighlight) return;

  obj.traverse(child => {
    if (child.isMesh && child.material && child.material.emissive) {
      if (child.material === redStringMat) return;

      if (!origMeshStates.has(child)) {
        origMeshStates.set(child, {
          emissiveHex: child.material.emissive.getHex(),
          emissiveIntensity: child.material.emissiveIntensity !== undefined ? child.material.emissiveIntensity : 0
        });
      }
      const orig = origMeshStates.get(child);
      if (enable) {
        child.material.emissive.setHex(0xffaa44);
        child.material.emissiveIntensity = Math.max(orig.emissiveIntensity, obj.userData?.info?.glow ?? 0.75);
      } else {
        child.material.emissive.setHex(orig.emissiveHex);
        child.material.emissiveIntensity = orig.emissiveIntensity;
      }
    }
  });
}

const coffeeQuotes = [
  "Black coffee: the main fuel for debugging at 3 a.m.",
  "Temperature: as cold as last night's failed build.",
  "Dark roast, because deploy day never ends early.",
  "99% caffeine, 1% logic. A detective's secret recipe.",
  "Only the dregs left... and the deadlock is still unsolved."
];

const coffeeBubble = document.getElementById('coffee-bubble');
const coffeeQuote = document.getElementById('coffee-quote');
let coffeeTyping = null, coffeeDismiss = null, coffeeCleanup = null;
export function showCoffeeToast() {
  clearInterval(coffeeTyping); clearTimeout(coffeeDismiss); clearTimeout(coffeeCleanup);
  const quote = coffeeQuotes[Math.floor(Math.random() * coffeeQuotes.length)].replace(/^☕\s*/, '');
  coffeeQuote.textContent = '';
  coffeeBubble.classList.remove('smoke-away');
  coffeeBubble.classList.add('visible');
  const letters = Array.from(quote);
  let i = 0;
  coffeeTyping = setInterval(() => {
    coffeeQuote.textContent += letters[i++] || '';
    if (i >= letters.length) clearInterval(coffeeTyping);
  }, 48);
  coffeeDismiss = setTimeout(() => {
    clearInterval(coffeeTyping);
    coffeeBubble.classList.add('smoke-away');
    coffeeCleanup = setTimeout(() => {
      coffeeBubble.classList.remove('visible', 'smoke-away');
    }, 850);
  }, 7000);
}
export function updateCoffeeBubble() {
  if (!coffeeBubble.classList.contains('visible')) return;
  const point = new THREE.Vector3(0.25, 0.51, sfZ + 1.05).project(camera);
  const x = (point.x * .5 + .5) * innerWidth;
  const y = (-point.y * .5 + .5) * innerHeight;
  const maxW = Math.min(380, innerWidth * 0.82), left = Math.max(40, Math.min(x, innerWidth - maxW - 16));
  coffeeBubble.style.left = left + 'px'; coffeeBubble.style.setProperty('--tx', Math.max(20, Math.min(maxW - 24, x - left + 26)) + 'px');
  coffeeBubble.style.top = Math.max(125, y - 23) + 'px';
}

export const mouse = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
window.addEventListener('pointermove', e => {
  mouse.x = (e.clientX / innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / innerHeight - 0.5) * 2;
  mouseClient.x = e.clientX;
  mouseClient.y = e.clientY;
  const overUI = !!(e.target as HTMLElement).closest?.('#menu-panel, #menu-btn, #vision-btn, #tour-bar, #back-btn, #inventory');
  mouseNDC.x = overUI ? -999 : (e.clientX / innerWidth) * 2 - 1;
  mouseNDC.y = overUI ? -999 : -(e.clientY / innerHeight) * 2 + 1;
});
