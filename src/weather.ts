/** MOODS, ปรับแสงตามบรรยากาศ, ดึงสภาพอากาศไทย, สลับเช้า/ครึม/กลางคืน */
import * as THREE from 'three';
import { LI } from './legacy-compat';
import { S } from './state';
import { WARM_LAMP } from './config';
import { scene, sceneFog } from './core';
import { skyMesh } from './room';
import { deskLight, lampShade } from './furniture';
import { ambientLight, hemiLight, windowLight } from './lights';
import { rayMeshes } from './atmosphere';
import { weatherState } from './weather-state';
import { coffeeToast } from './interaction';

// ===== 3 บรรยากาศ: ฟ้าครึม (เย็น/สว่าง/มีฝน) · เช้าแดดอุ่น · กลางคืน — ปรับค่าสีและความสว่างได้ที่นี่ =====
const MOODS = {
  overcast: {
    tag: 'Overcast · light rain', toast: 'Overcast. A cool drizzle outside.',
    sun: 7, sunColor: 0xcfe0f2, sky: 0x8d9aa8, skyEm: 0x7e8c9b, skyI: 2.2,
    beam: 0.35, beamColor: 0xdbe7f3, fog: 0x4a5663,
    amb: 0x7488a0, ambI: 1.0, hemiSky: 0xdfeaf5, hemiGround: 0x3a4048, hemiI: 0.7
  },
  day: {
    tag: 'Sunny day', toast: 'A warm, bright morning.',
    sun: 10, sunColor: 0xffc77d, sky: 0xffc478, skyEm: 0xffb252, skyI: 2.5,
    beam: 1.2, beamColor: 0xffd58a, fog: 0x28160c,
    amb: 0x402b1f, ambI: 0.85, hemiSky: 0xffdfa8, hemiGround: 0x1f1109, hemiI: 0.4
  },
  dusk: {
    tag: 'Dusk', toast: 'The sun is going down.',
    sun: 4.5, sunColor: 0xff9a5c, sky: 0xd9704a, skyEm: 0xb8502f, skyI: 1.5,
    beam: 0.7, beamColor: 0xffa56b, fog: 0x1c0f10,
    amb: 0x33201c, ambI: 0.8, hemiSky: 0xe8a07a, hemiGround: 0x1f1109, hemiI: 0.4
  },
  night: {
    tag: 'Clear night', toast: 'A quiet night under the moon.',
    sun: 2.2, sunColor: 0x7da4e8, sky: 0x071120, skyEm: 0x050c18, skyI: 0.25,
    beam: 0.2, beamColor: 0xffd58a, fog: 0x0a1018,
    amb: 0x1a1e28, ambI: 0.85, hemiSky: 0x283244, hemiGround: 0x1f1109, hemiI: 0.4
  },
  nightCloud: {
    tag: 'Cloudy night · rain', toast: 'Clouds cover the moon. Rain taps the glass.',
    sun: 0.8, sunColor: 0x5a6f93, sky: 0x0b121c, skyEm: 0x0a1018, skyI: 0.12,
    beam: 0.08, beamColor: 0x9fb3d1, fog: 0x080d14,
    amb: 0x12161e, ambI: 0.75, hemiSky: 0x1d2736, hemiGround: 0x15100c, hemiI: 0.32
  }
};
// ===== ROOM & DESK LAMP LIGHTING PRESETS =====
// ค่าเริ่มต้นทั้งหมดคงเดิม; แยกไว้ให้ปรับตามสภาพอากาศในอนาคต
// room: ambient / hemisphere (สีและความสว่างเดิมอ้างอิง MOODS)
// lamp: point light / shade glow (ค่าเดิมทุกสภาพอากาศ)
const LIGHTING_PRESETS = {
  overcast: { room: { ambientColor: MOODS.overcast.amb, ambientIntensity:0.15,
    skyColor: MOODS.overcast.hemiSky, groundColor: MOODS.overcast.hemiGround, hemisphereIntensity: 0.5},
    lamp: { color: WARM_LAMP, intensity: 1.5, shadeColor: 0x22aa44, shadeIntensity: 0.5 } },
  day: { room: { ambientColor: MOODS.day.amb, ambientIntensity: 0.75,
    skyColor: MOODS.day.hemiSky, groundColor: MOODS.day.hemiGround, hemisphereIntensity: MOODS.day.hemiI },
    lamp: { color: WARM_LAMP, intensity: 2.2, shadeColor: 0x22aa44, shadeIntensity: 1.0 } },
  dusk: { room: { ambientColor: MOODS.dusk.amb, ambientIntensity: MOODS.dusk.ambI,
    skyColor: MOODS.dusk.hemiSky, groundColor: MOODS.dusk.hemiGround, hemisphereIntensity: MOODS.dusk.hemiI },
    lamp: { color: WARM_LAMP, intensity: 2.0, shadeColor: 0x22aa44, shadeIntensity: 0.9 } },
  nightCloud: { room: { ambientColor: MOODS.nightCloud.amb, ambientIntensity: MOODS.nightCloud.ambI,
    skyColor: MOODS.nightCloud.hemiSky, groundColor: MOODS.nightCloud.hemiGround, hemisphereIntensity: MOODS.nightCloud.hemiI },
    lamp: { color: WARM_LAMP, intensity: 2.4, shadeColor: 0x22aa44, shadeIntensity: 1.1 } },
  night: { room: { ambientColor: MOODS.night.amb, ambientIntensity: MOODS.night.ambI,
    skyColor: MOODS.night.hemiSky, groundColor: MOODS.night.hemiGround, hemisphereIntensity: MOODS.night.hemiI },
    lamp: { color: WARM_LAMP, intensity: 2.2, shadeColor: 0x22aa44, shadeIntensity: 1.0 } }
};

S.activeLampLighting = LIGHTING_PRESETS.night.lamp;
function applyRoomLighting(mood) {
  const room = LIGHTING_PRESETS[mood].room;
  ambientLight.color.setHex(room.ambientColor);
  ambientLight.intensity = room.ambientIntensity * LI;
  hemiLight.color.setHex(room.skyColor);
  hemiLight.groundColor.setHex(room.groundColor);
  hemiLight.intensity = room.hemisphereIntensity * LI;
}
function applyLampLighting(mood) {
  S.activeLampLighting = LIGHTING_PRESETS[mood].lamp;
  deskLight.color.setHex(S.activeLampLighting.color);
  lampShade.material.emissive.setHex(S.activeLampLighting.shadeColor);
  // ความสว่างอัปเดตใน animation loop เพื่อรักษาการเปิด/ปิดและ flicker เดิม
}
function applyWeatherLighting(mood) {
  applyRoomLighting(mood);
  applyLampLighting(mood);
}

const MOOD_CYCLE = ['overcast', 'day', 'dusk', 'night'];

function applyMood(mood, temp = S.currentTemp) {
  const M = MOODS[mood];
  S.currentTemp = temp;
  weatherState.mood = mood;
  weatherState.isNight = mood === 'night' || mood === 'nightCloud';
  weatherState.isRain = mood === 'overcast' || mood === 'nightCloud';
  weatherState.isSunny = mood === 'day' || mood === 'dusk';

  document.getElementById('weather-tag').innerText = `${M.tag} · Thailand time (${temp}°C) · click the window to change the mood`;
  weatherState.baseSunIntensity = M.sun;
  weatherState.targetSunColor.setHex(M.sunColor);
  weatherState.targetSkyColor.setHex(M.sky);
  weatherState.targetSkyEmissive.setHex(M.skyEm);
  weatherState.targetSkyIntensity = M.skyI;
  weatherState.beamOpacityMult = M.beam;
  weatherState.fogColor.setHex(M.fog);
  applyWeatherLighting(mood);
  rayMeshes.forEach(m => m.material.color.setHex(M.beamColor));

  skyMesh.material.color.copy(weatherState.targetSkyColor);
  skyMesh.material.emissive.copy(weatherState.targetSkyEmissive);
  skyMesh.material.emissiveIntensity = weatherState.targetSkyIntensity;
  sceneFog.color.copy(weatherState.fogColor);
  (scene.background as THREE.Color).copy(weatherState.fogColor);
  windowLight.color.copy(weatherState.targetSunColor);
}

// คลิกหน้าต่าง: ฟ้าครึม → เช้าแดดอุ่น → กลางคืน → วนใหม่ (และหยุดการเปลี่ยนอัตโนมัติ)
let moodLocked = false;
export function cycleMood() {
  moodLocked = true;
  const next = MOOD_CYCLE[(MOOD_CYCLE.indexOf(weatherState.mood) + 1) % MOOD_CYCLE.length];
  applyMood(next, S.currentTemp);
  coffeeToast.innerText = MOODS[next].toast;
  coffeeToast.classList.add('show');
  clearTimeout(S.toastTimer);
  S.toastTimer = setTimeout(() => coffeeToast.classList.remove('show'), 2600);
}

// ค่าเริ่มต้น: อิงเวลา + สภาพอากาศ "ประเทศไทย" เสมอ (ไม่ขึ้นกับที่อยู่ผู้เข้าชม)
// ฝน/ครึม → ฟ้าครึมโทนเย็น (สว่าง ไม่มืด) · ฟ้าโล่ง → เช้า 06:00–18:00 / กลางคืนนอกช่วงนั้น
const thaiHour = () => parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', hour12: false }).format(new Date()), 10) % 24;
const OVERCAST_CODES = [3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
let apiOvercast = false;
/** เวลา (Bangkok) × สภาพอากาศ: 07-17 กลางวัน · 05-07/17-19 พลบค่ำ · นอกนั้นกลางคืน (ฝน/ครึมตอนกลางคืนต้องมืด ไม่ใช่สว่างแบบกลางวัน) */
export const autoMood = () => {
  const h = thaiHour();
  if (h >= 7 && h < 17) return apiOvercast ? 'overcast' : 'day';
  if ((h >= 5 && h < 7) || (h >= 17 && h < 19)) return 'dusk';
  return apiOvercast ? 'nightCloud' : 'night';
};

applyMood(autoMood(), 29);
setInterval(() => {
  if (!moodLocked && autoMood() !== weatherState.mood) applyMood(autoMood(), S.currentTemp);
}, 60000);

fetch('https://api.open-meteo.com/v1/forecast?latitude=13.79&longitude=100.32&current_weather=true&timezone=Asia%2FBangkok')
  .then(res => res.json())
  .then(data => {
    if (!data || !data.current_weather) return;
    apiOvercast = OVERCAST_CODES.includes(data.current_weather.weathercode);
    applyMood(moodLocked ? weatherState.mood : autoMood(), Math.round(data.current_weather.temperature));
  })
  .catch(() => { });
