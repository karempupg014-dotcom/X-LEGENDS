import * as THREE from 'three';

// Cache generated textures to avoid recreating canvases
const textureCache = new Map<string, THREE.CanvasTexture>();


/**
 * Fine height maps add small real light-catching relief to the terrain materials.
 * These are deliberately subtle so the ground reads as textured rather than noisy.
 */
function getTerrainHeightTexture(kind: 'grass' | 'cobblestone' | 'dirt'): THREE.CanvasTexture {
  const key = `height_${kind}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(512, 512);

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * 4;
      const broad = Math.sin(x * 0.045 + Math.sin(y * 0.021) * 2.2) * 9;
      const fine = Math.sin(x * 0.31 + y * 0.17) * 5 + Math.sin(y * 0.43 - x * 0.11) * 4;
      let value = 128 + broad + fine;
      if (kind === 'cobblestone') {
        const gx = (x % 64) - 32;
        const gy = (y % 32) - 16;
        const edge = Math.min(Math.abs(gx), Math.abs(gy));
        value += edge < 3 ? -28 : 12;
        value += Math.sin((x + y * 0.7) * 0.12) * 3;
      } else if (kind === 'grass') {
        value += Math.sin(x * 0.8 + y * 0.24) * 7;
      } else {
        value += Math.sin(x * 0.16 + y * 0.13) * 11;
      }
      const v = Math.max(0, Math.min(255, Math.round(value)));
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'cobblestone' ? 8 : 12, kind === 'cobblestone' ? 8 : 12);
  texture.anisotropy = 8;
  textureCache.set(key, texture);
  return texture;
}

export function getGrassHeightTexture(): THREE.CanvasTexture {
  return getTerrainHeightTexture('grass');
}

export function getCobblestoneHeightTexture(): THREE.CanvasTexture {
  return getTerrainHeightTexture('cobblestone');
}

export function getDirtPathHeightTexture(): THREE.CanvasTexture {
  return getTerrainHeightTexture('dirt');
}

/**
 * Creates a seamless procedural cobblestone paving texture
 */
export function getCobblestoneTexture(): THREE.CanvasTexture {
  if (textureCache.has('cobblestone')) return textureCache.get('cobblestone')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const size = 1024;

  // Deep, warm mortar with subtle granular variation.
  ctx.fillStyle = '#292b2b';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 35 + Math.floor(Math.random() * 35);
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, ${Math.random() * 0.22})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Uneven, hand-laid medieval paving stones rather than repeated rounded tiles.
  const rows = 19;
  const cols = 13;
  const cellH = size / rows;
  const cellW = size / cols;
  const seeded = (x: number, y: number, salt: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let row = -1; row <= rows; row++) {
    const offset = row % 2 ? cellW * 0.48 : 0;
    for (let col = -1; col <= cols; col++) {
      const cx = col * cellW + offset + cellW * (0.5 + (seeded(col, row, 1) - 0.5) * 0.12);
      const cy = row * cellH + cellH * (0.5 + (seeded(col, row, 2) - 0.5) * 0.12);
      const w = cellW * (0.82 + seeded(col, row, 3) * 0.12);
      const h = cellH * (0.78 + seeded(col, row, 4) * 0.15);
      const tone = 91 + Math.floor(seeded(col, row, 5) * 48);
      const warm = Math.floor(seeded(col, row, 6) * 9);
      const points = 7;
      const verts: Array<[number, number]> = [];
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const irregular = 0.88 + seeded(col * 11 + p, row * 7 + p, 7) * 0.18;
        verts.push([cx + Math.cos(angle) * w * 0.5 * irregular, cy + Math.sin(angle) * h * 0.5 * irregular]);
      }

      ctx.save();
      ctx.beginPath();
      verts.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.closePath();
      const shade = ctx.createLinearGradient(cx - w * 0.4, cy - h * 0.5, cx + w * 0.4, cy + h * 0.5);
      shade.addColorStop(0, `rgb(${tone + 27 + warm}, ${tone + 25 + warm}, ${tone + 20 + warm})`);
      shade.addColorStop(0.42, `rgb(${tone + 5}, ${tone + 4}, ${tone})`);
      shade.addColorStop(1, `rgb(${tone - 28}, ${tone - 27}, ${tone - 25})`);
      ctx.fillStyle = shade;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(18, 20, 20, 0.72)';
      ctx.stroke();

      // Fine chips, mineral flecks and worn patches catch light at close range.
      for (let speck = 0; speck < 15; speck++) {
        const sx = cx + (seeded(col * 17 + speck, row, 8) - 0.5) * w * 0.72;
        const sy = cy + (seeded(col, row * 13 + speck, 9) - 0.5) * h * 0.68;
        const radius = 0.6 + seeded(speck, col + row, 10) * 2.1;
        ctx.fillStyle = seeded(speck, row, 11) > 0.48
          ? 'rgba(225, 216, 194, 0.16)'
          : 'rgba(25, 27, 27, 0.18)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, radius * 1.7, radius, seeded(speck, col, 12), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set('cobblestone', texture);
  return texture;
}

/**
 * Creates rich stylized grass terrain texture with moss and flower flecks
 */
export function getGrassTexture(): THREE.CanvasTexture {
  if (textureCache.has('grass')) return textureCache.get('grass')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base meadow green
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, 512, 512);

  // Layered mottled grass shades
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 2 + Math.random() * 8;
    const shade = Math.random();
    if (shade < 0.4) {
      ctx.fillStyle = '#3a7233'; // bright foliage
    } else if (shade < 0.7) {
      ctx.fillStyle = '#22471e'; // deep forest shadow
    } else {
      ctx.fillStyle = '#4c8a42'; // golden sunlit blade
    }
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.8, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Little wildflowers (white, yellow, blue)
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const col = ['#fef08a', '#e0f2fe', '#fbcfe8', '#fed7aa'][Math.floor(Math.random() * 4)];
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set('grass', texture);
  return texture;
}

/**
 * Creates dirt trail texture with embedded pebbles
 */
export function getDirtPathTexture(): THREE.CanvasTexture {
  if (textureCache.has('dirtPath')) return textureCache.get('dirtPath')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5c442d';
  ctx.fillRect(0, 0, 512, 512);

  // Dirt patches
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 2 + Math.random() * 6;
    ctx.fillStyle = Math.random() > 0.5 ? '#735738' : '#453220';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Small pebbles
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = '#8c7b6d';
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set('dirtPath', texture);
  return texture;
}

/**
 * Creates medieval half-timber wall texture (cream plaster with dark oak frame)
 */
export function getMedievalWallTexture(): THREE.CanvasTexture {
  if (textureCache.has('medievalWall')) return textureCache.get('medievalWall')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Aged cream plaster
  ctx.fillStyle = '#dcd5c4';
  ctx.fillRect(0, 0, 512, 512);

  // Plaster subtle texture
  ctx.fillStyle = 'rgba(120, 110, 95, 0.15)';
  for (let i = 0; i < 800; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 3);
  }

  // Dark timber outer beams
  ctx.fillStyle = '#3e2714';
  const beamWidth = 24;
  // Border frame
  ctx.fillRect(0, 0, 512, beamWidth);
  ctx.fillRect(0, 512 - beamWidth, 512, beamWidth);
  ctx.fillRect(0, 0, beamWidth, 512);
  ctx.fillRect(512 - beamWidth, 0, beamWidth, 512);
  // Center cross beams
  ctx.fillRect(256 - beamWidth / 2, 0, beamWidth, 512);
  ctx.fillRect(0, 256 - beamWidth / 2, 512, beamWidth);

  // Diagonal brace
  ctx.beginPath();
  ctx.moveTo(beamWidth, beamWidth);
  ctx.lineTo(256 - beamWidth / 2, 256 - beamWidth / 2);
  ctx.lineWidth = beamWidth;
  ctx.strokeStyle = '#3e2714';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(512 - beamWidth, beamWidth);
  ctx.lineTo(256 + beamWidth / 2, 256 - beamWidth / 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('medievalWall', texture);
  return texture;
}

/**
 * Creates medieval terracotta roof tiles texture
 */
export function getRoofTileTexture(): THREE.CanvasTexture {
  if (textureCache.has('roofTile')) return textureCache.get('roofTile')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b3a20';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const rh = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rh;
    // Row line
    ctx.fillStyle = '#5c2211';
    ctx.fillRect(0, y, 256, 4);

    // Rounded scallops
    for (let x = (r % 2) * 16; x < 256; x += 32) {
      const grad = ctx.createLinearGradient(x, y + 4, x + 32, y + rh);
      grad.addColorStop(0, '#a84b2c');
      grad.addColorStop(1, '#6f2b16');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, 28, rh - 6, [0, 0, 8, 8]);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('roofTile', texture);
  return texture;
}

/**
 * Creates tree bark wood texture
 */
export function getBarkTexture(): THREE.CanvasTexture {
  if (textureCache.has('bark')) return textureCache.get('bark')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a2718';
  ctx.fillRect(0, 0, 256, 256);

  // Vertical bark ridges
  for (let x = 0; x < 256; x += 8) {
    const w = 4 + Math.random() * 5;
    ctx.fillStyle = Math.random() > 0.5 ? '#4e3522' : '#2b1b0e';
    ctx.fillRect(x, 0, w, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('bark', texture);
  return texture;
}

/**
 * Creates dynamic aggro radius ring texture with runic dash marks
 */
export function getAggroRingTexture(isAggro: boolean): THREE.CanvasTexture {
  const key = isAggro ? 'aggro_red' : 'aggro_amber';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  const cx = 128;
  const cy = 128;
  const radius = 110;

  // Outer glow ring
  const strokeColor = isAggro ? '#ef4444' : '#f59e0b';
  const fillColor = isAggro ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.05)';

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Outer primary ring
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner dashed rune ring
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 12, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal rune notches
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(angle) * (radius - 18);
    const y1 = cy + Math.sin(angle) * (radius - 18);
    const x2 = cx + Math.cos(angle) * (radius + 4);
    const y2 = cy + Math.sin(angle) * (radius + 4);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates water ripple texture for fountain
 */
export function getWaterTexture(): THREE.CanvasTexture {
  if (textureCache.has('water')) return textureCache.get('water')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 256, 256);

  // Concentric gentle ripple waves
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.4)';
  ctx.lineWidth = 3;
  for (let r = 20; r < 140; r += 24) {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('water', texture);
  return texture;
}
