
/** โต๊ะข้างประตู (ตู้ข้างประตู): โทรศัพท์ + โพสต์อิทช่องทางติดต่อ · CV พับสามทบ (พับท่อนล่างเข้ามา 1 ทบ) · กุญแจ · เทียน — ขยับได้ */
import * as THREE from 'three';
import { scene } from './core';
import { box } from './helpers';
import { bkX } from './room';
import { registerInteractable } from './interactables';

export const TABLE = {
  x: bkX,
  y: 1.102,
  minX: 2.98,
  maxX: 3.56,
  minZ: 0.1,
  maxZ: 1.55,
  cz: 0.85,
};

export const tableGroup = new THREE.Group();

export interface TableItem {
  id: 'phone' | 'key' | 'candle';
  group: THREE.Group;
  radius: number;
  label: string;
}

export const items: TableItem[] = [];

const add = (
  id: TableItem['id'],
  g: THREE.Group,
  x: number,
  z: number,
  ry: number,
  radius: number,
  label: string
) => {
  g.position.set(x, TABLE.y, z);
  g.rotation.y = ry;
  tableGroup.add(g);
  items.push({ id, group: g, radius, label });
};

const tex = (
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D) => void
) => {
  const cv2 = document.createElement('canvas');
  cv2.width = w;
  cv2.height = h;

  draw(cv2.getContext('2d')!);

  const t = new THREE.CanvasTexture(cv2);
  t.magFilter = t.minFilter = THREE.NearestFilter;

  return { t, cv: cv2 };
};

/** quad แบนในแนวนอน (XZ) โดย u วิ่งตาม +z และ v วิ่งตาม +x */
function flat(
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  map: THREE.Texture | null,
  color = 0xffffff,
  up = true
) {
  const g = new THREE.BufferGeometry();

  const P = [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];

  g.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      P.flatMap(([x, z]) => [x, 0, z]),
      3
    )
  );

  g.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(
      P.flatMap(([x, z]) => [
        (z - z0) / (z1 - z0),
        (x - x0) / (x1 - x0),
      ]),
      2
    )
  );

  g.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(
      Array(4)
        .fill(0)
        .flatMap(() => [
          0,
          up ? 1 : -1,
          0,
        ]),
      3
    )
  );

  g.setIndex(
    up
      ? [0, 3, 2, 0, 2, 1]
      : [0, 1, 2, 0, 2, 3]
  );

  return new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({
      map,
      color,
      roughness: 0.95,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: map ? 0.03 : 0,
    })
  );
}

// ========================================
// PHONE + POST-IT
// ========================================

export const postit = (() => {
  const g = new THREE.Group();
  const C = 0xd23a2f;

  box(
    0, 0.035, 0,
    0.24, 0.07, 0.24,
    0x1d1526,
    { r: 0.5, parent: g }
  );

  box(
    0, 0.08, 0,
    0.18, 0.03, 0.18,
    C,
    { r: 0.4, parent: g }
  );

  box(
    0, 0.105, 0,
    0.11, 0.02, 0.11,
    0x120d14,
    { m: 0.5, parent: g }
  );

  box(
    0, 0.13, -0.02,
    0.065, 0.04, 0.28,
    C,
    { r: 0.4, parent: g }
  );

  box(
    0, 0.11, -0.16,
    0.075, 0.055, 0.055,
    C,
    { parent: g }
  );

  box(
    0, 0.11, 0.12,
    0.075, 0.055, 0.055,
    C,
    { parent: g }
  );

  const t = tex(24, 24, (c) => {
    c.fillStyle = '#ffd23f';
    c.fillRect(0, 0, 24, 24);

    c.fillStyle = '#463427';

    for (let i = 0; i < 5; i++) {
      c.fillRect(
        3,
        5 + i * 3,
        i === 4 ? 9 : 17,
        1
      );
    }

    c.fillStyle = '#d23a2f';
    c.fillRect(3, 2, 6, 1);
  });

  const note = flat(
    -0.055,
    0.055,
    -0.055,
    0.055,
    t.t,
    0x9a9370
  );

  note.position.set(0, 0.152, 0.07);
  note.rotation.x = -0.12;
  note.rotation.z = 0.1;

  g.add(note);

  add(
    'phone',
    g,
    3.3,
    0.3,
    0.5,
    0.2,
    'Phone · contact post-it'
  );

  registerInteractable(g, {
    name: 'Phone',
    title: 'Phone · call me, maybe?',
    desc: 'The post-it next to it has all my contacts',
    type: 'desk',
    center: new THREE.Vector3(3.3, 1.25, 0.3),
  });

  return note;
})();

// ========================================
// GOLD PHONE RIPPLE EFFECT
// ========================================

const RIPPLE_COUNT = 4;

// Slower ripple animation
const RIPPLE_DURATION = 2.5;

// Longer delay between each ripple
const RIPPLE_INTERVAL = 0.85;

// Ripple size
const RIPPLE_MAX_RADIUS = 0.25;
const RIPPLE_START_RADIUS = 0.06;

// Gold color
const RIPPLE_COLOR = 0xffd700;

// Maximum opacity
const RIPPLE_OPACITY = 0.65;

const rippleGeometry = new THREE.RingGeometry(
  0.94,
  1,
  64
);

const rippleGroup = new THREE.Group();
rippleGroup.visible = false;

tableGroup.add(rippleGroup);

const phoneRipples: THREE.Mesh<
  THREE.RingGeometry,
  THREE.MeshBasicMaterial
>[] = [];

for (let i = 0; i < RIPPLE_COUNT; i++) {
  const material = new THREE.MeshBasicMaterial({
    color: RIPPLE_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });

  const ripple = new THREE.Mesh(
    rippleGeometry,
    material
  );

  ripple.rotation.x = -Math.PI / 2;
  ripple.renderOrder = 5;
  ripple.visible = false;

  rippleGroup.add(ripple);
  phoneRipples.push(ripple);
}

let rippleActive = false;
let rippleTime = 0;

export function setPhoneRippleActive(
  active: boolean
) {
  rippleActive = active;
  rippleTime = 0;

  rippleGroup.visible = active;

  phoneRipples.forEach((ripple) => {
    ripple.visible = false;
    ripple.material.opacity = 0;
  });

  if (active) {
    updatePhoneRipple(0);
  }
}

export function updatePhoneRipple(dt: number) {
  if (!rippleActive) return;

  const phone = items.find(
    (item) => item.id === 'phone'
  );

  if (!phone || !phone.group.visible) {
    rippleGroup.visible = false;
    return;
  }

  rippleGroup.visible = true;

  rippleTime += Math.max(0, dt);

  // Follow the phone when dragged
  rippleGroup.position.set(
    phone.group.position.x,
    TABLE.y + 0.008,
    phone.group.position.z
  );

  phoneRipples.forEach((ripple, index) => {
    const elapsed =
      rippleTime - index * RIPPLE_INTERVAL;

    if (elapsed < 0) {
      ripple.visible = false;
      ripple.material.opacity = 0;
      return;
    }

    const progress =
      (elapsed % RIPPLE_DURATION) /
      RIPPLE_DURATION;

    // Slowly expand outward
    const radius =
      RIPPLE_START_RADIUS +
      progress * RIPPLE_MAX_RADIUS;

    ripple.visible = true;

    ripple.scale.setScalar(radius);

    // Smooth fade-out
    ripple.material.opacity =
      RIPPLE_OPACITY *
      Math.pow(1 - progress, 1.8);
  });
}

// ========================================
// KEY
// ========================================

(() => {
  const g = new THREE.Group();
  const GOLD = 0xf4b73c;

  box(
    -0.07, 0.01, 0,
    0.06, 0.012, 0.06,
    GOLD,
    { m: 0.7, r: 0.3, parent: g }
  );

  box(
    -0.07, 0.01, 0,
    0.026, 0.014, 0.026,
    0x1d1526,
    { parent: g }
  );

  box(
    0, 0.01, 0,
    0.12, 0.012, 0.018,
    GOLD,
    { m: 0.7, r: 0.3, parent: g }
  );

  box(
    0.04, 0.01, 0.022,
    0.018, 0.012, 0.03,
    GOLD,
    { m: 0.7, parent: g }
  );

  box(
    0.065, 0.01, 0.018,
    0.018, 0.012, 0.022,
    GOLD,
    { m: 0.7, parent: g }
  );

  add(
    'key',
    g,
    3.1,
    0.7,
    0.4,
    0.1,
    'Old brass key'
  );
})();

// ========================================
// CANDLE
// ========================================

export const candle = (() => {
  const g = new THREE.Group();

  box(
    0, 0.006, 0,
    0.1, 0.012, 0.1,
    0xb8913a,
    { m: 0.8, r: 0.3, parent: g }
  );

  box(
    0, 0.06, 0,
    0.034, 0.1, 0.034,
    0xf2ead2,
    { r: 0.9, parent: g }
  );

  box(
    0, 0.113, 0,
    0.004, 0.012, 0.004,
    0x1d1526,
    { parent: g }
  );

  const flame = new THREE.Group();

  flame.position.set(0, 0.13, 0);
  flame.visible = false;

  box(
    0, 0, 0,
    0.018, 0.03, 0.018,
    0xff8a1f,
    {
      e: 0xff8a1f,
      ei: 1.6,
      cs: false,
      parent: flame,
    }
  );

  box(
    0, -0.003, 0,
    0.009, 0.018, 0.009,
    0xfff3b0,
    {
      e: 0xfff3b0,
      ei: 2,
      cs: false,
      parent: flame,
    }
  );

  const light = new THREE.PointLight(
    0xffa24f,
    0,
    1.6,
    1.4
  );

  flame.add(light);
  g.add(flame);

  add(
    'candle',
    g,
    3.46,
    1.45,
    0,
    0.1,
    'Candle'
  );

  return { flame, light };
})();

// ========================================
// TABLE INTERACTION AREA
// ========================================

const hit = new THREE.Mesh(
  new THREE.BoxGeometry(
    0.7,
    0.06,
    1.6
  ),
  new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
);

hit.position.set(
  TABLE.x,
  TABLE.y + 0.02,
  TABLE.cz + 0.1
);

tableGroup.add(hit);

scene.add(tableGroup);

registerInteractable(tableGroup, {
  name: 'Side table',
  title: 'Contact · side table by the door',
  desc: 'Phone, post-its, a key and a candle',
  type: 'desk',
  noHighlight: true,
  center: new THREE.Vector3(
    TABLE.x,
    1.2,
    TABLE.cz
  ),
});
