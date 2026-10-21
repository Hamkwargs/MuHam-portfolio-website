/** texture วอลเปเปอร์/ไม้/คอร์ก */
import * as THREE from 'three';
import { pixTex, rnd } from './helpers';

export const walnutTex = pixTex(16, 16, g => {
  g.fillStyle = '#4a2f1f'; g.fillRect(0, 0, 16, 16);
  for (let y = 0; y < 16; y += 3) {
    g.fillStyle = `hsl(25, 42%, ${rnd(20, 28)}%)`; g.fillRect(0, y, 16, 2);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.floor(rnd(0, 16)), y, 2, 2);
  }
});
walnutTex.repeat.set(4, 4);

export const corkTex = pixTex(32, 32, g => {
  g.fillStyle = '#8f683a'; g.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 50; i++) {
    g.fillStyle = `rgba(75,40,15,${rnd(0.18, 0.5)})`;
    g.fillRect(Math.floor(rnd(0, 32)), Math.floor(rnd(0, 32)), 2, 2);
  }
});

const wpCanvas = document.createElement('canvas');
wpCanvas.width = 16; wpCanvas.height = 16;
{
  const g = wpCanvas.getContext('2d');
  g.fillStyle = '#d1bc94'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = 'rgba(110,75,40,0.18)';
  for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 2, 16);
}

const STRIPE_UNIT = 0.8;
export function getAlignedWallpaper(minX, width, height) {
  const t = new THREE.CanvasTexture(wpCanvas);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(width / STRIPE_UNIT, height / STRIPE_UNIT);
  t.offset.set(((minX % STRIPE_UNIT) + STRIPE_UNIT) % STRIPE_UNIT / STRIPE_UNIT, 0);
  return t;
}
