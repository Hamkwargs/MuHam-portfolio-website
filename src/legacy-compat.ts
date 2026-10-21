import * as THREE from 'three';

/**
 * Three.js r128 -> ล่าสุด: ทำให้หน้าตาเหมือนเดิม (pipeline เก่า)
 *  1) ปิด ColorManagement + output linear  -> สี/แสงคำนวณเหมือน r128
 *  2) LI = PI : แสงใน r128 (non-physical) คูณ PI อยู่ภายใน ตอนนี้ต้องคูณเอง
 *  3) แก้สูตร distance attenuation ของ Point/SpotLight กลับเป็นแบบเก่า
 * ถ้าอยากเปลี่ยนไปใช้ physically-correct lighting ภายหลัง ให้ลบไฟล์นี้แล้วจูนค่าแสงใหม่
 */
THREE.ColorManagement.enabled = false;

export const LI = Math.PI;

const chunk = THREE.ShaderChunk.lights_pars_begin;
const re = /float getDistanceAttenuation\([^)]*\)\s*\{[\s\S]*?\n\}/;
if (re.test(chunk)) {
  THREE.ShaderChunk.lights_pars_begin = chunk.replace(
    re,
    `float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
		return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
	}
	return 1.0;
}`
  );
} else {
  console.warn('[legacy-compat] getDistanceAttenuation chunk not found - point/spot falloff will differ');
}
