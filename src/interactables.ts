/** รายการวัตถุที่คลิกได้ + registerInteractable() */

// =========================================================================
// INTERACTIVE ITEMS
// =========================================================================
export const interactiveObjects = [];
const listeners: Array<(o: any) => void> = [];
export const onRegister = (f: (o: any) => void) => listeners.push(f);
export function registerInteractable(groupOrMesh, data) {
  groupOrMesh.userData.info = data;
  interactiveObjects.push(groupOrMesh);
  listeners.forEach(f => f(groupOrMesh));
}
