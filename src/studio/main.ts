import * as THREE from 'three';

type FontInfo = {
  id: string;
  family: string;
  weights: number[];
  defSubset?: string;
  category?: string;
};

type TextLayer = {
  id: number;
  text: string;
  fontId: string;
  family: string;
  weight: number;
  size: number;
  pixel: number;
  color: string;
  outline: string;
  x: number;
  y: number;
  z: number;
  scale: number;

  renderMode?: 'stacked' | 'extruded';
  depth?: number;
  dirX?: number;
  dirY?: number;
  dirZ?: number;
  sideColor?: string;
  materialType?: 'matte' | 'metallic' | 'emissive' | 'glow';
  metalness?: number;
  roughness?: number;
  glowStrength?: number;
  lightIntensity?: number;
};

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const initialLayers: TextLayer[] = [
  {
    id: 1, text: 'Mon', fontId: 'pixelify-sans',
    family: 'Pixelify Sans', weight: 700,
    size: 36, pixel: 2,
    color: '#fff0cf', outline: '#22140a',
    x: -0.75, y: 2.78, z: -0.6, scale: 0.55
  },
  {
    id: 2, text: 'Folio', fontId: 'great-vibes',
    family: 'Great Vibes', weight: 400,
    size: 105, pixel: 3,
    color: '#ffeab0', outline: '#22140a',
    x: 0, y: 2.18, z: -0.6, scale: 1
  },
  {
    id: 3, text: 'Dossier Personnel',
    fontId: 'pixelify-sans',
    family: 'Pixelify Sans', weight: 700,
    size: 24, pixel: 2,
    color: '#f6c866', outline: '#22140a',
    x: 0.3, y: 1.65, z: -0.6, scale: 0.75
  }
];


const default3D = {
  renderMode: 'stacked' as const,
  depth: 0.18,
  dirX: 0.15,
  dirY: -0.1,
  dirZ: -1,
  sideColor: '#78572f',
  materialType: 'matte' as const,
  metalness: 0.7,
  roughness: 0.32,
  glowStrength: 0.35,
  lightIntensity: 3
};

function normalizeLayer(layer: TextLayer): TextLayer {
  return {
    ...default3D,
    ...layer
  };
}



let layers: TextLayer[] = initialLayers.map(normalizeLayer);
let selectedId = 2;
let fonts: FontInfo[] = [];
let busy = false;

const loadedFonts = new Set<string>();
const fontRequests = new Map<string, Promise<void>>();
const layerObjects = new Map<number, THREE.Group>();

// ------------------------------
// THREE.JS SCENE
// ------------------------------

const viewport = $('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#151c1a');

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 2.2, 9);
camera.lookAt(0, 2.1, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const grid = new THREE.GridHelper(12, 24, '#536156', '#303b34');
grid.position.y = -0.2;
scene.add(grid);

const titleGroup = new THREE.Group();
scene.add(titleGroup);


const ambientLight = new THREE.AmbientLight('#fff3de', 0.8);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight('#ffe3ad', 3);
keyLight.position.set(-3, 5, 6);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight('#9dbbc5', 1.3);
rimLight.position.set(4, 2, -5);
scene.add(rimLight);


function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(viewport);
resize();

// Orbit Preview
let dragging = false;
let previousX = 0;
let previousY = 0;
let yaw = 0;
let pitch = 0;
let distance = 9;

renderer.domElement.addEventListener('pointerdown', e => {
  dragging = true;
  previousX = e.clientX;
  previousY = e.clientY;
  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener('pointerup', () => {
  dragging = false;
});

renderer.domElement.addEventListener('pointermove', e => {
  if (!dragging) return;

  yaw -= (e.clientX - previousX) * 0.005;
  pitch += (e.clientY - previousY) * 0.005;
  pitch = THREE.MathUtils.clamp(pitch, -0.7, 0.7);

  previousX = e.clientX;
  previousY = e.clientY;
  updateCamera();
});

renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  distance = THREE.MathUtils.clamp(distance + e.deltaY * 0.01, 4, 18);
  updateCamera();
}, { passive: false });

function updateCamera() {
  const target = new THREE.Vector3(0, 2.1, -0.6);

  camera.position.set(
    target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
    target.y + Math.sin(pitch) * distance,
    target.z + Math.cos(yaw) * Math.cos(pitch) * distance
  );
  camera.lookAt(target);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// ------------------------------
// FONTSOURCE
// ------------------------------

const fallbackFonts: FontInfo[] = [
  { id: 'great-vibes', family: 'Great Vibes', weights: [400] },
  { id: 'pixelify-sans', family: 'Pixelify Sans', weights: [400, 700] },
  { id: 'playfair-display', family: 'Playfair Display', weights: [400, 700] },
  { id: 'silkscreen', family: 'Silkscreen', weights: [400, 700] },
  { id: 'special-elite', family: 'Special Elite', weights: [400] }
];


const FAVORITES_KEY = 'folio-font-hearts';

function loadFavorites(): Record<string, number> {
  try {
    return JSON.parse(
      localStorage.getItem(FAVORITES_KEY) || '{}'
    );
  } catch {
    return {};
  }
}

const fontFavorites = loadFavorites();

function getHearts(fontId: string): number {
  return Math.max(
    0,
    Math.min(3, fontFavorites[fontId] || 0)
  );
}

function cycleHearts(fontId: string) {
  const next = (getHearts(fontId) + 1) % 4;

  if (next === 0) {
    delete fontFavorites[fontId];
  } else {
    fontFavorites[fontId] = next;
  }

  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(fontFavorites)
  );

  renderFontList();
}


async function loadFontCatalog() {
  try {
    const res = await fetch('https://api.fontsource.org/v1/fonts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    fonts = await res.json() as FontInfo[];
    $('fontStatus').textContent = `${fonts.length} fonts available`;
  } catch {
    fonts = fallbackFonts;
    $('fontStatus').textContent =
      'Fontsource unavailable — showing fallback fonts';
  }

  renderFontList();
}

async function ensureFont(layer: TextLayer) {
  const key = `${layer.fontId}:${layer.weight}`;
  if (loadedFonts.has(key)) return;

  if (!fontRequests.has(key)) {
    const request = (async () => {
      const res = await fetch(
        `https://api.fontsource.org/v1/fonts/${encodeURIComponent(layer.fontId)}`
      );
      if (!res.ok) throw new Error('Cannot fetch font details');

      const detail = await res.json();
      const weightKey = String(layer.weight);
      const variants = detail.variants?.[weightKey]?.normal;

      if (!variants) throw new Error('Font weight not available');

      const subset = variants[detail.defSubset || 'latin']
        || variants.latin
        || Object.values(variants)[0];

      const url = (subset as any)?.url?.woff2 as string | undefined;
      if (!url) throw new Error('Font file not available');

      const face = new FontFace(
        layer.family,
        `url("${url}")`,
        { weight: String(layer.weight) }
      );

      await face.load();
      document.fonts.add(face);
      loadedFonts.add(key);
    })();

    fontRequests.set(key, request);
  }

  try {
    await fontRequests.get(key);
  } catch (error) {
    fontRequests.delete(key);
    throw error;
  }
}

// ------------------------------
// PIXEL TEXTURE GENERATOR
// ------------------------------

function createPixelCanvas(layer: TextLayer): HTMLCanvasElement {
  const width = 512;
  const height = 160;
  const pixel = Math.max(1, Math.floor(layer.pixel));

  const low = document.createElement('canvas');
  low.width = Math.ceil(width / pixel);
  low.height = Math.ceil(height / pixel);

  const ctx = low.getContext('2d')!;
  ctx.clearRect(0, 0, low.width, low.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = layer.size / pixel;
  ctx.font = `${layer.weight} ${fontSize}px "${layer.family}", serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, 2 / pixel);
  ctx.strokeStyle = layer.outline;
  ctx.fillStyle = layer.color;

  const x = low.width / 2;
  const y = low.height / 2;

  ctx.strokeText(layer.text, x, y, low.width - 12);
  ctx.fillText(layer.text, x, y, low.width - 12);

  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;

  const out = output.getContext('2d')!;
  out.imageSmoothingEnabled = false;
  out.drawImage(low, 0, 0, width, height);

  return output;
}

function disposeGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    geometries.add(obj.geometry);
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      materials.add(mat);
      const map = (mat as THREE.MeshBasicMaterial).map;
      if (map) textures.add(map);
    }
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
  textures.forEach(t => t.dispose());
}

function extrusionDirection(layer: TextLayer) {
  const direction = new THREE.Vector3(layer.dirX ?? 0.15, layer.dirY ?? -0.1, layer.dirZ ?? -1);
  if (direction.lengthSq() < 1e-6) direction.set(0, 0, -1);
  return direction.normalize();
}

function makeTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  return texture;
}

function makeMaterial(layer: TextLayer, texture?: THREE.Texture, side = false): THREE.Material {
  const mode = layer.materialType ?? 'matte';
  const color = side ? (layer.sideColor ?? '#78572f') : '#ffffff';
  if (mode === 'matte' || mode === 'metallic') {
    return new THREE.MeshStandardMaterial({
      map: texture ?? null, color, transparent: Boolean(texture),
      alphaTest: texture ? 0.1 : 0,
      metalness: mode === 'metallic' ? (layer.metalness ?? 0.7) : 0,
      roughness: mode === 'metallic' ? (layer.roughness ?? 0.32) : 1,
      side: THREE.DoubleSide
    });
  }
  return new THREE.MeshBasicMaterial({
    map: texture ?? null, color, transparent: Boolean(texture),
    alphaTest: texture ? 0.1 : 0, toneMapped: false, side: THREE.DoubleSide
  });
}

function voxelCells(canvas: HTMLCanvasElement) {
  const sample = document.createElement('canvas');
  sample.width = 96; sample.height = 30;
  const ctx = sample.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, 96, 30);
  const pixels = ctx.getImageData(0, 0, 96, 30).data;
  const cells: number[] = [];
  for (let i = 0; i < 96 * 30; i++) if (pixels[4 * i + 3] >= 128) cells.push(i);
  return cells;
}

const PANEL_WIDTH = 4.05;
const PANEL_HEIGHT = PANEL_WIDTH * 160 / 512;

function addLayerGeometry(group: THREE.Group, layer: TextLayer, canvas: HTMLCanvasElement) {
  const depth = Math.max(0, layer.depth ?? 0.18);
  const direction = extrusionDirection(layer);
  const tex = makeTexture(canvas);

  if (depth > 0 && layer.renderMode === 'extruded') {
    const cells = voxelCells(canvas);
    const geometry = new THREE.BoxGeometry(PANEL_WIDTH / 96 * 1.01, PANEL_HEIGHT / 30 * 1.01, depth);
    const voxel = new THREE.InstancedMesh(geometry, makeMaterial(layer, undefined, true), cells.length);
    const obj = new THREE.Object3D();
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().negate());
    const rotation = obj.quaternion.clone();
    cells.forEach((index, i) => {
      const x = index % 96; const y = Math.floor(index / 96);
      obj.position.set(-PANEL_WIDTH / 2 + (x + 0.5) * PANEL_WIDTH / 96,
        PANEL_HEIGHT / 2 - (y + 0.5) * PANEL_HEIGHT / 30, 0);
      obj.position.addScaledVector(direction, depth / 2);
      obj.quaternion.copy(rotation);
      obj.updateMatrix();
      voxel.setMatrixAt(i, obj.matrix);
    });
    voxel.instanceMatrix.needsUpdate = true;
    voxel.frustumCulled = false;
    group.add(voxel);
  } else if (depth > 0) {
    const steps = Math.min(36, Math.max(2, Math.ceil(depth * 100)));
    // Every plane owns its texture so resources can be disposed safely.
    for (let i = steps; i >= 1; i--) {
      const sideTexture = makeTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: sideTexture, color: layer.sideColor ?? '#78572f',
        transparent: true, alphaTest: 0.1, side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT), mat);
      plane.position.copy(direction.clone().multiplyScalar(depth * i / steps));
      group.add(plane);
    }
  }

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT),
    makeMaterial(layer, tex)
  );
  front.position.z = 0.008;
  group.add(front);

  if (layer.materialType === 'glow' && (layer.glowStrength ?? 0) > 0) {
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT),
      new THREE.MeshBasicMaterial({
        map: makeTexture(canvas), transparent: true, depthWrite: false,
        opacity: Math.min(0.35, (layer.glowStrength ?? 0) * 0.14),
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false
      })
    );
    halo.position.z = 0.025;
    halo.scale.setScalar(1 + (layer.glowStrength ?? 0) * 0.04);
    group.add(halo);
  }
}

function renderLayer(layer: TextLayer) {
  const previous = layerObjects.get(layer.id);
  if (previous) {
    titleGroup.remove(previous);
    disposeGroup(previous);
  }
  const group = new THREE.Group();
  addLayerGeometry(group, layer, createPixelCanvas(layer));
  group.position.set(layer.x, layer.y, layer.z);
  group.scale.setScalar(layer.scale);
  titleGroup.add(group);
  layerObjects.set(layer.id, group);
}

let renderGeneration = 0;
async function renderAll() {
  const generation = ++renderGeneration;
  const ids = new Set(layers.map(l => l.id));
  for (const [id, group] of layerObjects) {
    if (!ids.has(id)) {
      titleGroup.remove(group);
      disposeGroup(group);
      layerObjects.delete(id);
    }
  }
  for (const layer of layers) {
    try { await ensureFont(layer); }
    catch (error) { console.warn('Using fallback font:', layer.family, error); }
    if (generation !== renderGeneration) return;
    renderLayer(layer);
  }
  keyLight.intensity = current().lightIntensity ?? 3;
  $('status').textContent = '3D Preview updated';
}

// ------------------------------
// UI
// ------------------------------

function current(): TextLayer {
  return layers.find(l => l.id === selectedId) || layers[0];
}

function renderLayers() {
  const root = $('layers');
  root.replaceChildren();

  for (const layer of layers) {
    const button = document.createElement('button');
    button.className = `layer ${layer.id === selectedId ? 'active' : ''}`;
    button.textContent = layer.text || 'Untitled';
    button.onclick = () => {
      selectedId = layer.id;
      syncInspector();
      renderLayers();
    };
    root.appendChild(button);
  }
}


function renderFontList() {
  const search = (
    $<HTMLInputElement>('search').value || ''
  ).toLowerCase().trim();

  const category = $<HTMLSelectElement>('fontCategory').value;
  const sort = $<HTMLSelectElement>('fontSort').value;
  const minHearts = Number(
    $<HTMLSelectElement>('fontFavorite').value
  );

  const results = fonts
    .filter(font => {
      const matchesSearch = font.family
        .toLowerCase()
        .includes(search);

      const matchesCategory =
        category === 'all' ||
        font.category === category;

      const matchesHearts =
        getHearts(font.id) >= minHearts;

      return matchesSearch &&
        matchesCategory &&
        matchesHearts;
    })
    .sort((a, b) => {
      if (sort === 'favorites') {
        const diff = getHearts(b.id) - getHearts(a.id);
        if (diff !== 0) return diff;
      }

      return a.family.localeCompare(b.family);
    })
    .slice(0, 80);

  const root = $('fontList');
  root.replaceChildren();

  for (const font of results) {
    const row = document.createElement('div');
    row.className = 'font-row';

    const fontButton = document.createElement('button');
    fontButton.className = 'font-item';

    const fontName = document.createElement('span');
    fontName.textContent = font.family;

    const description = document.createElement('small');
    description.textContent = font.category || 'Fontsource';

    fontButton.append(fontName, description);

    fontButton.onclick = async () => {
      const layer = current();

      layer.fontId = font.id;
      layer.family = font.family;
      layer.weight = font.weights.includes(400)
        ? 400
        : font.weights[0] || 400;

      syncInspector();
      await renderAll();
    };

    const heartsButton = document.createElement('button');
    heartsButton.className = 'font-hearts';
    heartsButton.title = 'Click to rate 0–3 hearts';

    const hearts = getHearts(font.id);

    for (let i = 1; i <= 3; i++) {
      const heart = document.createElement('span');
      heart.textContent = '♥';
      heart.className = i <= hearts ? 'filled' : 'empty';
      heartsButton.appendChild(heart);
    }

    heartsButton.onclick = () => cycleHearts(font.id);

    row.append(fontButton, heartsButton);
    root.appendChild(row);
  }

  $('fontStatus').textContent =
    `${results.length} shown / ${fonts.length} fonts`;
}

// Add the filter/heart UI if the HTML is still the original Phase 1 markup.
function ensureFontControls() {
  const search = $('search');
  const parent = search.parentElement!;
  const definitions: Array<[string, string, Array<[string, string]>]> = [
    ['fontCategory', 'Category', [
      ['all', 'All categories'], ['serif', 'Serif'], ['sans-serif', 'Sans serif'],
      ['display', 'Display'], ['handwriting', 'Handwriting'], ['monospace', 'Monospace']
    ]],
    ['fontSort', 'Sort by', [['name', 'Name A–Z'], ['favorites', 'Highest rated']]],
    ['fontFavorite', 'Hearts', [['0', 'All'], ['1', '1+ hearts'], ['2', '2+ hearts'], ['3', '3 hearts']]]
  ];
  let after: Element = search;
  for (const [id, labelText, choices] of definitions) {
    let element = document.getElementById(id) as HTMLSelectElement | null;
    if (!element) {
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = labelText;
      element = document.createElement('select');
      element.id = id;
      for (const [value, title] of choices) {
        const opt = document.createElement('option');
        opt.value = value; opt.textContent = title;
        element.appendChild(opt);
      }
      after.after(label, element);
    }
    after = element;
  }
  const css = document.createElement('style');
  css.textContent = `.font-row{display:flex;gap:6px;align-items:center;margin-bottom:7px}
.font-row .font-item{flex:1;min-width:0;margin:0}.font-hearts{white-space:nowrap;min-width:72px}
.font-hearts .filled{color:#e66c7c}.font-hearts .empty{color:#66726b}`;
  document.head.append(css);
}
ensureFontControls();

for (const id of [
  'fontCategory',
  'fontSort',
  'fontFavorite'
]) {
  $(id).addEventListener('change', renderFontList);
}


const inspector3D = [
  ['renderMode', 'Render Mode', 'select', [['stacked','Stacked Planes'], ['extruded','Voxel Extrusion']]],
  ['depth', 'Thickness', 'range', null],
  ['dirX', 'Extrusion X', 'number', null], ['dirY', 'Extrusion Y', 'number', null], ['dirZ', 'Extrusion Z', 'number', null],
  ['sideColor', 'Side Color', 'color', null],
  ['materialType', 'Material', 'select', [['matte','Matte'], ['metallic','Metallic Look'], ['emissive','Emissive'], ['glow','Glow']]],
  ['metalness', 'Metalness', 'range', null], ['roughness', 'Roughness', 'range', null],
  ['glowStrength', 'Glow Strength', 'range', null], ['lightIntensity', 'Light Intensity', 'range', null]
] as const;

function ensureInspector3D() {
  const scale = $('scale');
  let after: Element = scale;
  for (const [id, title, type, options] of inspector3D) {
    if (document.getElementById(id)) continue;
    const label = document.createElement('label'); label.htmlFor = id; label.textContent = title;
    const input = type === 'select' ? document.createElement('select') : document.createElement('input');
    input.id = id;
    if (input instanceof HTMLInputElement) {
      input.type = type;
      if (type === 'range') {
        input.min = '0'; input.max = id === 'lightIntensity' ? '8' : id === 'glowStrength' ? '2' : '1';
        input.step = id === 'depth' ? '0.01' : '0.05';
      }
      if (type === 'number') input.step = '0.05';
    } else if (options) {
      for (const [value, text] of options) {
        const opt = document.createElement('option'); opt.value = value; opt.textContent = text;
        input.append(opt);
      }
    }
    after.after(label, input);
    after = input;
  }
  const old = document.getElementById('family');
  const label = old?.previousElementSibling;
  if (label?.tagName.toLowerCase() === 'label' && label.textContent?.trim() === 'Font Family') label.remove();
  old?.remove();
  const wire = (id: string) => {
    $(id).addEventListener('input', () => {
      const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
      const layer = current() as unknown as Record<string, unknown>;
      layer[id] = ['renderMode', 'sideColor', 'materialType'].includes(id) ? element.value : Number(element.value);
      void renderAll();
    });
  };
  for (const [id] of inspector3D) wire(id);
}
ensureInspector3D();

function syncInspector() {
  const layer = current();
  if (!layer) return;

  const set = (id: string, value: string | number) => {
    ($<HTMLInputElement>(id)).value = String(value);
  };

  set('text', layer.text);
  set('size', layer.size);
  set('pixel', layer.pixel);
  set('color', layer.color);
  set('outline', layer.outline);
  set('x', layer.x);
  set('y', layer.y);
  set('z', layer.z);
  set('scale', layer.scale);
  for (const [id] of inspector3D) {
    const value = (layer as unknown as Record<string, unknown>)[id];
    const fallback = (default3D as unknown as Record<string, unknown>)[id];
    set(id, String(value ?? fallback));
  }

  $('sizeValue').textContent = `${layer.size}px`;
  $('pixelValue').textContent = `${layer.pixel}px`;

  const info = fonts.find(f => f.id === layer.fontId)
    || fallbackFonts.find(f => f.id === layer.fontId);

  const weights = info?.weights || [400, 700];
  const select = $<HTMLSelectElement>('weight');
  select.replaceChildren();

  for (const weight of weights) {
    const opt = document.createElement('option');
    opt.value = String(weight);
    opt.textContent = String(weight);
    select.appendChild(opt);
  }

  if (!weights.includes(layer.weight)) {
    const opt = document.createElement('option');
    opt.value = String(layer.weight);
    opt.textContent = String(layer.weight);
    select.appendChild(opt);
  }

  select.value = String(layer.weight);
}

const stringFields = ['text', 'color', 'outline'];
const numberFields = ['size', 'pixel', 'x', 'y', 'z', 'scale'];

for (const field of stringFields) {
  $(field).addEventListener('input', () => {
    (current() as any)[field] = ($<HTMLInputElement>(field)).value;
    renderLayers();
    void renderAll();
  });
}

for (const field of numberFields) {
  $(field).addEventListener('input', () => {
    const value = Number(($<HTMLInputElement>(field)).value);
    if (!Number.isFinite(value)) return;

    (current() as any)[field] = value;
    syncLabels();
    void renderAll();
  });
}

function syncLabels() {
  $('sizeValue').textContent = `${current().size}px`;
  $('pixelValue').textContent = `${current().pixel}px`;
}

$('weight').addEventListener('change', () => {
  current().weight = Number(($<HTMLSelectElement>('weight')).value);
  void renderAll();
});

$('search').addEventListener('input', renderFontList);

$('add').onclick = () => {
  const id = Math.max(0, ...layers.map(l => l.id)) + 1;
  layers.push({
    ...current(), id, text: 'NEW TEXT',
    x: 0, y: 2.1, z: -0.5
  });
  selectedId = id;
  renderLayers();
  syncInspector();
  void renderAll();
};

$('remove').onclick = () => {
  if (layers.length <= 1) {
    alert('Keep at least one layer');
    return;
  }
  layers = layers.filter(l => l.id !== selectedId);
  selectedId = layers[0].id;
  renderLayers();
  syncInspector();
  void renderAll();
};

$('save').onclick = () => {
  localStorage.setItem('folio-title-studio', JSON.stringify(layers));
  $('status').textContent = 'Design saved to browser';
};

$('reset').onclick = () => {
  if (!confirm('Reset all layers?')) return;
  layers = initialLayers.map(normalizeLayer);
  selectedId = 2;
  renderLayers();
  syncInspector();
  void renderAll();
};

// ------------------------------
// EXPORT TITLE3D.TS
// ------------------------------

function exportTitle() {
  const exported = layers.map(layer => {
    const canvas = createPixelCanvas(layer);
    return { ...normalizeLayer(layer), png: canvas.toDataURL('image/png'), cells: voxelCells(canvas) };
  });
  const source = `import * as THREE from 'three';
import { scene } from './core';
// Generated by Folio Type Studio. Backup the original file before replacing.
const data = ${JSON.stringify(exported)};
export const title3d = new THREE.Group();
scene.add(title3d);
const ambient = new THREE.AmbientLight('#fff3de', 0.8);
const lamp = new THREE.DirectionalLight('#ffe3ad', 3);
lamp.position.set(-3, 5, 6);
title3d.add(ambient, lamp);
const fades: Array<{mat: THREE.Material; base: number}> = [];
function track(mat: THREE.Material) { fades.push({mat, base: mat.opacity}); return mat; }
for (const l of data) {
  const holder = new THREE.Group();
  holder.position.set(l.x, l.y, l.z); holder.scale.setScalar(l.scale);
  title3d.add(holder);
  const dir = new THREE.Vector3(l.dirX, l.dirY, l.dirZ);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
  dir.normalize();
  const tex = new THREE.TextureLoader().load(l.png);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  const width = 4.05, height = width * 160 / 512;
  const depth = Math.max(0, l.depth);
  const sideMat = () => track(l.materialType === 'metallic' || l.materialType === 'matte'
    ? new THREE.MeshStandardMaterial({color:l.sideColor,metalness:l.materialType==='metallic'?l.metalness:0,roughness:l.materialType==='metallic'?l.roughness:1,side:THREE.DoubleSide,transparent:true})
    : new THREE.MeshBasicMaterial({color:l.sideColor,side:THREE.DoubleSide,transparent:true}));
  if (l.renderMode === 'extruded' && depth > 0 && l.cells.length) {
    const cw = width / 96, ch = height / 30;
    const voxels = new THREE.InstancedMesh(
      new THREE.BoxGeometry(cw*1.01,ch*1.01,depth), sideMat(), l.cells.length
    );
    const dummy = new THREE.Object3D();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),dir.clone().negate());
    l.cells.forEach((idx:number, i:number) => {
      const x = idx % 96, y = Math.floor(idx / 96);
      dummy.position.set(-width/2+(x+.5)*cw,height/2-(y+.5)*ch,0);
      dummy.position.addScaledVector(dir,depth/2);
      dummy.quaternion.copy(q);dummy.updateMatrix();voxels.setMatrixAt(i,dummy.matrix);
    });
    voxels.instanceMatrix.needsUpdate=true; voxels.frustumCulled=false;
    holder.add(voxels);
  } else if (depth > 0) {
    const steps = Math.min(36, Math.max(2, Math.ceil(depth * 100)));
    for (let i = steps; i >= 1; i--) {
      const material = track(new THREE.MeshBasicMaterial({map:tex,color:l.sideColor,transparent:true,alphaTest:.1,side:THREE.DoubleSide}));
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
      plane.position.copy(dir.clone().multiplyScalar(depth*i/steps));holder.add(plane);
    }
  }
  const frontMaterial = track(l.materialType === 'matte' || l.materialType === 'metallic'
    ? new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.1,metalness:l.materialType==='metallic'?l.metalness:0,roughness:l.materialType==='metallic'?l.roughness:1,side:THREE.DoubleSide})
    : new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.1,side:THREE.DoubleSide,toneMapped:false}));
  const front = new THREE.Mesh(new THREE.PlaneGeometry(width,height),frontMaterial);
  front.position.z=.008;holder.add(front);
  if(l.materialType==='glow'&&l.glowStrength>0){
    const haloMat=track(new THREE.MeshBasicMaterial({map:tex,opacity:Math.min(.35,l.glowStrength*.14),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false}));
    const halo=new THREE.Mesh(new THREE.PlaneGeometry(width,height),haloMat);
    halo.position.z=.025;halo.scale.setScalar(1+l.glowStrength*.04);holder.add(halo);
  }
}
let visibility=0;
export function updateTitle(t:number,show:boolean,dt:number) {
  visibility+=((show?.97:0)-visibility)*(1-Math.exp(-dt*3.2));
  for(const item of fades)item.mat.opacity=item.base*visibility;
  title3d.visible=visibility>.01;
  title3d.position.y=Math.sin(t*.9)*.035;
  title3d.rotation.y=Math.sin(t*.35)*.045;
}
`;
  const blob = new Blob([source], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'title3d.ts'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('export').onclick = async () => {
  if (busy) return;
  busy = true;
  $('status').textContent = 'Preparing export...';

  try {
    for (const layer of layers) await ensureFont(layer);
    exportTitle();
    $('status').textContent = 'Export complete';
  } catch (error) {
    console.error(error);
    $('status').textContent = 'Export failed: font unavailable';
    alert('A font failed to load. Check your network connection.');
  } finally {
    busy = false;
  }
};

// ------------------------------
// STARTUP
// ------------------------------

try {
  const saved = localStorage.getItem('folio-title-studio');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length) {
      layers = parsed.map(normalizeLayer);
      selectedId = layers[0].id;
    }
  }
} catch {
  console.warn('Could not restore saved design');
}

renderLayers();
syncInspector();
void loadFontCatalog().then(() => {
  syncInspector();
  return renderAll();
});
