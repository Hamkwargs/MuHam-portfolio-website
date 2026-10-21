/** depth-only occluder ให้เฟอร์นิเจอร์บังลำแสง/ฝุ่น */
import * as THREE from 'three';
import { dustScene, rayScene, scene } from './core';
import { shellCount } from './room';

// ===== Depth-only occluders: เฟอร์นิเจอร์ใกล้สายตาบัง shaft และฝุ่น =====
{
  const occMat = new THREE.MeshBasicMaterial({ colorWrite: false });
  scene.updateMatrixWorld(true);
  scene.children.slice(shellCount).forEach(root => root.traverse((m: any) => {
    if (!m.isMesh || m.userData.noOcc) return;
    const mat = m.material;
    if (!mat || mat.visible === false || mat.transparent) return;
    [rayScene, dustScene].forEach(sc => {
      const o = new THREE.Mesh(m.geometry, occMat);
      o.matrixAutoUpdate = false;
      o.matrix.copy(m.matrixWorld);
      o.renderOrder = -10;
      sc.add(o);
    });
  }));
}
