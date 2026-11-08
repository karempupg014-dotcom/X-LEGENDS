/**
 * High-Performance Pre-rendered 2D Isometric Sprite Atlas for X LEGENDS
 * Generates rich, hand-crafted style 2D isometric tiles, trees, buildings,
 * warrior directional animation frames, and monsters onto offscreen canvases.
 * Eliminates primitive geometric vector paths during the 60fps render loop!
 */

export interface SpriteAtlas {
  // Terrain Tiles (64x32)
  tiles: Record<string, HTMLCanvasElement>;
  
  // Static Environment Props
  trees: {
    oak: HTMLCanvasElement;
    pine: HTMLCanvasElement;
    stump: HTMLCanvasElement;
    boulder: HTMLCanvasElement;
    mushrooms: HTMLCanvasElement;
  };
  buildings: {
    tavern: HTMLCanvasElement;
    house: HTMLCanvasElement;
    forge: HTMLCanvasElement;
    stall: HTMLCanvasElement;
    fountain: HTMLCanvasElement;
    lampPost: HTMLCanvasElement;
    lampGlow: HTMLCanvasElement; // Pre-rendered light halo
    gate: HTMLCanvasElement;
    wall: HTMLCanvasElement;
    anvil: HTMLCanvasElement;
  };

  // NPCs
  npcs: Record<string, HTMLCanvasElement>;

  // Warrior Character Directional Animations
  // Keys: 'idle_S', 'walk_S_0', 'walk_S_1', 'attack_S_0', etc.
  warrior: Record<string, HTMLCanvasElement>;

  // 5 Forest Monsters
  monsters: {
    wolf: Record<string, HTMLCanvasElement>;
    boar: Record<string, HTMLCanvasElement>;
    goblin: Record<string, HTMLCanvasElement>;
    viper: Record<string, HTMLCanvasElement>;
    treant: Record<string, HTMLCanvasElement>;
  };
}

let cachedAtlas: SpriteAtlas | null = null;

export function getSpriteAtlas(): SpriteAtlas {
  if (cachedAtlas) return cachedAtlas;
  cachedAtlas = generateSpriteAtlas();
  return cachedAtlas;
}

function createCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Failed to create offscreen 2D context');
  ctx.imageSmoothingEnabled = true;
  return { canvas, ctx };
}

function generateSpriteAtlas(): SpriteAtlas {
  const TW = 64;
  const TH = 32;

  // -------------------------------------------------------------
  // 1. ENVIRONMENT TILES
  // -------------------------------------------------------------
  const tiles: Record<string, HTMLCanvasElement> = {};

  // Helper for drawing isometric diamond base
  const drawIsoDiamond = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(TW / 2, 0);
    ctx.lineTo(TW, TH / 2);
    ctx.lineTo(TW / 2, TH);
    ctx.lineTo(0, TH / 2);
    ctx.closePath();
  };

  // Grass Tile (Lush, multi-blade texture, organic shading)
  {
    const { canvas, ctx } = createCanvas(TW, TH + 4);
    drawIsoDiamond(ctx);
    const grad = ctx.createLinearGradient(0, 0, TW, TH);
    grad.addColorStop(0, '#2d6a36');
    grad.addColorStop(0.5, '#22542a');
    grad.addColorStop(1, '#1b4320');
    ctx.fillStyle = grad;
    ctx.fill();

    // Detailed grass blade specks & subtle texture
    ctx.fillStyle = '#3e8e49';
    for (let i = 0; i < 28; i++) {
      const x = 10 + (i * 17) % (TW - 20);
      const y = 6 + (i * 23) % (TH - 12);
      ctx.fillRect(x, y, 1.5, 2.5);
    }
    ctx.fillStyle = '#17361b';
    for (let i = 0; i < 18; i++) {
      const x = 12 + (i * 19) % (TW - 24);
      const y = 7 + (i * 29) % (TH - 14);
      ctx.fillRect(x, y, 1.5, 2);
    }

    // Subtle edge bevel
    ctx.strokeStyle = 'rgba(60, 140, 70, 0.35)';
    ctx.lineWidth = 1;
    drawIsoDiamond(ctx);
    ctx.stroke();

    tiles['grass'] = canvas;
  }

  // Flower Grass Tile
  {
    const { canvas, ctx } = createCanvas(TW, TH + 4);
    ctx.drawImage(tiles['grass'], 0, 0);

    // Golden & Red wild meadow blossoms
    const flowers = [
      { x: 18, y: 12, c: '#fde047' },
      { x: 42, y: 14, c: '#f43f5e' },
      { x: 28, y: 22, c: '#a855f7' },
      { x: 34, y: 9, c: '#38bdf8' },
      { x: 22, y: 20, c: '#fde047' },
    ];
    for (const f of flowers) {
      ctx.fillStyle = f.c;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(f.x - 0.5, f.y - 0.5, 1, 1);
    }
    tiles['flower_grass'] = canvas;
  }

  // Dark Mossy Forest Tile
  {
    const { canvas, ctx } = createCanvas(TW, TH + 4);
    drawIsoDiamond(ctx);
    const grad = ctx.createLinearGradient(0, 0, TW, TH);
    grad.addColorStop(0, '#1c4222');
    grad.addColorStop(0.5, '#15331a');
    grad.addColorStop(1, '#0e2412');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#265c30';
    for (let i = 0; i < 20; i++) {
      const x = 10 + (i * 19) % (TW - 20);
      const y = 6 + (i * 21) % (TH - 12);
      ctx.fillRect(x, y, 1.5, 2);
    }
    tiles['dark_grass'] = canvas;
  }

  // Town Cobblestone Path Tile
  {
    const { canvas, ctx } = createCanvas(TW, TH + 4);
    drawIsoDiamond(ctx);
    const grad = ctx.createLinearGradient(0, 0, TW, TH);
    grad.addColorStop(0, '#4a5568');
    grad.addColorStop(0.5, '#394251');
    grad.addColorStop(1, '#2d3748');
    ctx.fillStyle = grad;
    ctx.fill();

    // Hand-laid cobblestone pavers
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1;
    const stones = [
      { x: 20, y: 8, w: 10, h: 5 },
      { x: 33, y: 8, w: 12, h: 5 },
      { x: 14, y: 15, w: 12, h: 6 },
      { x: 28, y: 15, w: 14, h: 6 },
      { x: 44, y: 15, w: 9, h: 5 },
      { x: 22, y: 23, w: 11, h: 5 },
      { x: 35, y: 23, w: 12, h: 5 },
    ];
    for (const s of stones) {
      ctx.fillStyle = '#566377';
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 2);
      ctx.fill();
      ctx.stroke();
      // Stone top highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(s.x + 1, s.y + 1, s.w - 2, 1.5);
    }

    tiles['town_stone'] = canvas;
  }

  // Town Royal Plaza Tile (Ornate gold mosaic inlay)
  {
    const { canvas, ctx } = createCanvas(TW, TH + 4);
    ctx.drawImage(tiles['town_stone'], 0, 0);

    // Gilded concentric diamond trim
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(TW / 2, 4);
    ctx.lineTo(TW - 8, TH / 2);
    ctx.lineTo(TW / 2, TH - 4);
    ctx.lineTo(8, TH / 2);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.fillRect(TW / 2 - 2, TH / 2 - 2, 4, 4);
    tiles['town_plaza'] = canvas;
  }

  // Forest Dirt Trail Tile
  {
    const { canvas, ctx } = createCanvas(TW, TH + 4);
    drawIsoDiamond(ctx);
    const grad = ctx.createLinearGradient(0, 0, TW, TH);
    grad.addColorStop(0, '#855938');
    grad.addColorStop(0.5, '#6b4426');
    grad.addColorStop(1, '#52331b');
    ctx.fillStyle = grad;
    ctx.fill();

    // Worn pebbles
    ctx.fillStyle = '#a87852';
    for (let i = 0; i < 15; i++) {
      const x = 12 + (i * 13) % (TW - 24);
      const y = 8 + (i * 17) % (TH - 14);
      ctx.beginPath();
      ctx.ellipse(x, y, 2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    tiles['dirt_path'] = canvas;
  }

  // -------------------------------------------------------------
  // 2. STATIC ENVIRONMENT PROPS
  // -------------------------------------------------------------

  // Oak Tree (High quality hand-painted foliage clusters, gnarled trunk)
  const oakTree = (() => {
    const { canvas, ctx } = createCanvas(96, 120);
    const cx = 48;
    const cy = 105;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk & Gnarled Roots
    ctx.fillStyle = '#422413';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx - 16, cy + 5);
    ctx.lineTo(cx - 7, cy - 35);
    ctx.lineTo(cx - 16, cy - 55);
    ctx.lineTo(cx - 9, cy - 58);
    ctx.lineTo(cx - 4, cy - 40);
    ctx.lineTo(cx + 4, cy - 40);
    ctx.lineTo(cx + 9, cy - 58);
    ctx.lineTo(cx + 16, cy - 55);
    ctx.lineTo(cx + 7, cy - 35);
    ctx.lineTo(cx + 16, cy + 5);
    ctx.lineTo(cx + 10, cy);
    ctx.closePath();
    ctx.fill();

    // Bark Grain Texture
    ctx.strokeStyle = '#5a341b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#5a341b';
    ctx.fillRect(cx - 4, cy - 32, 2, 18);
    ctx.fillRect(cx + 2, cy - 28, 2, 14);

    // Layered Foliage Canopy (Shadow, Mid, Highlight Clusters)
    const drawLeafCluster = (x: number, y: number, r: number, baseColor: string, hiColor: string) => {
      // Cluster Shadow
      ctx.fillStyle = '#0f3316';
      ctx.beginPath();
      ctx.arc(x, y + 3, r + 1, 0, Math.PI * 2);
      ctx.fill();

      // Cluster Base
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Cluster Highlight
      ctx.fillStyle = hiColor;
      ctx.beginPath();
      ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Leaf rim spec
      ctx.fillStyle = 'rgba(190, 242, 100, 0.4)';
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };

    // Rear / Lower canopy
    drawLeafCluster(cx - 20, cy - 58, 20, '#164e23', '#247a38');
    drawLeafCluster(cx + 20, cy - 58, 20, '#164e23', '#247a38');
    drawLeafCluster(cx, cy - 52, 22, '#185627', '#2b8a40');

    // Mid canopy
    drawLeafCluster(cx - 24, cy - 74, 18, '#1b5e2b', '#349b4d');
    drawLeafCluster(cx + 24, cy - 74, 18, '#1b5e2b', '#349b4d');
    drawLeafCluster(cx - 10, cy - 78, 21, '#206b32', '#3ba854');
    drawLeafCluster(cx + 10, cy - 78, 21, '#206b32', '#3ba854');

    // Crown / Top canopy
    drawLeafCluster(cx, cy - 92, 22, '#28853f', '#50bf6c');
    drawLeafCluster(cx - 8, cy - 98, 14, '#349b4d', '#6ee787');
    drawLeafCluster(cx + 8, cy - 98, 14, '#349b4d', '#6ee787');

    return canvas;
  })();

  // Pine Tree (Conical needle tiers, mountain bark)
  const pineTree = (() => {
    const { canvas, ctx } = createCanvas(72, 110);
    const cx = 36;
    const cy = 96;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#381e0d';
    ctx.fillRect(cx - 4, cy - 24, 8, 24);

    // 4 Conical Needle Tiers
    const drawPineTier = (y: number, w: number, h: number, darkCol: string, hiCol: string) => {
      ctx.fillStyle = darkCol;
      ctx.beginPath();
      ctx.moveTo(cx, y - h);
      ctx.lineTo(cx + w, y);
      ctx.lineTo(cx - w, y);
      ctx.closePath();
      ctx.fill();

      // Top Highlight
      ctx.fillStyle = hiCol;
      ctx.beginPath();
      ctx.moveTo(cx, y - h);
      ctx.lineTo(cx, y);
      ctx.lineTo(cx - w * 0.85, y);
      ctx.closePath();
      ctx.fill();
    };

    drawPineTier(cy - 16, 26, 24, '#06381d', '#0b522c');
    drawPineTier(cy - 34, 22, 24, '#084524', '#0f6b39');
    drawPineTier(cy - 52, 17, 24, '#0b542c', '#148547');
    drawPineTier(cy - 70, 12, 24, '#0e6938', '#1bb562');

    return canvas;
  })();

  // Boulder / Mossy Rocks
  const boulder = (() => {
    const { canvas, ctx } = createCanvas(64, 48);
    const cx = 32;
    const cy = 34;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main crag
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx - 15, cy - 18);
    ctx.lineTo(cx, cy - 24);
    ctx.lineTo(cx + 18, cy - 16);
    ctx.lineTo(cx + 22, cy);
    ctx.closePath();
    ctx.fill();

    // Moss top
    ctx.fillStyle = '#22542a';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 16);
    ctx.lineTo(cx, cy - 24);
    ctx.lineTo(cx + 14, cy - 17);
    ctx.lineTo(cx + 4, cy - 12);
    ctx.closePath();
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas;
  })();

  // Glowing Forest Mushrooms
  const mushrooms = (() => {
    const { canvas, ctx } = createCanvas(48, 36);
    // Glowing ground aura
    const grad = ctx.createRadialGradient(24, 24, 2, 24, 24, 18);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(24, 24, 18, 0, Math.PI * 2);
    ctx.fill();

    // Stalks & Caps
    const drawShroom = (x: number, y: number, r: number, col: string) => {
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(x - 1.5, y, 3, 8);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y - r * 0.6, 1.5, 1.5);
      ctx.fillRect(x + 1, y - r * 0.4, 1.5, 1.5);
    };

    drawShroom(18, 20, 6, '#c084fc');
    drawShroom(28, 18, 8, '#a855f7');
    drawShroom(35, 22, 5, '#e879f9');

    return canvas;
  })();

  // Pre-rendered Lamp Glow (Zero runtime gradient cost!)
  const lampGlow = (() => {
    const { canvas, ctx } = createCanvas(96, 96);
    const grad = ctx.createRadialGradient(48, 48, 4, 48, 48, 46);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
    grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.25)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(48, 48, 46, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  })();

  // Lamp Post (Wrought Iron Lantern)
  const lampPost = (() => {
    const { canvas, ctx } = createCanvas(36, 72);
    const cx = 18;
    const cy = 64;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iron post
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 2, cy - 48, 4, 48);
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 5, cy - 6, 10, 6); // base

    // Bracket
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 40);
    ctx.lineTo(cx + 8, cy - 44);
    ctx.lineTo(cx + 8, cy - 38);
    ctx.stroke();

    // Lantern housing
    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx + 5, cy - 38, 6, 8);
    ctx.fillStyle = '#fef08a'; // Glowing Core
    ctx.fillRect(cx + 6, cy - 36, 4, 4);

    return canvas;
  })();

  // Town Buildings (Tavern / Medieval House)
  const townHouse = (() => {
    const { canvas, ctx } = createCanvas(128, 130);
    const cx = 64;
    const cy = 110;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 48, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone base foundation
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 44, cy + 6);
    ctx.lineTo(cx, cy + 26);
    ctx.lineTo(cx - 44, cy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Walls (Timber + Plaster)
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 38, cy - 60, 76, 52);
    // Dark Oak Timbers
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 38, cy - 60, 76, 52);
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy - 60);
    ctx.lineTo(cx + 38, cy - 8);
    ctx.moveTo(cx + 38, cy - 60);
    ctx.lineTo(cx - 38, cy - 8);
    ctx.stroke();

    // Gabled Shingled Roof (Deep Cobalt / Slate Blue)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 98);
    ctx.lineTo(cx + 46, cy - 62);
    ctx.lineTo(cx, cy - 42);
    ctx.lineTo(cx - 46, cy - 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#172554';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Shingle rows
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      const yOff = cy - 88 + r * 10;
      ctx.beginPath();
      ctx.moveTo(cx - 34 + r * 8, yOff);
      ctx.lineTo(cx, yOff + 14);
      ctx.lineTo(cx + 34 - r * 8, yOff);
      ctx.stroke();
    }

    // Windows (Warm amber glow)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - 24, cy - 44, 12, 14);
    ctx.fillRect(cx + 12, cy - 44, 12, 14);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 24, cy - 44, 12, 14);
    ctx.strokeRect(cx + 12, cy - 44, 12, 14);

    // Heavy wooden door
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 7, cy - 24, 14, 20);
    ctx.fillStyle = '#f59e0b'; // Brass handle
    ctx.fillRect(cx + 3, cy - 14, 2, 2);

    // Stone Chimney
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx + 22, cy - 100, 10, 26);
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx + 20, cy - 104, 14, 4);

    return canvas;
  })();

  // Blacksmith Forge Building
  const forgeBuilding = (() => {
    const { canvas, ctx } = createCanvas(130, 130);
    const cx = 65;
    const cy = 110;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 48, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walls
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(cx - 40, cy - 58, 80, 50);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 40, cy - 58, 80, 50);

    // Terracotta red forge roof
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 96);
    ctx.lineTo(cx + 48, cy - 60);
    ctx.lineTo(cx, cy - 40);
    ctx.lineTo(cx - 48, cy - 60);
    ctx.closePath();
    ctx.fill();

    // Open forge hearth with blazing fire
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx - 16, cy - 30, 32, 26);
    ctx.fillStyle = '#f97316'; // Flames
    ctx.beginPath();
    ctx.arc(cx, cy - 14, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, cy - 14, 5, 0, Math.PI * 2);
    ctx.fill();

    // Large Chimney
    ctx.fillStyle = '#27272a';
    ctx.fillRect(cx - 30, cy - 102, 14, 34);

    return canvas;
  })();

  // Fountain
  const fountain = (() => {
    const { canvas, ctx } = createCanvas(80, 60);
    const cx = 40;
    const cy = 42;

    // Outer stone basin
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 34, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crystalline Water
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tier column
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 4, cy - 24, 8, 22);
    ctx.beginPath();
    ctx.ellipse(cx, cy - 24, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water jets & foam
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(cx, cy - 28, 4, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  })();

  // -------------------------------------------------------------
  // 3. WARRIOR HERO SPRITE SHEET
  // -------------------------------------------------------------
  const warrior: Record<string, HTMLCanvasElement> = {};
  const directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];

  // Helper to draw the hero Warrior at a given direction, frame, and attack angle
  const renderWarriorFrame = (dir: string, animState: 'idle' | 'walk' | 'attack', frame: number): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(64, 72);
    const cx = 32;
    const cy = 54;

    const isFlipped = dir === 'W' || dir === 'NW' || dir === 'SW';
    const isBack = dir === 'N' || dir === 'NE' || dir === 'NW';

    ctx.save();
    if (isFlipped) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const walkBob = animState === 'walk' ? (frame % 2 === 0 ? -2 : 1) : 0;
    const legSwing = animState === 'walk' ? (frame % 2 === 0 ? 4 : -4) : 0;

    // Cape (Crimson Velvet with gold trim)
    if (!isBack || animState === 'walk') {
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      const capeSway = animState === 'walk' ? (frame % 2 === 0 ? 3 : -3) : 0;
      ctx.moveTo(cx - 7, cy - 24 + walkBob);
      ctx.lineTo(cx + 7, cy - 24 + walkBob);
      ctx.lineTo(cx + 9 + capeSway, cy - 4);
      ctx.lineTo(cx - 9 + capeSway, cy - 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Legs / Greaves
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 6, cy - 14 + walkBob + legSwing, 4, 12);
    ctx.fillRect(cx + 2, cy - 14 + walkBob - legSwing, 4, 12);
    // Steel Sabatons (Boots)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 7, cy - 3 + walkBob + legSwing, 6, 4);
    ctx.fillRect(cx + 1, cy - 3 + walkBob - legSwing, 6, 4);

    // Torso / Steel Cuirass with Gold Filigree
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx - 8, cy - 28 + walkBob, 16, 16);
    // Gold trim
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 8, cy - 28 + walkBob, 16, 16);
    // Lion crest emblem
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy - 21 + walkBob, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Knight Greathelm
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(cx, cy - 34 + walkBob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Visor slit
    if (!isBack) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 5, cy - 36 + walkBob, 10, 3);
      ctx.fillStyle = '#38bdf8'; // Glowing rune visor
      ctx.fillRect(cx - 4, cy - 35 + walkBob, 8, 1);
    }

    // Crimson Plume
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 42 + walkBob);
    ctx.quadraticCurveTo(cx - 4, cy - 47 + walkBob, cx - 7, cy - 41 + walkBob);
    ctx.quadraticCurveTo(cx - 2, cy - 41 + walkBob, cx, cy - 42 + walkBob);
    ctx.fill();

    // Off-hand Shield (Heater shield with heraldic crest)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 25 + walkBob);
    ctx.lineTo(cx - 7, cy - 25 + walkBob);
    ctx.lineTo(cx - 7, cy - 12 + walkBob);
    ctx.lineTo(cx - 11, cy - 7 + walkBob);
    ctx.lineTo(cx - 15, cy - 12 + walkBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Shield insignia
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 13, cy - 21 + walkBob, 4, 8);

    // Sword Arm & Steel Broadsword
    ctx.save();
    let swordAngle = -0.3;
    let swordY = cy - 22 + walkBob;
    let swordX = cx + 9;

    if (animState === 'attack') {
      if (frame === 0) swordAngle = -0.8;
      else if (frame === 1) swordAngle = 0.8;
      else swordAngle = 1.3;
    } else if (animState === 'walk') {
      swordAngle = -0.3 + (frame % 2 === 0 ? 0.15 : -0.15);
    }

    ctx.translate(swordX, swordY);
    ctx.rotate(swordAngle);

    // Blade
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-2, -24, 4, 24);
    // Rune Fuller line
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-0.5, -22, 1, 18);
    // Crossguard & Pommel
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-6, 0, 12, 3);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-1.5, 3, 3, 5);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Golden slash trail during attack frame
    if (animState === 'attack' && frame === 1) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 20, 24, -0.6, 1.2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
    return canvas;
  };

  // Generate all warrior frames
  for (const dir of directions) {
    warrior[`idle_${dir}`] = renderWarriorFrame(dir, 'idle', 0);
    warrior[`walk_${dir}_0`] = renderWarriorFrame(dir, 'walk', 0);
    warrior[`walk_${dir}_1`] = renderWarriorFrame(dir, 'walk', 1);
    warrior[`walk_${dir}_2`] = renderWarriorFrame(dir, 'walk', 2);
    warrior[`walk_${dir}_3`] = renderWarriorFrame(dir, 'walk', 3);
    warrior[`attack_${dir}_0`] = renderWarriorFrame(dir, 'attack', 0);
    warrior[`attack_${dir}_1`] = renderWarriorFrame(dir, 'attack', 1);
    warrior[`attack_${dir}_2`] = renderWarriorFrame(dir, 'attack', 2);
  }

  // -------------------------------------------------------------
  // 4. FIVE FOREST MONSTERS (Detailed 2D Sprites)
  // -------------------------------------------------------------
  const monsters = {
    wolf: {} as Record<string, HTMLCanvasElement>,
    boar: {} as Record<string, HTMLCanvasElement>,
    goblin: {} as Record<string, HTMLCanvasElement>,
    viper: {} as Record<string, HTMLCanvasElement>,
    treant: {} as Record<string, HTMLCanvasElement>,
  };

  // 1. Forest Wolf (Silver fur, predatory stance, fangs)
  const renderWolf = (isAttacking: boolean, isFlash: boolean): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(64, 48);
    const cx = 32;
    const cy = 34;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fur Base
    ctx.fillStyle = isFlash ? '#ffffff' : '#475569';
    // Body
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 12, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Haunches & Legs
    ctx.fillRect(cx - 16, cy - 12, 5, 12);
    ctx.fillRect(cx + 6, cy - 12, 5, 12);

    // Head
    const headX = isAttacking ? cx + 18 : cx + 14;
    ctx.beginPath();
    ctx.arc(headX, cy - 16, 7, 0, Math.PI * 2);
    ctx.fill();
    // Snout & Fangs
    ctx.fillRect(headX + 4, cy - 16, 6, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(headX + 7, cy - 11, 2, 3); // Fang

    // Pointed Ears
    ctx.fillStyle = isFlash ? '#ffffff' : '#64748b';
    ctx.beginPath();
    ctx.moveTo(headX - 3, cy - 22);
    ctx.lineTo(headX + 1, cy - 26);
    ctx.lineTo(headX + 4, cy - 22);
    ctx.closePath();
    ctx.fill();

    // Glowing Predator Eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(headX + 2, cy - 17, 2.5, 2.5);

    // Bushy Tail
    ctx.fillStyle = isFlash ? '#ffffff' : '#334155';
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy - 16, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  };
  monsters.wolf['idle'] = renderWolf(false, false);
  monsters.wolf['attack'] = renderWolf(true, false);
  monsters.wolf['flash'] = renderWolf(false, true);

  // 2. Wild Boar (Heavy bristle, curved white tusks, muddy hooves)
  const renderBoar = (isAttacking: boolean, isFlash: boolean): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(64, 52);
    const cx = 32;
    const cy = 38;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isFlash ? '#ffffff' : '#78350f';
    // Chunky torso
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 14, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stubby legs
    ctx.fillStyle = isFlash ? '#ffffff' : '#451a03';
    ctx.fillRect(cx - 15, cy - 12, 6, 12);
    ctx.fillRect(cx + 6, cy - 12, 6, 12);

    // Boar Head & Snout
    const headX = isAttacking ? cx + 18 : cx + 15;
    ctx.fillStyle = isFlash ? '#ffffff' : '#92400e';
    ctx.beginPath();
    ctx.ellipse(headX, cy - 15, 9, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.fillRect(headX + 6, cy - 17, 6, 7);

    // Razor Tusks
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(headX + 5, cy - 11);
    ctx.lineTo(headX + 9, cy - 18);
    ctx.lineTo(headX + 7, cy - 11);
    ctx.closePath();
    ctx.fill();

    // Red Angry Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(headX + 2, cy - 18, 2.5, 2.5);

    // Bristles along spine
    ctx.fillStyle = '#451a03';
    for (let b = 0; b < 6; b++) {
      ctx.fillRect(cx - 14 + b * 4, cy - 28, 2, 4);
    }

    return canvas;
  };
  monsters.boar['idle'] = renderBoar(false, false);
  monsters.boar['attack'] = renderBoar(true, false);
  monsters.boar['flash'] = renderBoar(false, true);

  // 3. Shadow Goblin (Green skin, hood cowl, serrated twin daggers)
  const renderGoblin = (isAttacking: boolean, isFlash: boolean): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(56, 56);
    const cx = 28;
    const cy = 44;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Leather Tunic
    ctx.fillStyle = isFlash ? '#ffffff' : '#1f2937';
    ctx.fillRect(cx - 6, cy - 20, 12, 14);

    // Green Skulking Limbs
    ctx.fillStyle = isFlash ? '#ffffff' : '#15803d';
    ctx.fillRect(cx - 5, cy - 8, 4, 8);
    ctx.fillRect(cx + 2, cy - 8, 4, 8);

    // Goblin Head & Oversized Ears
    ctx.beginPath();
    ctx.arc(cx, cy - 25, 7, 0, Math.PI * 2);
    ctx.fill();
    // Long pointed ears
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 26);
    ctx.lineTo(cx - 14, cy - 30);
    ctx.lineTo(cx - 6, cy - 22);
    ctx.moveTo(cx + 6, cy - 26);
    ctx.lineTo(cx + 14, cy - 30);
    ctx.lineTo(cx + 6, cy - 22);
    ctx.fill();

    // Glowing yellow eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(cx - 3, cy - 26, 2, 2);
    ctx.fillRect(cx + 1, cy - 26, 2, 2);

    // Twin Daggers with green poison sheen
    ctx.fillStyle = '#94a3b8';
    const dagX = isAttacking ? cx + 14 : cx + 8;
    ctx.fillRect(dagX, cy - 18, 10, 2.5);
    ctx.fillStyle = '#22c55e'; // Poison drop
    ctx.fillRect(dagX + 8, cy - 15, 2, 2);

    return canvas;
  };
  monsters.goblin['idle'] = renderGoblin(false, false);
  monsters.goblin['attack'] = renderGoblin(true, false);
  monsters.goblin['flash'] = renderGoblin(false, true);

  // 4. Crimson Viper (Diamond scales, flared cobra hood, glowing ruby eyes)
  const renderViper = (isAttacking: boolean, isFlash: boolean): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(56, 52);
    const cx = 28;
    const cy = 40;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coiled lower body
    ctx.fillStyle = isFlash ? '#ffffff' : '#991b1b';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Raised serpentine neck & flared cobra hood
    ctx.fillStyle = isFlash ? '#ffffff' : '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 8);
    ctx.lineTo(cx - 10, cy - 20);
    ctx.lineTo(cx, cy - 26);
    ctx.lineTo(cx + 10, cy - 20);
    ctx.lineTo(cx + 6, cy - 8);
    ctx.closePath();
    ctx.fill();

    // Diamond belly scales
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(cx - 2, cy - 20, 4, 12);

    // Viper Head
    const headX = isAttacking ? cx + 4 : cx;
    ctx.fillStyle = isFlash ? '#ffffff' : '#ef4444';
    ctx.beginPath();
    ctx.arc(headX, cy - 27, 6, 0, Math.PI * 2);
    ctx.fill();

    // Glowing amber eyes & flicking forked tongue
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(headX + 2, cy - 28, 2, 2);

    // Forked red tongue
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headX + 6, cy - 26);
    ctx.lineTo(headX + 11, cy - 26);
    ctx.lineTo(headX + 13, cy - 28);
    ctx.moveTo(headX + 11, cy - 26);
    ctx.lineTo(headX + 13, cy - 24);
    ctx.stroke();

    return canvas;
  };
  monsters.viper['idle'] = renderViper(false, false);
  monsters.viper['attack'] = renderViper(true, false);
  monsters.viper['flash'] = renderViper(false, true);

  // 5. Corrupted Treant Boss (Colossal ironbark trunk, amber heartwood fissure, branch antlers)
  const renderTreant = (isAttacking: boolean, isFlash: boolean): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(110, 110);
    const cx = 55;
    const cy = 94;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 38, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Gnarled Roots
    ctx.fillStyle = isFlash ? '#ffffff' : '#27170b';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy);
    ctx.lineTo(cx - 32, cy + 6);
    ctx.lineTo(cx + 32, cy + 6);
    ctx.lineTo(cx + 24, cy);
    ctx.closePath();
    ctx.fill();

    // Massive Ironbark Trunk
    ctx.fillStyle = isFlash ? '#ffffff' : '#3d2614';
    ctx.fillRect(cx - 20, cy - 54, 40, 52);

    // Glowing Amber Heartwood Fissure (Primal elemental power)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 48);
    ctx.lineTo(cx - 4, cy - 34);
    ctx.lineTo(cx + 4, cy - 22);
    ctx.lineTo(cx, cy - 10);
    ctx.stroke();

    // Mossy Crown Foliage
    ctx.fillStyle = isFlash ? '#ffffff' : '#14532d';
    ctx.beginPath();
    ctx.arc(cx, cy - 62, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isFlash ? '#ffffff' : '#166534';
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 66, 18, 0, Math.PI * 2);
    ctx.fill();

    // Gnarly Branch Antlers
    ctx.strokeStyle = isFlash ? '#ffffff' : '#52331b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 64);
    ctx.lineTo(cx - 32, cy - 84);
    ctx.lineTo(cx - 40, cy - 88);
    ctx.moveTo(cx - 28, cy - 78);
    ctx.lineTo(cx - 22, cy - 90);

    ctx.moveTo(cx + 16, cy - 64);
    ctx.lineTo(cx + 32, cy - 84);
    ctx.lineTo(cx + 40, cy - 88);
    ctx.moveTo(cx + 28, cy - 78);
    ctx.lineTo(cx + 22, cy - 90);
    ctx.stroke();

    // Glowing Amber Eyes
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 10, cy - 48, 6, 6);
    ctx.fillRect(cx + 4, cy - 48, 6, 6);

    // Heavy Stone Knuckle Fist
    const fistY = isAttacking ? cy - 18 : cy - 30;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx + 24, fistY, 10, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  };
  monsters.treant['idle'] = renderTreant(false, false);
  monsters.treant['attack'] = renderTreant(true, false);
  monsters.treant['flash'] = renderTreant(false, true);

  // -------------------------------------------------------------
  // 5. NPCs
  // -------------------------------------------------------------
  const npcs: Record<string, HTMLCanvasElement> = {};

  const renderNPC = (role: string): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(56, 68);
    const cx = 28;
    const cy = 52;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (role === 'guard') {
      // Captain Robert
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(cx - 7, cy - 26, 14, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(cx, cy - 32, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626'; // Cape
      ctx.fillRect(cx - 8, cy - 24, 3, 16);
      ctx.fillStyle = '#d97706'; // Gold trim
      ctx.fillRect(cx - 7, cy - 20, 14, 2);
    } else if (role === 'alchemist') {
      // Elena
      ctx.fillStyle = '#065f46';
      ctx.fillRect(cx - 6, cy - 24, 12, 22);
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(cx, cy - 31, 6, 0, Math.PI * 2);
      ctx.fill();
      // Flask
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx + 6, cy - 16, 4, 5);
    } else if (role === 'blacksmith') {
      // Master Gareth
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 8, cy - 25, 16, 22);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(cx, cy - 32, 7, 0, Math.PI * 2);
      ctx.fill();
      // Sledgehammer
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx + 8, cy - 28, 8, 5);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 11, cy - 23, 2, 16);
    } else {
      // Elder Orion
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(cx - 7, cy - 26, 14, 24);
      ctx.fillStyle = '#f8fafc'; // White beard
      ctx.beginPath();
      ctx.arc(cx, cy - 32, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 4, cy - 28, 8, 12);
      // Starlight staff
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 8, cy - 38, 2, 34);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(cx + 9, cy - 40, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  };

  npcs['guard'] = renderNPC('guard');
  npcs['alchemist'] = renderNPC('alchemist');
  npcs['blacksmith'] = renderNPC('blacksmith');
  npcs['elder'] = renderNPC('elder');

  return {
    tiles,
    trees: {
      oak: oakTree,
      pine: pineTree,
      stump: boulder,
      boulder: boulder,
      mushrooms: mushrooms,
    },
    buildings: {
      tavern: townHouse,
      house: townHouse,
      forge: forgeBuilding,
      stall: townHouse,
      fountain: fountain,
      lampPost: lampPost,
      lampGlow: lampGlow,
      gate: townHouse,
      wall: boulder,
      anvil: boulder,
    },
    npcs,
    warrior,
    monsters,
  };
}
