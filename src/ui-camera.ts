/** เวกเตอร์กล้องที่ใช้ร่วมกันระหว่าง animate() กับ rig */
import * as THREE from 'three';
import { CAM } from './config';
export const focusTarget = new THREE.Vector3();
export const normalTarget = new THREE.Vector3();
export const cameraTarget = new THREE.Vector3();
export const cameraLook = new THREE.Vector3(CAM.x, CAM.lookY, 0);
