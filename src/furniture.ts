/** เฟอร์นิเจอร์และวัตถุในห้อง (บอร์ด โต๊ะ PC โคมไฟ ถ้วยรางวัล ฯลฯ) */
import * as THREE from 'three';
import { LI } from './legacy-compat';
import { BANKER_GREEN, WARM_LAMP } from './config';
import { scene } from './core';
import { box, rnd } from './helpers';
import { corkTex } from './textures';
import { W, bkX, bkZ, bz, windowInteractGroup } from './room';
import { registerInteractable } from './interactables';

registerInteractable(windowInteractGroup, {
  name: "Window blinds",
  title: "Change the mood (weather / day / night)",
  desc: "Click to cycle: overcast → sunny → dusk → night",
  type: "window",
  noHighlight: true,
  center: new THREE.Vector3(0, 1.7, bz + 0.2)
});


box(bkX - 0.08, 1.22, bkZ + 0.7, 0.12, 0.24, 0.12, 0xb86820, { a: 0.85, r: 0.1 });
box(bkX - 0.08, 1.15, bkZ + 0.9, 0.09, 0.1, 0.09, 0xd0e8ec, { a: 0.65, r: 0.1 });

export const framesGroup = new THREE.Group();
box(2.75, 1.55, bz + 0.12, 0.48, 0.38, 0.03, 0xb8883b, { m: 0.7, r: 0.3, parent: framesGroup });
box(2.75, 1.55, bz + 0.14, 0.4, 0.3, 0.02, 0xeee7d5, { r: 0.9, parent: framesGroup });
// กรอบรูปใหญ่ 2 ใบ (รูปจริง + รูป pixel) อยู่ใน frames.ts
scene.add(framesGroup);
registerInteractable(framesGroup, {
  name: "Picture frames",
  title: "Player profile (behind the frame)",
  desc: "Click a picture - something is hidden behind it",
  type: "resume",
  center: new THREE.Vector3(2.55, 1.95, bz + 0.14)
});

// บอร์ดสืบสวนคดี (ขยับมาข้างหน้า Z = 0.45 ให้ห่างจากถ้วยรางวัลชัดเจน)
export const boardGroup = new THREE.Group();
export const boardX = -W / 2 + 0.08, boardZ = 0.0;
box(boardX, 1.95, boardZ, 0.05, 1.3, 2.2, 0xffffff, { map: corkTex, parent: boardGroup });
box(boardX - 0.01, 1.95, boardZ, 0.04, 1.36, 2.26, 0x2e190e, { parent: boardGroup });

// (กระดาษ/โพลารอยด์/เชือกบนบอร์ดอยู่ใน board-items.ts)
export const redStringMat = new THREE.MeshStandardMaterial({ color: 0xc91818, roughness: 0.8, metalness: 0.0, emissive: 0x000000 });
scene.add(boardGroup);
registerInteractable(boardGroup, {
  name: "Case board",
  title: "Profile, Education & Experience",
  desc: "Who I am, where I studied and where I worked",
  type: "board",
  glow: 0.2,   // บอร์ดใหญ่ → เรืองเบา ๆ ไม่ให้ไหม้
  center: new THREE.Vector3(boardX + 0.1, 1.95, boardZ)
});

export const sfZ = bz + 0.9;
box(0, 0.42, sfZ, 2.6, 0.38, 0.95, 0x8a4522, { r: 0.7 });
box(0, 0.82, sfZ - 0.38, 2.6, 0.55, 0.24, 0x7b3b1c, { r: 0.7 });
box(-1.38, 0.62, sfZ - 0.05, 0.2, 0.45, 0.9, 0x6e3316, { r: 0.7 });
box(1.38, 0.62, sfZ - 0.05, 0.2, 0.45, 0.9, 0x6e3316, { r: 0.7 });
[[-1.15, -0.35], [1.15, -0.35], [-1.15, 0.35], [1.15, 0.35]].forEach(([dx, dz]) => {
  box(dx, 0.11, sfZ + dz, 0.06, 0.22, 0.06, 0x3d2010);
  box(dx, 0.03, sfZ + dz, 0.07, 0.06, 0.07, 0xc49b45, { m: 0.8, r: 0.3 });
});
box(-0.85, 0.65, sfZ - 0.18, 0.42, 0.35, 0.16, 0xa87832, { rz: 0.18, ry: 0.2 });
box(0.85, 0.65, sfZ - 0.18, 0.42, 0.35, 0.16, 0x2e4b3c, { rz: -0.2, ry: -0.2 });

box(0, 0.28, sfZ + 1.05, 1.4, 0.06, 0.65, 0x422616, { r: 0.6 });
[[-0.6, -0.24], [0.6, -0.24], [-0.6, 0.24], [0.6, 0.24]].forEach(([dx, dz]) => {
  box(dx, 0.12, sfZ + 1.05 + dz, 0.04, 0.24, 0.04, 0x221309);
});
box(-0.25, 0.32, sfZ + 1.05, 0.28, 0.02, 0.35, 0xd0c4b0, { ry: 0.18 });

const coffeeGroup = new THREE.Group();
box(0.25, 0.36, sfZ + 1.05, 0.1, 0.12, 0.1, 0xf5f0eb, { parent: coffeeGroup });
const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 8, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf5f0eb }));
mugHandle.position.set(0.31, 0.36, sfZ + 1.05);
mugHandle.rotation.y = Math.PI / 2;
coffeeGroup.add(mugHandle);
const coffeeHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.25, 0.24), new THREE.MeshBasicMaterial({ visible: false }));
coffeeHitbox.position.set(0.25, 0.36, sfZ + 1.05);
coffeeGroup.add(coffeeHitbox);
// Small voxel steam wisps drift continuously above the mug.
export const coffeeSteam = [];
for (let i = 0; i < 15; i++) {
  const steam = new THREE.Mesh(new THREE.BoxGeometry(.018,.018,.018),
    new THREE.MeshBasicMaterial({color:0xf4e9d8,transparent:true,opacity:.28,depthWrite:false}));
  steam.userData.phase = i / 15;
  scene.add(steam); coffeeSteam.push(steam);
}
scene.add(coffeeGroup);
registerInteractable(coffeeGroup, {
  name: "Black coffee",
  title: "The detective's coffee cup",
  desc: "Click for a sip and an energy check",
  type: "coffee",
  center: new THREE.Vector3(0.25, 0.38, sfZ + 1.05)
});

const dkX = -1.5, dkZ = 1.1;
box(dkX, 0.72, dkZ, 2.1, 0.09, 1.1, 0x4a2a16, { r: 0.6 });
box(dkX - 0.7, 0.42, dkZ, 0.55, 0.52, 0.95, 0x3d2010);
box(dkX + 0.7, 0.42, dkZ, 0.55, 0.52, 0.95, 0x3d2010);
[-0.2, 0.0, 0.2].forEach(dy => {
  box(dkX - 0.7, 0.42 + dy, dkZ + 0.49, 0.22, 0.035, 0.03, 0xd8b257, { m: 0.8, r: 0.3 });
  box(dkX + 0.7, 0.42 + dy, dkZ + 0.49, 0.22, 0.035, 0.03, 0xd8b257, { m: 0.8, r: 0.3 });
});
// Desk legs — aligned under the two pedestal cabinets
[
  [-0.88, -0.34],
  [-0.88, 0.34],
  [0.88, -0.34],
  [0.88, 0.34]
].forEach(([dx, dz]) => {
  // wooden leg
  box(dkX + dx, 0.10, dkZ + dz, 0.08, 0.20, 0.08, 0x3d2010, { r: 0.65 });
  // brass foot
  box(dkX + dx, 0.025, dkZ + dz, 0.09, 0.05, 0.09, 0xb89040, { m: 0.8, r: 0.25 });
});

export const pcGroup = new THREE.Group();
export const pcX = dkX - 0.2, pcZ = dkZ - 0.15;
box(pcX, 0.82, pcZ, 0.52, 0.13, 0.52, 0xd5cbba, { r: 0.8, parent: pcGroup });
box(pcX + 0.14, 0.82, pcZ + 0.26, 0.14, 0.03, 0.02, 0x333333, { parent: pcGroup });
box(pcX, 1.08, pcZ, 0.48, 0.38, 0.46, 0xc8bfae, { r: 0.75, parent: pcGroup });
box(pcX, 1.08, pcZ + 0.22, 0.42, 0.32, 0.05, 0x222622, { r: 0.2, parent: pcGroup });
box(pcX, 1.08, pcZ + 0.24, 0.36, 0.26, 0.02, 0x244f36, { e: 0x2ed96f, ei: 0.45, cs: false, parent: pcGroup });
box(pcX, 0.78, pcZ + 0.38, 0.44, 0.04, 0.18, 0xd8d0c0, { rx: 0.12, r: 0.8, parent: pcGroup });
scene.add(pcGroup);
registerInteractable(pcGroup, {
  name: "CRT computer",
  title: "Projects & skills",
  desc: "Case files of my projects and a skills sheet",
  type: "pc",
  center: new THREE.Vector3(pcX, 1.08, pcZ + 0.1)
});

const lampGroup = new THREE.Group();
box(dkX + 0.72, 0.78, dkZ - 0.15, 0.16, 0.03, 0.16, 0xc89e43, { m: 0.8, r: 0.3, parent: lampGroup });
box(dkX + 0.72, 0.92, dkZ - 0.15, 0.03, 0.26, 0.03, 0xc89e43, { m: 0.8, r: 0.3, parent: lampGroup });
export const lampShade = box(dkX + 0.72, 1.05, dkZ - 0.15, 0.28, 0.1, 0.14, BANKER_GREEN, {
  e: 0x22aa44, ei: 0.5, r: 0.3, parent: lampGroup
});
scene.add(lampGroup);

export const deskLight = new THREE.PointLight(WARM_LAMP, 2.2 * LI, 5.0, 1.6);
deskLight.position.set(dkX + 0.72, 0.98, dkZ - 0.05);
scene.add(deskLight);

// (ของบนโต๊ะย้ายไป desk.ts)

const chairGroup = new THREE.Group();
box(0, 0.45, 0, 0.65, 0.12, 0.65, 0x9b4a24, { r: 0.7, parent: chairGroup });
box(0, 0.85, 0.28, 0.62, 0.68, 0.12, 0x8a3e1b, { r: 0.7, rx: 0.1, parent: chairGroup });
box(0, 0.2, 0, 0.08, 0.4, 0.08, 0x1a1a1a, { m: 0.8, parent: chairGroup });
[0, 1.57, 3.14, 4.71].forEach(rot => {
  box(Math.cos(rot) * 0.25, 0.04, Math.sin(rot) * 0.25, 0.28, 0.04, 0.06, 0x222222, { ry: rot, parent: chairGroup });
});
chairGroup.position.set(-1.90, 0, 1.75);
chairGroup.rotation.y = -0.55;
scene.add(chairGroup);

const fcX = -3.0, fcZ = -1.8;
box(fcX, 0.95, fcZ, 0.75, 1.9, 0.8, 0x3d4347, { m: 0.6, r: 0.6 });
for (let i = 0; i < 4; i++) {
  const drawerOut = (i === 1) ? 0.24 : (i === 2 ? 0.1 : 0);
  box(fcX, 0.26 + i * 0.44, fcZ + drawerOut, 0.68, 0.38, 0.74, 0x4d555a, { m: 0.5, r: 0.6 });
  box(fcX, 0.26 + i * 0.44, fcZ + drawerOut + 0.38, 0.18, 0.06, 0.04, 0xb8b8b8, { m: 0.8, r: 0.2 });
  if (i === 1) {
    box(fcX, 0.44 + i * 0.44, fcZ + drawerOut + 0.15, 0.5, 0.18, 0.4, 0xedd6ad, { rx: -0.2 });
  }
}

const topCabinetY = 1.9;
const darkBaseMat = new THREE.MeshStandardMaterial({ color: 0x1b1918, roughness: 0.35 });
const woodBaseMat = new THREE.MeshStandardMaterial({ color: 0x442616, roughness: 0.6 });
const trophyAllGroup = new THREE.Group();

function makeGoldMat() {
  return new THREE.MeshStandardMaterial({ color: 0xf0c040, metalness: 0.95, roughness: 0.18, emissive: 0x000000 });
}

const tr1Base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.05, 8), darkBaseMat);
tr1Base.position.set(fcX + 0.12, topCabinetY + 0.025, fcZ - 0.15);
const tr1Plaque = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.01), makeGoldMat());
tr1Plaque.position.set(fcX + 0.12, topCabinetY + 0.025, fcZ - 0.05);
const tr1Stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.06, 8), makeGoldMat());
tr1Stem.position.set(fcX + 0.12, topCabinetY + 0.075, fcZ - 0.15);
const tr1Bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.045, 0.14, 12, 1, true), makeGoldMat());
tr1Bowl.position.set(fcX + 0.12, topCabinetY + 0.165, fcZ - 0.15);
const tr1BowlInner = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), makeGoldMat());
tr1BowlInner.rotation.x = -Math.PI / 2;
tr1BowlInner.position.set(fcX + 0.12, topCabinetY + 0.096, fcZ - 0.15);

const handleGeo = new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI);
const tr1HandleL = new THREE.Mesh(handleGeo, makeGoldMat());
tr1HandleL.position.set(fcX + 0.01, topCabinetY + 0.17, fcZ - 0.15);
tr1HandleL.rotation.z = Math.PI / 2;
const tr1HandleR = new THREE.Mesh(handleGeo, makeGoldMat());
tr1HandleR.position.set(fcX + 0.23, topCabinetY + 0.17, fcZ - 0.15);
tr1HandleR.rotation.z = -Math.PI / 2;
trophyAllGroup.add(tr1Base, tr1Plaque, tr1Stem, tr1Bowl, tr1BowlInner, tr1HandleL, tr1HandleR);

const tr2Base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.05, 6), woodBaseMat);
tr2Base.position.set(fcX - 0.14, topCabinetY + 0.025, fcZ + 0.12);
const tr2PillarMat = new THREE.MeshStandardMaterial({ color: 0x8fd3e8, transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0.1 });
const tr2Pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.22, 6), tr2PillarMat);
tr2Pillar.position.set(fcX - 0.14, topCabinetY + 0.15, fcZ + 0.12);

const starShape = new THREE.Shape();
const starPoints = 5, outerR = 0.075, innerR = 0.032;
for (let i = 0; i < starPoints * 2; i++) {
  const r = (i % 2 === 0) ? outerR : innerR;
  const a = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
  const sx = Math.cos(a) * r, sy = Math.sin(a) * r;
  if (i === 0) starShape.moveTo(sx, sy);
  else starShape.lineTo(sx, sy);
}
starShape.closePath();
const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
starGeo.center();
const tr2Star = new THREE.Mesh(starGeo, makeGoldMat());
tr2Star.position.set(fcX - 0.14, topCabinetY + 0.29, fcZ + 0.12);
tr2Star.rotation.y = -0.15;
trophyAllGroup.add(tr2Base, tr2Pillar, tr2Star);

const trophyHitbox = new THREE.Mesh(
  new THREE.BoxGeometry(0.72, 0.65, 0.72),
  new THREE.MeshBasicMaterial({ visible: false })
);
trophyHitbox.position.set(fcX, topCabinetY + 0.26, fcZ);
trophyAllGroup.add(trophyHitbox);

scene.add(trophyAllGroup);
registerInteractable(trophyAllGroup, {
  name: "Trophy shelf",
  title: "Awards & competitions",
  desc: "Hackathons, competitions and activities",
  type: "trophy",
  center: new THREE.Vector3(fcX, topCabinetY + 0.25, fcZ)
});

const plX = -3.1, plZ = 2.4;
[0, 2.09, 4.18].forEach(ang => {
  box(plX + Math.cos(ang) * 0.13, 0.14, plZ + Math.sin(ang) * 0.13, 0.03, 0.28, 0.03, 0x422616);
});
box(plX, 0.18, plZ, 0.24, 0.03, 0.24, 0x422616);
box(plX, 0.32, plZ, 0.3, 0.26, 0.3, 0xedebe4, { r: 0.35 });
box(plX, 0.43, plZ, 0.26, 0.04, 0.26, 0x2d1a0e, { r: 1 });
const leafColors = [0x2c5e3b, 0x376f47, 0x1f4629, 0x417d52];
for (let i = 0; i < 8; i++) {
  const lx = plX + rnd(-0.09, 0.09);
  const lz = plZ + rnd(-0.09, 0.09);
  const lh = rnd(0.24, 0.38);
  box(lx, 0.45 + lh / 2, lz, rnd(0.09, 0.13), lh, rnd(0.03, 0.06),
    leafColors[i % leafColors.length], { rz: rnd(-0.25, 0.25), rx: rnd(-0.25, 0.25), r: 0.8 });
}

const rugY = 0.015;
box(0, rugY, 0.6, 3.8, 0.02, 2.8, 0x7a221e, { r: 1, cs: false }).userData.noOcc = true;

// กระดาษที่ขยำ (แต่ละก้อนมี material แยก ไม่ให้เกิดการแชร์ emissive ค้าง)
const crumpledGroup = new THREE.Group();
function crumpledPaperMesh(x, y, z, size = 0.1) {
  const group = new THREE.Group();
  const mat1 = new THREE.MeshStandardMaterial({ color: 0xede4d4, roughness: 0.95, emissive: 0x000000 });
  const mat2 = new THREE.MeshStandardMaterial({ color: 0xede4d4, roughness: 0.95, emissive: 0x000000 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.8, size * 0.9), mat1);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.75, size * 0.9, size * 0.8), mat2);
  b2.rotation.set(0.4, 0.6, 0.5);
  group.add(b1, b2);
  group.position.set(x, y + size * 0.45, z);
  group.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
  crumpledGroup.add(group);
}
const paperCoords = [
  [-0.6, rugY, 0.8, 0.11],
  [-1.0, rugY, 0.4, 0.13],
  [-0.3, rugY, 1.4, 0.09],
  [0.5, rugY, 0.6, 0.12],
  [-1.5, 0.01, 1.7, 0.14],
  [0.9, rugY, 1.2, 0.1],
  [1.4, 0.01, 1.6, 0.12],
  [-0.8, rugY, -0.1, 0.1]
];
paperCoords.forEach(([px, py, pz, ps]) => crumpledPaperMesh(px, py, pz, ps));

const paperHitbox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 2.2), new THREE.MeshBasicMaterial({ visible: false }));
paperHitbox.position.set(-0.1, 0.12, 0.9);
crumpledGroup.add(paperHitbox);

scene.add(crumpledGroup);
// (กล่องเครื่องมือย้ายไป crate.ts)

