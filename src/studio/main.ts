import * as THREE from 'three';

type RenderMode = 'stacked' | 'extruded';
type MaterialMode = 'matte' | 'metallic' | 'emissive' | 'glow';

type FontInfo = {
  id: string;
  family: string;
  category: string;
  weights: number[];
};

type Layer = {
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
  renderMode: RenderMode;
  depth: number;
  dirX: number;
  dirY: number;
  dirZ: number;
  sideColor: string;
  materialType: MaterialMode;
  metalness: number;
  roughness: number;
  glowStrength: number;
  lightIntensity: number;
};

type ExportLayer = Layer & {
  png: string;
  cells: number[];
};

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
};

const STORAGE = 'folio-title-studio';
const HEART_STORAGE = 'folio-font-hearts';
const LAYOUT_STORAGE = 'folio-studio-layout';

const defaults = {
  renderMode: 'stacked' as RenderMode,
  depth: 0.18,
  dirX: 0.15,
  dirY: -0.1,
  dirZ: -1,
  sideColor: '#78572f',
  materialType: 'matte' as MaterialMode,
  metalness: 0.7,
  roughness: 0.32,
  glowStrength: 0.35,
  lightIntensity: 3
};

const initial: Layer[] = [
  {
    ...defaults,
    id: 1,
    text: 'Mon',
    fontId: 'pixelify-sans',
    family: 'Pixelify Sans',
    weight: 700,
    size: 36,
    pixel: 2,
    color: '#fff0cf',
    outline: '#22140a',
    x: -0.75,
    y: 2.78,
    z: -0.6,
    scale: 0.55
  },
  {
    ...defaults,
    id: 2,
    text: 'Folio',
    fontId: 'great-vibes',
    family: 'Great Vibes',
    weight: 400,
    size: 105,
    pixel: 3,
    color: '#ffeab0',
    outline: '#22140a',
    x: 0,
    y: 2.18,
    z: -0.6,
    scale: 1
  },
  {
    ...defaults,
    id: 3,
    text: 'Dossier Personnel',
    fontId: 'pixelify-sans',
    family: 'Pixelify Sans',
    weight: 700,
    size: 24,
    pixel: 2,
    color: '#f6c866',
    outline: '#22140a',
    x: 0.3,
    y: 1.65,
    z: -0.6,
    scale: 0.75
  }
];

function normalize(layer: Partial<Layer>): Layer {
  return { ...defaults, ...layer } as Layer;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

const savedLayers = readJSON<Layer[]>(STORAGE, initial);

let layers = Array.isArray(savedLayers) && savedLayers.length
  ? savedLayers.map(normalize)
  : initial.map(normalize);

let selectedId = layers.some(l => l.id === 2)
  ? 2
  : layers[0].id;

let fonts: FontInfo[] = [];
let previewText = 'Folio de Dossier';
let exporting = false;
let renderVersion = 0;

const hearts = readJSON<Record<string, number>>(
  HEART_STORAGE,
  {}
);

const loadedFonts = new Set<string>();
const fontRequests = new Map<string, Promise<void>>();
const fontDetails = new Map<string, any>();

const objects = new Map<number, THREE.Group>();
const hitCanvases = new Map<number, HTMLCanvasElement>();

const fallbackFonts: FontInfo[] = [
  {
    id: 'great-vibes',
    family: 'Great Vibes',
    category: 'handwriting',
    weights: [400]
  },
  {
    id: 'pixelify-sans',
    family: 'Pixelify Sans',
    category: 'display',
    weights: [400, 700]
  },
  {
    id: 'playfair-display',
    family: 'Playfair Display',
    category: 'serif',
    weights: [400, 700]
  },
  {
    id: 'silkscreen',
    family: 'Silkscreen',
    category: 'display',
    weights: [400, 700]
  },
  {
    id: 'special-elite',
    family: 'Special Elite',
    category: 'display',
    weights: [400]
  }
];

function current(): Layer {
  return layers.find(layer => layer.id === selectedId)
    ?? layers[0];
}

function setStatus(message: string) {
  $('status').textContent = message;
}

// ==================================================
// THREE.JS SCENE
// ==================================================

const viewport = $('viewport');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#151c1a');

const camera = new THREE.PerspectiveCamera(
  40,
  1,
  0.1,
  100
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const titleGroup = new THREE.Group();
scene.add(titleGroup);

const grid = new THREE.GridHelper(
  12,
  24,
  '#536156',
  '#303b34'
);

grid.position.y = -0.2;
scene.add(grid);

const ambientLight = new THREE.AmbientLight(
  '#fff3de',
  0.85
);

scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(
  '#ffe3ad',
  3
);

keyLight.position.set(-3, 5, 6);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(
  '#9dbbc5',
  1.3
);

rimLight.position.set(4, 2, -5);
scene.add(rimLight);

let yaw = 0;
let pitch = 0;
let distance = 9;

function updateCamera() {
  const target = new THREE.Vector3(0, 2.1, -0.6);

  camera.position.set(
    target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
    target.y + Math.sin(pitch) * distance,
    target.z + Math.cos(yaw) * Math.cos(pitch) * distance
  );

  camera.lookAt(target);
}

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;

  if (!width || !height) return;

  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

updateCamera();

new ResizeObserver(resize).observe(viewport);
resize();

const frameHooks: Array<() => void> = [];

function animate() {
  requestAnimationFrame(animate);
  frameHooks.forEach(fn => fn());
  renderer.render(scene, camera);
}
animate();

// ==================================================
// FONTSOURCE
// ==================================================

async function loadCatalog() {
  try {
    const response = await fetch(
      'https://api.fontsource.org/v1/fonts'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    fonts = (data as any[]).map(font => ({
      id: String(font.id),
      family: String(font.family),
      category: String(font.category || 'display'),
      weights: (font.weights || [400]).map(Number)
    }));

    setStatus(`${fonts.length} fonts loaded`);
  } catch (error) {
    console.warn('Font catalog:', error);

    fonts = fallbackFonts;

    setStatus('Using fallback font catalog');
  }

  renderFontList();
}

async function ensureFont(
  fontId: string,
  family: string,
  weight: number
): Promise<void> {
  const key = `${fontId}:${weight}`;

  if (loadedFonts.has(key)) return;

  if (!fontRequests.has(key)) {
    const request = (async () => {
      let detail = fontDetails.get(fontId);

      if (!detail) {
        const response = await fetch(
          `https://api.fontsource.org/v1/fonts/${encodeURIComponent(fontId)}`
        );

        if (!response.ok) {
          throw new Error(`Cannot fetch ${fontId}`);
        }

        detail = await response.json();
        fontDetails.set(fontId, detail);
      }

      const variants = detail.variants?.[
        String(weight)
      ]?.normal;

      if (!variants) {
        throw new Error(`Weight unavailable: ${family}`);
      }

      const subset =
        variants[detail.defSubset || 'latin'] ??
        variants.latin ??
        Object.values(variants)[0];

      const url = (subset as any)?.url?.woff2;

      if (!url) {
        throw new Error(`WOFF2 unavailable: ${family}`);
      }

      const face = new FontFace(
        family,
        `url("${url}")`,
        { weight: String(weight) }
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

function ensureLayerFont(layer: Layer) {
  return ensureFont(
    layer.fontId,
    layer.family,
    layer.weight
  );
}

// ==================================================
// FONT FAVORITES
// ==================================================

function heartCount(id: string): number {
  return Math.max(
    0,
    Math.min(3, hearts[id] ?? 0)
  );
}

function cycleHeart(id: string) {
  hearts[id] = (heartCount(id) + 1) % 4;

  localStorage.setItem(
    HEART_STORAGE,
    JSON.stringify(hearts)
  );

  renderFontList();
}

// ==================================================
// FONT LIBRARY UI
// ==================================================

const fontObserver = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const row = entry.target as HTMLElement;
      const sample = row.querySelector<HTMLElement>(
        '.font-preview'
      );

      const id = row.dataset.fontId;
      if (!id || !sample) continue;

      const font = fonts.find(f => f.id === id);
      if (!font) continue;

      fontObserver.unobserve(row);

      const weight = font.weights.includes(400)
        ? 400
        : font.weights[0] ?? 400;

      void ensureFont(
        font.id,
        font.family,
        weight
      ).then(() => {
        if (!row.isConnected) return;

        sample.style.fontFamily =
          `"${font.family}", serif`;

        sample.style.fontWeight = String(weight);
      }).catch(error => {
        console.warn('Preview font:', error);
      });
    }
  },
  {
    root: $('fontList'),
    rootMargin: '100px'
  }
);

function renderFontList() {
  const search = $<HTMLInputElement>(
    'search'
  ).value.toLowerCase().trim();

  const category = $<HTMLSelectElement>(
    'fontCategory'
  ).value;

  const sort = $<HTMLSelectElement>(
    'fontSort'
  ).value;

  const minimum = Number(
    $<HTMLSelectElement>('fontFavorite').value
  );

  const matches = fonts.filter(font =>
    font.family.toLowerCase().includes(search) &&
    (category === 'all' || font.category === category) &&
    heartCount(font.id) >= minimum
  );

  matches.sort((a, b) => {
    if (sort === 'favorites') {
      const diff = heartCount(b.id) - heartCount(a.id);
      if (diff !== 0) return diff;
    }

    return a.family.localeCompare(b.family);
  });

  const root = $('fontList');
  root.replaceChildren();

  const results = matches.slice(0, 60);

  $('fontStatus').textContent =
    `${results.length} shown / ${matches.length} matching`;

  for (const font of results) {
    const row = document.createElement('div');

    row.className = 'font-row';
    row.dataset.fontId = font.id;

    if (font.id === current().fontId) {
      row.classList.add('selected');
    }

    const sample = document.createElement('div');

    sample.className = 'font-preview';
    sample.textContent = previewText;

    const footer = document.createElement('div');
    footer.className = 'font-row-footer';

    const choose = document.createElement('button');

    choose.className = 'font-title';
    choose.textContent = font.family;

    const categoryLabel = document.createElement('small');
    categoryLabel.textContent = font.category;

    choose.appendChild(categoryLabel);

    choose.onclick = async () => {
      const layer = current();

      layer.fontId = font.id;
      layer.family = font.family;

      layer.weight = font.weights.includes(400)
        ? 400
        : font.weights[0] ?? 400;

      syncInspector();
      renderFontList();

      await renderAll();
    };

    const favorite = document.createElement('button');
    favorite.className = 'heart-button';

    favorite.title = 'Rate 0–3 hearts';
    favorite.setAttribute(
      'aria-label',
      `Rate ${font.family}`
    );

    for (let i = 1; i <= 3; i++) {
      const heart = document.createElement('span');

      heart.textContent = '♥';

      heart.className = i <= heartCount(font.id)
        ? 'filled'
        : 'empty';

      favorite.appendChild(heart);
    }

    favorite.onclick = () => cycleHeart(font.id);

    footer.append(choose, favorite);
    row.append(sample, footer);
    root.append(row);

    fontObserver.observe(row);
  }
}

$('search').addEventListener(
  'input',
  renderFontList
);

for (const id of [
  'fontCategory',
  'fontSort',
  'fontFavorite'
]) {
  $(id).addEventListener(
    'change',
    renderFontList
  );
}

$('fontPreviewText').addEventListener('input', () => {
  previewText = $<HTMLInputElement>(
    'fontPreviewText'
  ).value;

  document.querySelectorAll<HTMLElement>(
    '.font-preview'
  ).forEach(element => {
    element.textContent = previewText;
  });
});

// ==================================================
// PIXEL TEXTURE
// ==================================================

function createCanvas(layer: Layer): HTMLCanvasElement {
  const width = 512;
  const height = 160;

  const pixel = Math.max(
    1,
    Math.round(layer.pixel)
  );

  const low = document.createElement('canvas');

  low.width = Math.ceil(width / pixel);
  low.height = Math.ceil(height / pixel);

  const context = low.getContext('2d')!;

  context.clearRect(
    0,
    0,
    low.width,
    low.height
  );

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';

  context.font =
    `${layer.weight} ${layer.size / pixel}px "${layer.family}", serif`;

  context.strokeStyle = layer.outline;
  context.fillStyle = layer.color;

  context.lineWidth = Math.max(
    0.5,
    2 / pixel
  );

  const x = low.width / 2;
  const y = low.height / 2;

  context.strokeText(
    layer.text,
    x,
    y,
    low.width - 8
  );

  context.fillText(
    layer.text,
    x,
    y,
    low.width - 8
  );

  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const output = canvas.getContext('2d')!;
  output.imageSmoothingEnabled = false;

  output.drawImage(
    low,
    0,
    0,
    width,
    height
  );

  return canvas;
}

function createTexture(
  canvas: HTMLCanvasElement
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  return texture;
}

function createMaterial(
  layer: Layer,
  color: string,
  texture?: THREE.Texture
): THREE.Material {
  if (
    layer.materialType === 'matte' ||
    layer.materialType === 'metallic'
  ) {
    return new THREE.MeshStandardMaterial({
      color: texture ? '#ffffff' : color,
      map: texture ?? null,
      transparent: Boolean(texture),
      alphaTest: texture ? 0.1 : 0,
      metalness: layer.materialType === 'metallic'
        ? layer.metalness
        : 0,
      roughness: layer.materialType === 'metallic'
        ? layer.roughness
        : 1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }

  return new THREE.MeshBasicMaterial({
    color: texture ? '#ffffff' : color,
    map: texture ?? null,
    transparent: Boolean(texture),
    alphaTest: texture ? 0.1 : 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  });
}

function directionFor(layer: Layer): THREE.Vector3 {
  const direction = new THREE.Vector3(
    layer.dirX,
    layer.dirY,
    layer.dirZ
  );

  if (direction.lengthSq() < 0.00001) {
    direction.set(0, 0, -1);
  }

  return direction.normalize();
}

function getVoxelCells(
  canvas: HTMLCanvasElement
): number[] {
  const sample = document.createElement('canvas');

  sample.width = 96;
  sample.height = 30;

  const context = sample.getContext('2d', {
    willReadFrequently: true
  })!;

  context.imageSmoothingEnabled = false;

  context.drawImage(
    canvas,
    0,
    0,
    96,
    30
  );

  const data = context.getImageData(
    0,
    0,
    96,
    30
  ).data;

  const cells: number[] = [];

  for (let i = 0; i < 96 * 30; i++) {
    if (data[i * 4 + 3] >= 128) {
      cells.push(i);
    }
  }

  return cells;
}

// ==================================================
// 3D GEOMETRY
// ==================================================

function createGeometry(
  layer: Layer,
  canvas: HTMLCanvasElement
): THREE.Group {
  const group = new THREE.Group();

  const width = 4.05;
  const height = width * 160 / 512;

  const depth = Math.max(0, layer.depth);
  const direction = directionFor(layer);

  if (layer.renderMode === 'stacked' && depth > 0) {
    const steps = Math.min(
      40,
      Math.max(2, Math.ceil(depth * 100))
    );

    const texture = createTexture(canvas);

    for (let i = steps; i >= 1; i--) {
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        color: layer.sideColor,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        material
      );

      mesh.position.copy(
        direction.clone().multiplyScalar(
          depth * i / steps
        )
      );

      group.add(mesh);
    }
  }

  if (layer.renderMode === 'extruded' && depth > 0) {
    const cells = getVoxelCells(canvas);

    if (cells.length) {
      const geometry = new THREE.BoxGeometry(
        width / 96 * 1.015,
        height / 30 * 1.015,
        depth
      );

      const material = createMaterial(
        layer,
        layer.sideColor
      );

      const mesh = new THREE.InstancedMesh(
        geometry,
        material,
        cells.length
      );

      const dummy = new THREE.Object3D();

      const rotation = new THREE.Quaternion()
        .setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          direction.clone().negate()
        );

      cells.forEach((index, i) => {
        const x = index % 96;
        const y = Math.floor(index / 96);

        dummy.position.set(
          -width / 2 + (x + 0.5) * width / 96,
          height / 2 - (y + 0.5) * height / 30,
          0
        );

        dummy.position.addScaledVector(
          direction,
          depth / 2
        );

        dummy.quaternion.copy(rotation);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;

      group.add(mesh);
    }
  }

  // Front face
  const frontTexture = createTexture(canvas);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    createMaterial(
      layer,
      layer.color,
      frontTexture
    )
  );

  front.position.z = 0.008;
  front.userData.layerId = layer.id;
  front.userData.hitSurface = true;

  group.add(front);

  // Lightweight glow approximation
  if (
    layer.materialType === 'glow' &&
    layer.glowStrength > 0
  ) {
    const material = new THREE.MeshBasicMaterial({
      map: createTexture(canvas),
      color: layer.color,
      transparent: true,
      opacity: Math.min(
        0.4,
        layer.glowStrength * 0.18
      ),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      material
    );

    glow.scale.setScalar(
      1 + layer.glowStrength * 0.05
    );

    glow.position.z = 0.019;
    group.add(glow);
  }

  group.position.set(
    layer.x,
    layer.y,
    layer.z
  );

  group.scale.setScalar(layer.scale);
  group.userData.layerId = layer.id;

  return group;
}

function disposeGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  group.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;

    geometries.add(child.geometry);

    const list = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const material of list) {
      materials.add(material);

      const texture = (
        material as THREE.MeshStandardMaterial
      ).map;

      if (texture) textures.add(texture);
    }
  });

  geometries.forEach(item => item.dispose());
  materials.forEach(item => item.dispose());
  textures.forEach(item => item.dispose());
}

async function renderAll() {
  const version = ++renderVersion;

  await Promise.all(
    layers.map(async layer => {
      try {
        await ensureLayerFont(layer);
      } catch (error) {
        console.warn(
          'Using fallback font:',
          layer.family,
          error
        );
      }
    })
  );

  if (version !== renderVersion) return;

  for (const group of objects.values()) {
    titleGroup.remove(group);
    disposeGroup(group);
  }

  objects.clear();
  hitCanvases.clear();

  keyLight.intensity = current().lightIntensity;

  layers.forEach((layer, index) => {
    const canvas = createCanvas(layer);
    const group = createGeometry(layer, canvas);

    group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.renderOrder = index * 100 + 10;
      }
    });

    titleGroup.add(group);

    objects.set(layer.id, group);
    hitCanvases.set(layer.id, canvas);
  });

  setStatus('3D Preview updated');
}

// ==================================================
// RAYCASTING / SELECT TEXT
// ==================================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function aimRay(
  event: PointerEvent | MouseEvent
) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  raycaster.setFromCamera(mouse, camera);
}

function pickLayer(
  event: PointerEvent | MouseEvent
): number | null {
  aimRay(event);

  const hits = raycaster.intersectObjects(
    Array.from(objects.values()),
    true
  );

  const candidates: {
    id: number;
    distance: number;
    order: number;
  }[] = [];

  for (const hit of hits) {
    if (
      !hit.uv ||
      !hit.object.userData.hitSurface
    ) continue;

    const id = hit.object.userData.layerId as number;
    const canvas = hitCanvases.get(id);

    if (!canvas) continue;

    const x = THREE.MathUtils.clamp(
      Math.floor(hit.uv.x * canvas.width),
      0,
      canvas.width - 1
    );

    const y = THREE.MathUtils.clamp(
      Math.floor((1 - hit.uv.y) * canvas.height),
      0,
      canvas.height - 1
    );

    const alpha = canvas
      .getContext('2d')!
      .getImageData(x, y, 1, 1)
      .data[3];

    if (alpha <= 20) continue;

    candidates.push({
      id,
      distance: hit.distance,
      order: layers.findIndex(l => l.id === id)
    });
  }

  if (!candidates.length) return null;

  // Visually frontmost layer takes priority.
  candidates.sort((a, b) =>
    b.order - a.order ||
    a.distance - b.distance
  );

  return candidates[0].id;
}

function selectLayer(id: number) {
  if (!layers.some(layer => layer.id === id)) return;

  selectedId = id;

  syncInspector();
  renderLayers();
  renderFontList();

  keyLight.intensity = current().lightIntensity;
}

// ==================================================
// SELECTION FRAME · MOVE · CORNER SCALE · RIGHT-CLICK MENU
// ==================================================

const PLANE_W = 4.05;
const PLANE_H = 4.05 * 160 / 512;

const boundsCache = new WeakMap<
  HTMLCanvasElement,
  { x0: number; x1: number; y0: number; y1: number }
>();

// Tight box around the visible pixels of a text canvas.
function textBounds(canvas: HTMLCanvasElement) {
  const cached = boundsCache.get(canvas);
  if (cached) return cached;

  const w = canvas.width, h = canvas.height;
  const data = canvas.getContext('2d')!.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }

  const bounds = { x0, x1: x1 + 1, y0, y1: y1 + 1 };
  boundsCache.set(canvas, bounds);
  return bounds;
}

// ---- selection frame + 4 corner handles ----

const selectionLine = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.5, -0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(0.5, 0.5, 0),
    new THREE.Vector3(-0.5, 0.5, 0)
  ]),
  new THREE.LineBasicMaterial({
    color: '#ffd36b', depthTest: false, transparent: true
  })
);
selectionLine.renderOrder = 100000;
selectionLine.frustumCulled = false;
scene.add(selectionLine);

const handleMeshes: THREE.Mesh[] = [];
for (let i = 0; i < 4; i++) {
  const outer = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: '#ffd36b', depthTest: false, transparent: true
    })
  );
  const inner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({
      color: '#ffffff', depthTest: false, transparent: true
    })
  );
  inner.position.z = 0.001;
  inner.renderOrder = 100002;
  outer.add(inner);
  outer.renderOrder = 100001;
  outer.frustumCulled = false;
  outer.userData.corner = i; // 0 TL, 1 TR, 2 BR, 3 BL
  scene.add(outer);
  handleMeshes.push(outer);
}

const corners = [
  new THREE.Vector3(), new THREE.Vector3(),
  new THREE.Vector3(), new THREE.Vector3()
];
let frameVisible = false;

function updateSelectionFrame() {
  const layer = layers.find(l => l.id === selectedId);
  const group = layer ? objects.get(layer.id) : undefined;
  const canvas = layer ? hitCanvases.get(layer.id) : undefined;

  frameVisible = !!(layer && group && canvas);
  selectionLine.visible = frameVisible;
  handleMeshes.forEach(h => { h.visible = frameVisible; });
  if (!layer || !group || !canvas) return;

  const b = textBounds(canvas);
  const pad = 0.05;
  const s = group.scale.x;
  const p = group.position;

  const left = p.x + (b.x0 / canvas.width - 0.5) * PLANE_W * s - pad;
  const right = p.x + (b.x1 / canvas.width - 0.5) * PLANE_W * s + pad;
  const top = p.y + (0.5 - b.y0 / canvas.height) * PLANE_H * s + pad;
  const bottom = p.y + (0.5 - b.y1 / canvas.height) * PLANE_H * s - pad;
  const z = p.z + 0.03;

  corners[0].set(left, top, z);
  corners[1].set(right, top, z);
  corners[2].set(right, bottom, z);
  corners[3].set(left, bottom, z);

  selectionLine.position.set((left + right) / 2, (top + bottom) / 2, z);
  selectionLine.scale.set(right - left, top - bottom, 1);

  const size = distance * 0.016;
  handleMeshes.forEach((h, i) => {
    h.position.copy(corners[i]);
    h.quaternion.copy(camera.quaternion);
    h.scale.setScalar(size);
  });
}
frameHooks.push(updateSelectionFrame);

// ---- pointer gestures ----

type Gesture =
  | { kind: 'orbit'; x: number; y: number; moved: boolean }
  | {
      kind: 'move'; id: number; moved: boolean;
      plane: THREE.Plane; offset: THREE.Vector3;
    }
  | {
      kind: 'scale'; id: number; moved: boolean;
      plane: THREE.Plane; anchor: THREE.Vector3; dir: THREE.Vector3;
      startPointer: THREE.Vector3; startScale: number; startPos: THREE.Vector3;
    }
  | null;

let gesture: Gesture = null;
const round2 = (n: number) => Math.round(n * 100) / 100;

function pickHandle(e: PointerEvent | MouseEvent): number | null {
  if (!frameVisible) return null;
  aimRay(e);
  const hit = raycaster.intersectObjects(handleMeshes, false)[0];
  return hit ? (hit.object.userData.corner as number) : null;
}

function facingPlane(point: THREE.Vector3) {
  const normal = camera.getWorldDirection(new THREE.Vector3());
  return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
}

renderer.domElement.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  hideContextMenu();

  // 1) corner handle -> scale
  const corner = pickHandle(e);
  if (corner !== null) {
    const layer = current();
    const group = objects.get(layer.id);
    if (group) {
      const plane = facingPlane(corners[corner]);
      const p0 = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, p0)) {
        const anchor = corners[(corner + 2) % 4].clone();
        const dir = corners[corner].clone().sub(anchor).normalize();
        gesture = {
          kind: 'scale', id: layer.id, moved: false,
          plane, anchor, dir,
          startPointer: p0,
          startScale: layer.scale,
          startPos: group.position.clone()
        };
        renderer.domElement.setPointerCapture(e.pointerId);
        return;
      }
    }
  }

  // 2) text -> select + move
  const hitId = pickLayer(e);
  if (hitId !== null) {
    selectLayer(hitId);
    const layer = layers.find(l => l.id === hitId)!;
    const plane = facingPlane(new THREE.Vector3(layer.x, layer.y, layer.z));
    const p0 = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, p0)) {
      gesture = {
        kind: 'move', id: hitId, moved: false, plane,
        offset: new THREE.Vector3(layer.x, layer.y, layer.z).sub(p0)
      };
      renderer.domElement.setPointerCapture(e.pointerId);
      return;
    }
  }

  // 3) empty space -> rotate camera
  gesture = { kind: 'orbit', x: e.clientX, y: e.clientY, moved: false };
  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener('pointermove', e => {
  const g = gesture;

  if (!g) {
    const c = pickHandle(e);
    renderer.domElement.style.cursor =
      c !== null ? (c % 2 === 0 ? 'nwse-resize' : 'nesw-resize')
        : pickLayer(e) !== null ? 'move' : 'grab';
    return;
  }

  if (g.kind === 'orbit') {
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) g.moved = true;
    if (g.moved) {
      yaw -= dx * 0.005;
      pitch = THREE.MathUtils.clamp(pitch + dy * 0.005, -0.7, 0.7);
      updateCamera();
    }
    g.x = e.clientX;
    g.y = e.clientY;
    return;
  }

  const layer = layers.find(l => l.id === g.id);
  const group = objects.get(g.id);
  if (!layer || !group) return;

  aimRay(e);
  const p = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(g.plane, p)) return;

  if (g.kind === 'move') {
    p.add(g.offset);
    layer.x = round2(p.x);
    layer.y = round2(p.y);
    layer.z = round2(p.z);
    group.position.set(layer.x, layer.y, layer.z);
    setValue('x', layer.x); setValue('y', layer.y); setValue('z', layer.z);
    g.moved = true;
    return;
  }

  // corner scale: opposite corner stays fixed
  const base = g.startPointer.clone().sub(g.anchor).dot(g.dir);
  if (Math.abs(base) < 1e-4) return;

  const raw = g.startScale * (p.sub(g.anchor).dot(g.dir) / base);
  const next = Math.round(THREE.MathUtils.clamp(raw, 0.1, 6) * 1000) / 1000;
  const factor = next / g.startScale;

  layer.scale = next;
  layer.x = round2(g.anchor.x + (g.startPos.x - g.anchor.x) * factor);
  layer.y = round2(g.anchor.y + (g.startPos.y - g.anchor.y) * factor);
  group.scale.setScalar(layer.scale);
  group.position.set(layer.x, layer.y, layer.z);
  setValue('x', layer.x); setValue('y', layer.y);
  g.moved = true;
});

renderer.domElement.addEventListener('pointerup', () => {
  const g = gesture;
  gesture = null;
  if (g && g.kind !== 'orbit' && g.moved) {
    setStatus('Layer updated — press Save to keep it');
  }
});
renderer.domElement.addEventListener('pointercancel', () => { gesture = null; });

// ---- arrow keys nudge X / Y ----

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideContextMenu();

  const target = e.target as HTMLElement;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) return;

  const step = e.shiftKey ? 0.25 : 0.05;
  let dx = 0, dy = 0;
  if (e.key === 'ArrowLeft') dx = -step;
  else if (e.key === 'ArrowRight') dx = step;
  else if (e.key === 'ArrowUp') dy = step;
  else if (e.key === 'ArrowDown') dy = -step;
  else return;

  e.preventDefault();
  const layer = current();
  layer.x = round2(layer.x + dx);
  layer.y = round2(layer.y + dy);
  objects.get(layer.id)?.position.set(layer.x, layer.y, layer.z);
  setValue('x', layer.x);
  setValue('y', layer.y);
});

// ---- right-click menu ----

const ctxMenu = $('ctxMenu');

function hideContextMenu() {
  ctxMenu.classList.add('hidden');
}

function reorder(id: number, how: 'front' | 'forward' | 'backward' | 'back') {
  const from = layers.findIndex(l => l.id === id);
  if (from < 0) return;

  const [item] = layers.splice(from, 1);
  const to =
    how === 'front' ? layers.length :
    how === 'back' ? 0 :
    how === 'forward' ? Math.min(layers.length, from + 1) :
    Math.max(0, from - 1);

  layers.splice(to, 0, item);
  setStatus('Layer order changed — press Save to keep it');
  void renderAll();
}

function showContextMenu(x: number, y: number, id: number) {
  const index = layers.findIndex(l => l.id === id);
  const last = layers.length - 1;

  const items: Array<readonly [string, boolean, () => void] | 'sep'> = [
    ['Bring to front', index < last, () => reorder(id, 'front')],
    ['Forward 1 step', index < last, () => reorder(id, 'forward')],
    ['Backward 1 step', index > 0, () => reorder(id, 'backward')],
    ['Send to back', index > 0, () => reorder(id, 'back')],
    'sep',
    ['Delete', true, () => deleteLayer()]
  ];

  ctxMenu.replaceChildren();
  for (const item of items) {
    if (item === 'sep') {
      ctxMenu.append(document.createElement('hr'));
      continue;
    }
    const [label, enabled, action] = item;
    const button = document.createElement('button');
    button.textContent = label;
    button.disabled = !enabled;
    if (label === 'Delete') button.className = 'danger-item';
    button.onclick = () => { hideContextMenu(); action(); };
    ctxMenu.append(button);
  }

  ctxMenu.classList.remove('hidden');
  const w = ctxMenu.offsetWidth, h = ctxMenu.offsetHeight;
  ctxMenu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - w - 8))}px`;
  ctxMenu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - h - 8))}px`;
}

renderer.domElement.addEventListener('contextmenu', e => {
  e.preventDefault();
  const id = pickLayer(e);
  if (id === null) { hideContextMenu(); return; }
  selectLayer(id);
  showContextMenu(e.clientX, e.clientY, id);
});

document.addEventListener('pointerdown', e => {
  if (!ctxMenu.contains(e.target as Node)) hideContextMenu();
});
window.addEventListener('blur', hideContextMenu);
window.addEventListener('resize', hideContextMenu);

// ---- zoom + double-click ----

renderer.domElement.addEventListener(
  'wheel',
  event => {
    event.preventDefault();

    distance = THREE.MathUtils.clamp(
      distance + event.deltaY * 0.01,
      4,
      18
    );

    updateCamera();
  },
  { passive: false }
);

renderer.domElement.addEventListener(
  'dblclick',
  event => {
    const id = pickLayer(event);

    if (id !== null) {
      selectLayer(id);

      openTextEditor(
        'edit',
        event.clientX,
        event.clientY
      );
    } else {
      openTextEditor(
        'add',
        event.clientX,
        event.clientY
      );
    }
  }
);

// ==================================================
// INLINE TEXT EDITOR
// ==================================================

let editorMode: 'add' | 'edit' = 'edit';

function openTextEditor(
  mode: 'add' | 'edit',
  clientX?: number,
  clientY?: number
) {
  editorMode = mode;

  const panel = $('textEditor');
  const input = $<HTMLInputElement>('editingText');

  panel.classList.remove('hidden');

  input.value = mode === 'edit'
    ? current().text
    : '';

  if (
    clientX !== undefined &&
    clientY !== undefined
  ) {
    panel.style.left = `${
      THREE.MathUtils.clamp(
        clientX,
        Math.min(220, window.innerWidth / 2),
        Math.max(
          window.innerWidth - 220,
          window.innerWidth / 2
        )
      )
    }px`;

    panel.style.top = `${
      THREE.MathUtils.clamp(
        clientY,
        Math.min(110, window.innerHeight / 2),
        Math.max(
          window.innerHeight - 110,
          window.innerHeight / 2
        )
      )
    }px`;
  } else {
    panel.style.left = '50%';
    panel.style.top = '50%';
  }

  input.focus();
  input.select();
}

function closeTextEditor() {
  $('textEditor').classList.add('hidden');
}

function applyTextEditor() {
  const text = $<HTMLInputElement>(
    'editingText'
  ).value.trim();

  if (!text) {
    setStatus('Text cannot be empty');
    return;
  }

  if (editorMode === 'edit') {
    current().text = text;
  } else {
    const id = Math.max(
      0,
      ...layers.map(layer => layer.id)
    ) + 1;

    const newLayer = normalize({
      ...current(),
      id,
      text,
      x: 0,
      y: 2.1,
      z: -0.5
    });

    layers.push(newLayer);
    selectedId = id;
  }

  closeTextEditor();

  renderLayers();
  syncInspector();
  renderFontList();

  void renderAll();
}

$('confirmText').onclick = applyTextEditor;
$('cancelText').onclick = closeTextEditor;

$<HTMLInputElement>(
  'editingText'
).addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    applyTextEditor();
  }

  if (event.key === 'Escape') {
    closeTextEditor();
  }
});

// ==================================================
// LAYER MANAGER
// ==================================================

function moveLayer(
  id: number,
  direction: -1 | 1
) {
  const index = layers.findIndex(
    layer => layer.id === id
  );

  const target = index + direction;

  if (
    index < 0 ||
    target < 0 ||
    target >= layers.length
  ) return;

  [layers[index], layers[target]] = [
    layers[target],
    layers[index]
  ];

  renderLayers();
  void renderAll();
}

function renderLayers() {
  const root = document.getElementById('layers');
  if (!root) return;
  root.replaceChildren();

  layers.forEach((layer, index) => {
    const row = document.createElement('div');
    row.className = 'layer-row';

    const name = document.createElement('button');

    name.className =
      `layer-name ${
        layer.id === selectedId ? 'active' : ''
      }`;

    name.textContent = layer.text;

    name.title =
      'Click to select · Double-click to edit';

    name.onclick = () => selectLayer(layer.id);

    name.ondblclick = () => {
      selectLayer(layer.id);
      openTextEditor('edit');
    };

    const actions = document.createElement('div');
    actions.className = 'layer-actions';

    const back = document.createElement('button');

    back.textContent = '↓';
    back.title = 'Send backward';
    back.disabled = index === 0;

    back.onclick = () => {
      moveLayer(layer.id, -1);
    };

    const front = document.createElement('button');

    front.textContent = '↑';
    front.title = 'Bring forward';
    front.disabled = index === layers.length - 1;

    front.onclick = () => {
      moveLayer(layer.id, 1);
    };

    actions.append(back, front);
    row.append(name, actions);
    root.append(row);
  });
}

function deleteLayer() {
  if (layers.length <= 1) {
    alert('Keep at least one text layer.');
    return;
  }

  if (!confirm(`Delete "${current().text}"?`)) {
    return;
  }

  layers = layers.filter(
    layer => layer.id !== selectedId
  );

  selectedId = layers[layers.length - 1].id;

  renderLayers();
  syncInspector();
  renderFontList();

  void renderAll();
}

$('add').onclick = () => openTextEditor('add');

document.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) return;

  if (
    event.key === 'Delete' ||
    event.key === 'Backspace'
  ) {
    event.preventDefault();
    deleteLayer();
  }
});

// ==================================================
// INSPECTOR
// ==================================================

function setValue(
  id: string,
  value: string | number
) {
  $<HTMLInputElement>(id).value = String(value);
}

function syncLabels() {
  const layer = current();

  const values: Record<string, string> = {
    sizeValue: `${layer.size}px`,
    pixelValue: `${layer.pixel}px`,
    depthValue: layer.depth.toFixed(2),
    metalnessValue: layer.metalness.toFixed(2),
    roughnessValue: layer.roughness.toFixed(2),
    glowValue: layer.glowStrength.toFixed(2),
    lightValue: layer.lightIntensity.toFixed(1)
  };

  for (const [id, value] of Object.entries(values)) {
    $(id).textContent = value;
  }
}

function syncInspector() {
  const layer = current();

  $('selectedName').textContent = layer.text;

  const fields = [
    'size',
    'pixel',
    'color',
    'outline',
    'x',
    'y',
    'z',
    'renderMode',
    'depth',
    'dirX',
    'dirY',
    'dirZ',
    'sideColor',
    'materialType',
    'metalness',
    'roughness',
    'glowStrength',
    'lightIntensity'
  ] as const;

  for (const field of fields) {
    setValue(field, layer[field]);
  }

  const font = fonts.find(
    item => item.id === layer.fontId
  ) ?? fallbackFonts.find(
    item => item.id === layer.fontId
  );

  const weightSelect = $<HTMLSelectElement>(
    'weight'
  );

  weightSelect.replaceChildren();

  const weights = [
    ...new Set([
      ...(font?.weights ?? []),
      layer.weight
    ])
  ].sort((a, b) => a - b);

  for (const weight of weights) {
    const option = document.createElement('option');

    option.value = String(weight);
    option.textContent = String(weight);

    weightSelect.appendChild(option);
  }

  weightSelect.value = String(layer.weight);

  syncLabels();
}

const numericFields = [
  'size',
  'pixel',
  'x',
  'y',
  'z',
  'depth',
  'dirX',
  'dirY',
  'dirZ',
  'metalness',
  'roughness',
  'glowStrength',
  'lightIntensity'
] as const;

const stringFields = [
  'color',
  'outline',
  'sideColor',
  'renderMode',
  'materialType'
] as const;

for (const field of numericFields) {
  $(field).addEventListener('input', () => {
    const value = Number(
      $<HTMLInputElement>(field).value
    );

    if (!Number.isFinite(value)) return;

    (current() as any)[field] = value;

    syncLabels();
    void renderAll();
  });
}

for (const field of stringFields) {
  $(field).addEventListener('input', () => {
    (current() as any)[field] =
      $<HTMLInputElement>(field).value;

    void renderAll();
  });
}

$('weight').addEventListener('change', () => {
  current().weight = Number(
    $<HTMLSelectElement>('weight').value
  );

  void renderAll();
});

// ==================================================
// RESIZABLE SIDEBARS
// ==================================================

const workspace = $('workspace');

const storedLayout = readJSON<{
  left: number;
  right: number;
}>(
  LAYOUT_STORAGE,
  {
    left: 285,
    right: 305
  }
);

let leftWidth = storedLayout.left;
let rightWidth = storedLayout.right;

function applyLayout() {
  const width = workspace.clientWidth;

  if (width <= 950) {
    resize();
    return;
  }

  const minSide = 180;
  const minCenter = 260;
  const handles = 14;

  const totalAvailable = width - minCenter - handles;

  leftWidth = THREE.MathUtils.clamp(
    leftWidth,
    minSide,
    Math.max(minSide, totalAvailable - minSide)
  );

  rightWidth = THREE.MathUtils.clamp(
    rightWidth,
    minSide,
    Math.max(minSide, totalAvailable - leftWidth)
  );

  leftWidth = Math.min(
    leftWidth,
    totalAvailable - rightWidth
  );

  workspace.style.setProperty(
    '--left-width',
    `${leftWidth}px`
  );

  workspace.style.setProperty(
    '--right-width',
    `${rightWidth}px`
  );

  resize();
}

function setupResizer(
  id: string,
  side: 'left' | 'right'
) {
  const handle = $(id);

  let startX = 0;
  let startWidth = 0;

  handle.addEventListener('pointerdown', event => {
    startX = event.clientX;

    startWidth = side === 'left'
      ? leftWidth
      : rightWidth;

    handle.setPointerCapture(event.pointerId);
    handle.classList.add('dragging');
  });

  handle.addEventListener('pointermove', event => {
    if (
      !handle.hasPointerCapture(event.pointerId)
    ) return;

    const difference = event.clientX - startX;

    const value = side === 'left'
      ? startWidth + difference
      : startWidth - difference;

    const otherWidth = side === 'left'
      ? rightWidth
      : leftWidth;

    const maxWidth = Math.max(
      180,
      workspace.clientWidth - otherWidth - 274
    );

    if (side === 'left') {
      leftWidth = THREE.MathUtils.clamp(
        value,
        180,
        maxWidth
      );
    } else {
      rightWidth = THREE.MathUtils.clamp(
        value,
        180,
        maxWidth
      );
    }

    applyLayout();
  });

  function stop() {
    handle.classList.remove('dragging');

    localStorage.setItem(
      LAYOUT_STORAGE,
      JSON.stringify({
        left: leftWidth,
        right: rightWidth
      })
    );
  }

  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
}

setupResizer('resizeLeft', 'left');
setupResizer('resizeRight', 'right');

window.addEventListener('resize', applyLayout);
applyLayout();

// ==================================================
// SAVE / RESET
// ==================================================

$('save').onclick = () => {
  localStorage.setItem(
    STORAGE,
    JSON.stringify(layers)
  );

  setStatus('Design saved locally');
};

$('reset').onclick = () => {
  if (!confirm('Reset all text layers?')) return;

  layers = initial.map(normalize);
  selectedId = 2;

  localStorage.removeItem(STORAGE);

  renderLayers();
  syncInspector();
  renderFontList();

  void renderAll();
};

// ==================================================
// EXPORT TITLE3D.TS
// ==================================================

function downloadFile(
  name: string,
  content: string,
  mime: string
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = name;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function exportSource(data: ExportLayer[]): string {
  return `
import * as THREE from 'three';

// Generated by Folio Type Studio.
// Add title3d to your existing scene.

const data = ${JSON.stringify(data)};

export const title3d = new THREE.Group();

const fades: Array<{
  material: THREE.Material;
  baseOpacity: number;
}> = [];

function track(material: THREE.Material) {
  const baseOpacity = material.opacity;
  material.transparent = true;
  material.opacity = 0;

  fades.push({ material, baseOpacity });

  return material;
}

for (const item of data) {
  const layer = new THREE.Group();

  layer.position.set(item.x, item.y, item.z);
  layer.scale.setScalar(item.scale);

  title3d.add(layer);

  const texture = new THREE.TextureLoader().load(item.png);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  const width = 4.05;
  const height = width * 160 / 512;
  const depth = Math.max(0, item.depth);

  const direction = new THREE.Vector3(
    item.dirX,
    item.dirY,
    item.dirZ
  );

  if (direction.lengthSq() < 0.00001) {
    direction.set(0, 0, -1);
  }

  direction.normalize();

  function material(
    color: string,
    map?: THREE.Texture
  ): THREE.Material {
    if (
      item.materialType === 'matte' ||
      item.materialType === 'metallic'
    ) {
      return track(new THREE.MeshStandardMaterial({
        color: map ? '#ffffff' : color,
        map: map ?? null,
        transparent: true,
        alphaTest: map ? 0.1 : 0,
        side: THREE.DoubleSide,
        metalness: item.materialType === 'metallic'
          ? item.metalness
          : 0,
        roughness: item.materialType === 'metallic'
          ? item.roughness
          : 1,
        depthWrite: false
      }));
    }

    return track(new THREE.MeshBasicMaterial({
      color: map ? '#ffffff' : color,
      map: map ?? null,
      transparent: true,
      alphaTest: map ? 0.1 : 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false
    }));
  }

  if (
    item.renderMode === 'stacked' &&
    depth > 0
  ) {
    const steps = Math.min(
      40,
      Math.max(2, Math.ceil(depth * 100))
    );

    for (let i = steps; i >= 1; i--) {
      const sideMat = track(new THREE.MeshBasicMaterial({
        map: texture,
        color: item.sideColor,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
      }));

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        sideMat
      );

      mesh.position.copy(
        direction.clone().multiplyScalar(
          depth * i / steps
        )
      );

      layer.add(mesh);
    }
  }

  if (
    item.renderMode === 'extruded' &&
    depth > 0 &&
    item.cells.length > 0
  ) {
    const geometry = new THREE.BoxGeometry(
      width / 96 * 1.015,
      height / 30 * 1.015,
      depth
    );

    const sideMat = material(item.sideColor);

    const mesh = new THREE.InstancedMesh(
      geometry,
      sideMat,
      item.cells.length
    );

    const dummy = new THREE.Object3D();

    const rotation = new THREE.Quaternion()
      .setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        direction.clone().negate()
      );

    item.cells.forEach((index, i) => {
      const x = index % 96;
      const y = Math.floor(index / 96);

      dummy.position.set(
        -width / 2 + (x + 0.5) * width / 96,
        height / 2 - (y + 0.5) * height / 30,
        0
      );

      dummy.position.addScaledVector(
        direction,
        depth / 2
      );

      dummy.quaternion.copy(rotation);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;

    layer.add(mesh);
  }

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    material(item.color, texture)
  );

  face.position.z = 0.008;
  layer.add(face);

  if (
    item.materialType === 'glow' &&
    item.glowStrength > 0
  ) {
    const glowMat = track(
      new THREE.MeshBasicMaterial({
        map: texture,
        color: item.color,
        transparent: true,
        opacity: Math.min(
          0.4,
          item.glowStrength * 0.18
        ),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      })
    );

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      glowMat
    );

    glow.scale.setScalar(
      1 + item.glowStrength * 0.05
    );

    glow.position.z = 0.019;

    layer.add(glow);
  }
}

let visibility = 0;

export function updateTitle(
  time: number,
  show: boolean,
  delta: number
) {
  visibility += (
    (show ? 0.97 : 0) - visibility
  ) * (
    1 - Math.exp(-delta * 3.2)
  );

  for (const fade of fades) {
    fade.material.opacity =
      fade.baseOpacity * visibility;
  }

  title3d.visible = visibility > 0.01;

  title3d.position.y =
    Math.sin(time * 0.9) * 0.035;

  title3d.rotation.y =
    Math.sin(time * 0.35) * 0.045;
}
`;
}

async function exportTitle() {
  const data: ExportLayer[] = layers.map(layer => {
    const canvas = createCanvas(layer);

    return {
      ...layer,
      png: canvas.toDataURL('image/png'),
      cells: layer.renderMode === 'extruded'
        ? getVoxelCells(canvas)
        : []
    };
  });

  const source = exportSource(data);

  downloadFile(
    'title3d.ts',
    source,
    'text/typescript'
  );

  setStatus('Title exported');
}

$('export').onclick = async () => {
  if (exporting) return;

  exporting = true;
  setStatus('Preparing fonts...');

  try {
    await Promise.all(
      layers.map(ensureLayerFont)
    );

    await exportTitle();
  } catch (error) {
    console.error(error);

    setStatus('Export failed');

    alert(
      'A font could not be loaded. Check your connection.'
    );
  } finally {
    exporting = false;
  }
};

// ==================================================
// STARTUP
// ==================================================

renderLayers();
syncInspector();

void loadCatalog().then(async () => {
  syncInspector();
  await renderAll();
});