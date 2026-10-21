/** weatherState ที่แชร์ระหว่าง weather กับ atmosphere */
import * as THREE from 'three';

// =========================================================================
// สภาพอากาศ & การสลับเวลา เช้า / กลางคืน
// =========================================================================

export const weatherState = {
  mood: 'night',
  isNight: true,
  isRain: false,       // ฟ้าครึม (overcast) = มีฝนโปรย
  isSunny: false,      // เช้าแดดอุ่น
  baseSunIntensity: 2.2,
  targetSunColor: new THREE.Color(0x7da4e8),
  targetSkyColor: new THREE.Color(0x071120),
  targetSkyEmissive: new THREE.Color(0x050c18),
  targetSkyIntensity: 0.25,
  beamOpacityMult: 0.2,
  fogColor: new THREE.Color(0x0a1018)
};
