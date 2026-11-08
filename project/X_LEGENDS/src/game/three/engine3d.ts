import * as THREE from 'three';
import {
  PlayerStats,
  Equipment,
  Item,
  Quest,
  NPCEntity,
  ChatMessage,
  Language,
  Skill,
} from '../types';
import { sound } from '../audio';
import { t } from '../localization';
import { INITIAL_NPCS, getInitialMonsterSpawns, MONSTER_CONFIGS } from '../mapData';
import { AssetManager } from './assetManager';
import {
  createAggroRing3D,
  createFountain3D,
  createLampPost3D,
  createWallSection3D,
  createNPC3D,
} from './models3d';
import {
  getCobblestoneTexture,
  getGrassTexture,
  getDirtPathTexture,
  getGrassHeightTexture,
  getCobblestoneHeightTexture,
  getDirtPathHeightTexture,
} from './textures';
import { WeatherSystem, WeatherMode } from './weather3d';

let msgCounter = 0;
export function generateUniqueMsgId(prefix = 'msg'): string {
  msgCounter++;
  return `${prefix}_${Date.now()}_${msgCounter}_${Math.floor(Math.random() * 1000)}`;
}

export interface Monster3DEntity {
  id: string;
  type: 'wolf' | 'boar' | 'goblin' | 'viper' | 'treant';
  x: number;
  z: number;
  spawnX: number;
  spawnZ: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  aggroRadius: number;
  isAggro: boolean;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
  animTimer: number;
  attackCooldown: number;
  deathTimer: number;
  group: THREE.Group;
  mixer?: THREE.AnimationMixer;
  actions?: Record<string, THREE.AnimationAction>;
  currentAction?: string;
  aggroRing: {
    mesh: THREE.Mesh;
    setAggro: (aggro: boolean) => void;
    setVisible: (visible: boolean) => void;
  };
  hpBarGroup: THREE.Group;
  hpBarFill: THREE.Mesh;
}

export interface FloatingText3D {
  id: string;
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  canvas: HTMLCanvasElement;
  sprite: THREE.Sprite;
}

export interface Loot3DEntity {
  id: string;
  x: number;
  z: number;
  item: Item;
  goldAmount?: number;
  xCoinsAmount?: number;
  group: THREE.Group;
  rotSpeed: number;
}

export class GameEngine3D {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public weather: WeatherSystem;

  // Player State
  public stats: PlayerStats;
  public equipment: Equipment;
  public inventory: Item[];
  public quests: Quest[];
  public playerPos: { x: number; y: number } = { x: 16, y: 18 };
  public playerTargetPos: { x: number; y: number } | null = null;
  public language: Language;

  // 3D Player Character & Animation Mixer
  public warriorMesh!: THREE.Group;
  public playerMixer?: THREE.AnimationMixer;
  public playerActions: Record<string, THREE.AnimationAction> = {};
  public currentActionName: string = 'idle';
  private warriorHeading: number = 0;

  // Third-Person Camera Orbit State
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.58;
  public cameraDistance: number = 9.5;
  private isOrbitDragging: boolean = false;
  private lastDragX: number = 0;
  private lastDragY: number = 0;

  // Aggro Radius Toggle
  public showAggroRadius: boolean = true;

  // Combat, Skills & Buffs
  public autoAttack: boolean = false;
  public roarBuffTimer: number = 0;
  public elderBlessing: boolean = false;
  public targetMonster: Monster3DEntity | null = null;
  public targetIndicator!: THREE.Mesh;

  public skills: Skill[] = [
    {
      id: 'whirlwind',
      nameKey: 'skill1Name',
      descKey: 'skill1Desc',
      icon: '🌪️',
      mpCost: 25,
      cooldown: 4.5,
      currentCooldown: 0,
      range: 4.5,
      keybind: '1',
    },
    {
      id: 'thunder_dash',
      nameKey: 'skill2Name',
      descKey: 'skill2Desc',
      icon: '⚡',
      mpCost: 35,
      cooldown: 6.0,
      currentCooldown: 0,
      range: 7.0,
      keybind: '2',
    },
    {
      id: 'dragon_roar',
      nameKey: 'skill3Name',
      descKey: 'skill3Desc',
      icon: '🦁',
      mpCost: 40,
      cooldown: 18.0,
      currentCooldown: 0,
      range: 0,
      keybind: '3',
    },
    {
      id: 'heavenly_blade',
      nameKey: 'skill4Name',
      descKey: 'skill4Desc',
      icon: '🗡️',
      mpCost: 60,
      cooldown: 12.0,
      currentCooldown: 0,
      range: 8.0,
      keybind: '4',
    },
  ];

  // World Entities
  public monsters: Monster3DEntity[] = [];
  public npcs: NPCEntity[] = INITIAL_NPCS;
  private npcMeshes: THREE.Group[] = [];
  private lootEntities: Loot3DEntity[] = [];
  private floatingTexts: FloatingText3D[] = [];

  // Movement & Input
  private keys: Record<string, boolean> = {};
  private joystickVec = { x: 0, y: 0 };
  private isPlayerWalking: boolean = false;
  private isWhirlwinding: boolean = false;
  private slashArcMesh?: THREE.Mesh;

  // Performance Profiling
  public measuredFps: number = 60;
  public frameTimeMs: number = 16.6;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private lastFrameTime: number = performance.now();

  // Callbacks to React App
  public onStatsUpdate?: (stats: PlayerStats) => void;
  public onInventoryUpdate?: (inventory: Item[], equipment: Equipment) => void;
  public onQuestsUpdate?: (quests: Quest[]) => void;
  public onChatMessage?: (msg: ChatMessage) => void;
  public onOpenDialogue?: (npc: NPCEntity) => void;
  public onOpenShop?: () => void;

  private isDestroyed: boolean = false;
  private animFrameId: number = 0;

  constructor(
    container: HTMLElement,
    initialStats: PlayerStats,
    initialEquipment: Equipment,
    initialInventory: Item[],
    initialQuests: Quest[],
    initialPos: { x: number; y: number },
    language: Language
  ) {
    this.container = container;
    this.stats = { ...initialStats };
    this.equipment = { ...initialEquipment };
    this.inventory = [...initialInventory];
    this.quests = [...initialQuests];
    this.playerPos = { ...initialPos };
    this.language = language;

    // 1. Setup Three.js WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 2. Setup Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    // Muted atmospheric sky and distance haze give the town more natural depth.
    this.scene.background = new THREE.Color(0x9bb6c4);
    this.scene.fog = new THREE.FogExp2(0x9bb6c4, 0.0085);

    // 3. Setup Camera
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.3,
      350
    );

    // 4. Setup Weather
    this.weather = new WeatherSystem('rain', 0.5);

    // 5. Lighting
    this.setupLighting();

    // 6. Build World Geometry & Environment GLB Models
    this.buildTerrainAndTown();

    // 7. Load Imported GLB Player Character (Knight.glb)
    this.setupPlayerCharacter();

    // 8. Build Target Indicator
    this.setupTargetIndicator();

    // 9. Populate Monsters & NPCs using imported GLBs
    this.spawnMonsters();
    this.spawnNPCs();

    // 10. Bind Input Listeners
    this.bindInputs();

    // 11. Start Loop
    this.tick = this.tick.bind(this);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xdce9f0, 0x394536, 1.15);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffe4c2, 2.0);
    sunLight.position.set(35, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.radius = 4;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    const shadowD = 45;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    const ambLight = new THREE.AmbientLight(0xc4d2d8, 0.28);
    this.scene.add(ambLight);
  }

  /**
   * STEP 2 & STEP 3: Setup imported Knight.glb model and THREE.AnimationMixer
   */
  private setupPlayerCharacter() {
    const assetManager = AssetManager.getInstance();
    const clonedKnight = assetManager.cloneModel('knight');

    if (clonedKnight) {
      this.warriorMesh = clonedKnight;
      this.warriorMesh.name = 'Knight_Player_GLB';
      this.warriorMesh.scale.set(0.9, 0.9, 0.9);

      // Customize gear visibility on model nodes
      this.warriorMesh.traverse((child) => {
        const name = child.name;
        // Keep 1H_Sword and Badge_Shield, hide extra weapons
        if (['2H_Sword', '1H_Sword_Offhand', 'Rectangle_Shield', 'Round_Shield', 'Spike_Shield'].includes(name)) {
          child.visible = false;
        }
      });

      // Setup AnimationMixer
      this.playerMixer = new THREE.AnimationMixer(this.warriorMesh);
      const clips = assetManager.getAnimations('knight');

      console.log(`[GameEngine3D] Initialized Knight.glb with ${clips.length} skeletal animation clips:`, clips.map((c) => c.name));

      const idleClip = clips.find((c) => c.name === 'Idle') || clips[0];
      const walkClip = clips.find((c) => c.name === 'Walking_A') || clips[1];
      const runClip = clips.find((c) => c.name === 'Running_A') || walkClip;
      const attackClip = clips.find((c) => c.name === '1H_Melee_Attack_Chop') || clips.find((c) => c.name.includes('Attack'));

      if (idleClip) this.playerActions['idle'] = this.playerMixer.clipAction(idleClip);
      if (walkClip) this.playerActions['walk'] = this.playerMixer.clipAction(walkClip);
      if (runClip) this.playerActions['run'] = this.playerMixer.clipAction(runClip);
      if (attackClip) this.playerActions['attack'] = this.playerMixer.clipAction(attackClip);

      // Start in Idle
      if (this.playerActions['idle']) {
        this.playerActions['idle'].play();
      }
    } else {
      console.warn('[GameEngine3D] Knight.glb failed to clone! Creating root fallback group.');
      this.warriorMesh = new THREE.Group();
    }

    // Attach Whirlwind slash arc
    const arcGeo = new THREE.RingGeometry(0.8, 1.5, 24, 1, 0, Math.PI * 1.5);
    arcGeo.rotateX(-Math.PI / 2);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.slashArcMesh = new THREE.Mesh(arcGeo, arcMat);
    this.slashArcMesh.position.y = 1.0;
    this.warriorMesh.add(this.slashArcMesh);

    // Initial position
    this.warriorMesh.position.set((this.playerPos.x - 28) * 2.2, 0, (this.playerPos.y - 28) * 2.2);
    this.scene.add(this.warriorMesh);
  }

  private fadeToAction(nextActionName: string, duration = 0.2) {
    if (this.currentActionName === nextActionName) return;
    const prevAction = this.playerActions[this.currentActionName];
    const nextAction = this.playerActions[nextActionName];

    if (nextAction) {
      if (prevAction) prevAction.fadeOut(duration);
      nextAction.reset().fadeIn(duration).play();
      this.currentActionName = nextActionName;
    }
  }

  private setupTargetIndicator() {
    const targetGeo = new THREE.RingGeometry(0.8, 1.0, 24);
    targetGeo.rotateX(-Math.PI / 2);
    const targetMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.targetIndicator = new THREE.Mesh(targetGeo, targetMat);
    this.targetIndicator.visible = false;
    this.scene.add(this.targetIndicator);
  }

  /**
   * STEP 4: Build Town Terrain & Import GLB Buildings, Trees, Boulders
   */
  private buildTerrainAndTown() {
    const assetManager = AssetManager.getInstance();
    const worldSize = 56 * 2.2;

    // 1. Vast Ground Plane
    const groundGeo = new THREE.PlaneGeometry(worldSize * 1.5, worldSize * 1.5);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      map: getGrassTexture(),
      bumpMap: getGrassHeightTexture(),
      bumpScale: 0.075,
      roughness: 0.96,
    });
    getGrassTexture().anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    getGrassHeightTexture().anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Town Cobblestone Plaza
    const plazaGeo = new THREE.PlaneGeometry(48, 48);
    plazaGeo.rotateX(-Math.PI / 2);
    const plazaMat = new THREE.MeshStandardMaterial({
      map: getCobblestoneTexture(),
      bumpMap: getCobblestoneHeightTexture(),
      bumpScale: 0.16,
      roughness: 0.88,
    });
    getCobblestoneTexture().anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    getCobblestoneHeightTexture().anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(-20, 0.02, -20);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 3. Dirt Path
    const pathGeo = new THREE.PlaneGeometry(12, 60);
    pathGeo.rotateX(-Math.PI / 2);
    const pathMat = new THREE.MeshStandardMaterial({
      map: getDirtPathTexture(),
      bumpMap: getDirtPathHeightTexture(),
      bumpScale: 0.11,
      roughness: 0.98,
    });
    getDirtPathTexture().anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    getDirtPathHeightTexture().anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.position.set(10, 0.03, -15);
    path.rotation.y = Math.PI / 4;
    path.receiveShadow = true;
    this.scene.add(path);

    // 4. Central Town Fountain
    const fountain = createFountain3D();
    fountain.position.set(-26.4, 0, -26.4);
    this.scene.add(fountain);

    // 5. IMPORTED 3D GLB BUILDINGS
    const buildingsConfig = [
      { key: 'building_tavern', pos: [-42, 0, -44], scale: 2.2, rot: Math.PI / 6 },
      // Prefer detailed CC0 models when downloaded; keep original models as offline-safe fallbacks.
      { key: 'realistic_smithy', fallback: 'building_blacksmith', pos: [-44, 0, -18], scale: 0.55, fallbackScale: 2.2, rot: 0 },
      { key: 'realistic_cloister', fallback: 'building_church', pos: [-14, 0, -44], scale: 0.45, fallbackScale: 2.2, rot: -Math.PI / 4 },
      { key: 'building_market', pos: [-20, 0, -32], scale: 2.2, rot: Math.PI / 2 },
      { key: 'building_home_A', pos: [-15, 0, -14], scale: 2.2, rot: 0 },
      { key: 'building_home_B', pos: [-34, 0, -14], scale: 2.2, rot: Math.PI },
      { key: 'building_castle', pos: [-52, 0, -52], scale: 2.5, rot: Math.PI / 4 },
      { key: 'building_well', pos: [-22, 0, -26], scale: 2.0, rot: 0 },
    ];

    buildingsConfig.forEach((cfg) => {
      const fallbackKey = 'fallback' in cfg ? cfg.fallback : undefined;
      const model = assetManager.cloneModel(cfg.key) || (fallbackKey ? assetManager.cloneModel(fallbackKey) : null);
      if (model) {
        const fallbackScale = 'fallbackScale' in cfg ? cfg.fallbackScale : undefined;
        const selectedScale = assetManager.getGLTF(cfg.key) ? cfg.scale : (fallbackScale ?? cfg.scale);
        model.scale.set(selectedScale, selectedScale, selectedScale);
        model.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        model.rotation.y = cfg.rot;
        this.scene.add(model);
      }
    });

    // Separate medieval stone bell tower landmark; safely omitted until its GLB is downloaded.
    const bellTower = assetManager.cloneModel('realistic_bell_tower');
    if (bellTower) {
      bellTower.scale.setScalar(1.0);
      bellTower.position.set(-7, 0, -48);
      this.scene.add(bellTower);
    }

    // 6. Town Lamp Posts & Walls
    const lampCoords = [
      [-32, -32],
      [-20, -32],
      [-32, -20],
      [-20, -20],
      [-10, -26],
    ];
    lampCoords.forEach(([lx, lz]) => {
      const lamp = createLampPost3D();
      lamp.position.set(lx, 0, lz);
      this.scene.add(lamp);
    });

    for (let z = -50; z <= 2; z += 4) {
      if (z > -28 && z < -24) continue;
      const wall = createWallSection3D();
      wall.position.set(0, 0, z);
      wall.rotation.y = Math.PI / 2;
      this.scene.add(wall);
    }

    // 7. IMPORTED 3D GLB TREES & ROCKS
    const naturePositions = [
      { key: 'trees_A_large', pos: [15, 0, -40], scale: 2.2 },
      { key: 'trees_B_large', pos: [28, 0, -45], scale: 2.2 },
      { key: 'tree_single_A', pos: [22, 0, -35], scale: 2.0 },
      { key: 'tree_single_B', pos: [35, 0, -30], scale: 2.0 },
      { key: 'trees_A_large', pos: [42, 0, -42], scale: 2.2 },
      { key: 'tree_single_A', pos: [18, 0, -15], scale: 2.0 },
      { key: 'tree_single_B', pos: [32, 0, -22], scale: 2.0 },
      { key: 'trees_B_large', pos: [40, 0, -18], scale: 2.2 },
      { key: 'tree_single_A', pos: [20, 0, 12], scale: 2.0 },
      { key: 'trees_A_large', pos: [36, 0, 15], scale: 2.2 },
      { key: 'tree_single_B', pos: [24, 0, 30], scale: 2.0 },
      { key: 'rock_single_A', pos: [8, 0, -25], scale: 2.0 },
      { key: 'rock_single_B', pos: [20, 0, -5], scale: 2.0 },
      { key: 'rock_single_A', pos: [30, 0, 20], scale: 2.0 },
    ];

    naturePositions.forEach((n, idx) => {
      const model = assetManager.cloneModel(n.key);
      if (model) {
        model.scale.set(n.scale, n.scale, n.scale);
        model.position.set(n.pos[0], n.pos[1], n.pos[2]);
        model.rotation.y = (idx * 1.5) % Math.PI;
        this.scene.add(model);
      }
    });

    // 8. Ground-level environmental dressing (batched instancing keeps draw calls low)
    // Scatter small meadow stones and varied grass tufts outside the paved town center.
    // A seeded generator makes the layout stable between launches.
    let scatterSeed = 481516;
    const seededRandom = () => {
      scatterSeed = (scatterSeed * 1664525 + 1013904223) >>> 0;
      return scatterSeed / 4294967296;
    };

    const pebbleGeometry = new THREE.IcosahedronGeometry(0.22, 1);
    const pebbleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b887e,
      roughness: 0.96,
      metalness: 0.0,
    });
    const pebbleCount = 260;
    const pebbles = new THREE.InstancedMesh(pebbleGeometry, pebbleMaterial, pebbleCount);
    const pebbleDummy = new THREE.Object3D();
    let pebbleIndex = 0;

    const grassGeometry = new THREE.ConeGeometry(0.055, 0.42, 5);
    grassGeometry.translate(0, 0.21, 0);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x66834a,
      roughness: 1,
      metalness: 0,
    });
    const grassCount = 720;
    const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);
    const grassDummy = new THREE.Object3D();
    let grassIndex = 0;

    for (let i = 0; i < 1100; i++) {
      const x = (seededRandom() - 0.5) * 112;
      const z = (seededRandom() - 0.5) * 112;
      const inTownCore = x > -49 && x < 5 && z > -52 && z < 4;
      const nearMainPath = Math.abs((z + 15) - (x - 10)) < 8;
      if (inTownCore || nearMainPath) continue;

      if (pebbleIndex < pebbleCount && seededRandom() > 0.68) {
        const scale = 0.45 + seededRandom() * 1.25;
        pebbleDummy.position.set(x, 0.035, z);
        pebbleDummy.rotation.set(
          seededRandom() * 0.35,
          seededRandom() * Math.PI * 2,
          seededRandom() * 0.35
        );
        pebbleDummy.scale.set(scale, scale * (0.45 + seededRandom() * 0.35), scale);
        pebbleDummy.updateMatrix();
        pebbles.setMatrixAt(pebbleIndex, pebbleDummy.matrix);
        const shade = 0.72 + seededRandom() * 0.42;
        pebbles.setColorAt(pebbleIndex, new THREE.Color(shade, shade * 0.98, shade * 0.92));
        pebbleIndex++;
      }

      if (grassIndex < grassCount && seededRandom() > 0.28) {
        const scale = 0.55 + seededRandom() * 1.15;
        grassDummy.position.set(x, 0.015, z);
        grassDummy.rotation.set(0, seededRandom() * Math.PI * 2, 0);
        grassDummy.scale.set(scale, scale, scale);
        grassDummy.updateMatrix();
        grass.setMatrixAt(grassIndex, grassDummy.matrix);
        const green = 0.72 + seededRandom() * 0.45;
        grass.setColorAt(grassIndex, new THREE.Color(green * 0.72, green, green * 0.58));
        grassIndex++;
      }
    }

    pebbles.count = pebbleIndex;
    grass.count = grassIndex;
    pebbles.instanceMatrix.needsUpdate = true;
    grass.instanceMatrix.needsUpdate = true;
    if (pebbles.instanceColor) pebbles.instanceColor.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    pebbles.receiveShadow = true;
    grass.castShadow = false;
    grass.receiveShadow = true;
    this.scene.add(pebbles, grass);

    // 9. Mountain Rim
    const mountainGeo = new THREE.ConeGeometry(22, 38, 5);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.95,
      flatShading: true,
    });

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const dist = worldSize * 0.72;
      const mx = Math.cos(a) * dist;
      const mz = Math.sin(a) * dist;
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(mx, 12, mz);
      const ms = 0.9 + Math.sin(a * 4) * 0.3;
      m.scale.set(ms, ms * 1.2, ms);
      m.castShadow = true;
      this.scene.add(m);
    }
  }

  /**
   * STEP 5: Spawn Monsters using imported Skeleton and Creature GLB assets
   */
  private spawnMonsters() {
    const assetManager = AssetManager.getInstance();
    const rawSpawns = getInitialMonsterSpawns();
    const knightClips = assetManager.getAnimations('knight');

    rawSpawns.forEach((spawn, idx) => {
      const mobType = spawn.type as Monster3DEntity['type'];
      const cfg = MONSTER_CONFIGS[mobType];
      const wx = (spawn.x - 28) * 2.2;
      const wz = (spawn.y - 28) * 2.2;

      let modelKey = 'skeleton_warrior';
      let scale = 1.1;
      let aggroRad = 5.5;

      if (mobType === 'wolf') {
        modelKey = 'fox'; // Fox GLB for wolf
        scale = 0.025;
        aggroRad = 6.0;
      } else if (mobType === 'boar') {
        modelKey = 'skeleton_rogue';
        scale = 1.1;
        aggroRad = 5.0;
      } else if (mobType === 'goblin') {
        modelKey = 'skeleton_warrior';
        scale = 1.0;
        aggroRad = 7.0;
      } else if (mobType === 'viper') {
        modelKey = 'skeleton_mage';
        scale = 1.1;
        aggroRad = 5.5;
      } else {
        // Treant Boss -> Skeleton Golem GLB
        modelKey = 'skeleton_golem';
        scale = 1.8;
        aggroRad = 9.5;
      }

      const mobGroup = assetManager.cloneModel(modelKey) || new THREE.Group();
      mobGroup.scale.set(scale, scale, scale);
      mobGroup.position.set(wx, 0, wz);
      this.scene.add(mobGroup);

      // Animation Mixer for Monster
      let mixer: THREE.AnimationMixer | undefined;
      const actions: Record<string, THREE.AnimationAction> = {};

      if (modelKey === 'fox') {
        const foxClips = assetManager.getAnimations('fox');
        mixer = new THREE.AnimationMixer(mobGroup);
        const surveyClip = foxClips.find((c) => c.name === 'Survey') || foxClips[0];
        const runClip = foxClips.find((c) => c.name === 'Run') || foxClips[1];
        if (surveyClip) actions['idle'] = mixer.clipAction(surveyClip);
        if (runClip) actions['walk'] = mixer.clipAction(runClip);
        actions['idle']?.play();
      } else {
        // Skinned Skeleton models share the Knight skeleton bone tracks!
        mixer = new THREE.AnimationMixer(mobGroup);
        const idleClip = knightClips.find((c) => c.name === 'Idle') || knightClips[0];
        const walkClip = knightClips.find((c) => c.name === 'Walking_A') || knightClips[1];
        const attackClip = knightClips.find((c) => c.name === '1H_Melee_Attack_Chop') || knightClips[2];
        if (idleClip) actions['idle'] = mixer.clipAction(idleClip);
        if (walkClip) actions['walk'] = mixer.clipAction(walkClip);
        if (attackClip) actions['attack'] = mixer.clipAction(attackClip);
        actions['idle']?.play();
      }

      // Aggro Radius Ring
      const aggroRing = createAggroRing3D(aggroRad);
      aggroRing.mesh.position.set(wx, 0.05, wz);
      aggroRing.setVisible(this.showAggroRadius);
      this.scene.add(aggroRing.mesh);

      // Floating 3D Health Bar
      const hpBarGroup = new THREE.Group();
      hpBarGroup.position.y = mobType === 'treant' ? 3.8 : 2.0;

      const hpBgGeo = new THREE.PlaneGeometry(1.2, 0.16);
      const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
      const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
      hpBarGroup.add(hpBg);

      const hpFillGeo = new THREE.PlaneGeometry(1.16, 0.12);
      const hpFillMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      const hpBarFill = new THREE.Mesh(hpFillGeo, hpFillMat);
      hpBarFill.position.z = 0.01;
      hpBarGroup.add(hpBarFill);

      mobGroup.add(hpBarGroup);

      this.monsters.push({
        id: `mob_${mobType}_${idx}`,
        type: mobType,
        x: wx,
        z: wz,
        spawnX: wx,
        spawnZ: wz,
        hp: cfg.maxHp,
        maxHp: cfg.maxHp,
        attack: cfg.attack,
        defense: cfg.defense,
        moveSpeed: cfg.moveSpeed * 1.4,
        aggroRadius: aggroRad,
        isAggro: false,
        state: 'idle',
        animTimer: Math.random() * 10,
        attackCooldown: 0,
        deathTimer: 0,
        group: mobGroup,
        mixer,
        actions,
        currentAction: 'idle',
        aggroRing,
        hpBarGroup,
        hpBarFill,
      });
    });
  }

  private spawnNPCs() {
    this.npcs.forEach((npc) => {
      const wx = (npc.x - 28) * 2.2;
      const wz = (npc.y - 28) * 2.2;

      const npcMesh = createNPC3D(npc.role);
      npcMesh.position.set(wx, 0, wz);
      if (npc.direction === 'SE') npcMesh.rotation.y = -Math.PI / 4;
      if (npc.direction === 'SW') npcMesh.rotation.y = Math.PI / 4;
      if (npc.direction === 'S') npcMesh.rotation.y = 0;

      this.scene.add(npcMesh);
      this.npcMeshes.push(npcMesh);
    });
  }

  private bindInputs() {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerBasicAttack();
      } else if (e.key === '1') {
        this.triggerSkill(0);
      } else if (e.key === '2') {
        this.triggerSkill(1);
      } else if (e.key === '3') {
        this.triggerSkill(2);
      } else if (e.key === '4') {
        this.triggerSkill(3);
      } else if (e.key.toLowerCase() === 'q') {
        this.usePotion('health');
      } else if (e.key.toLowerCase() === 'e') {
        this.usePotion('mana');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    const dom = this.renderer.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[data-joystick]')) return;

      this.isOrbitDragging = true;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;

      this.handleRaycastSelect(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!this.isOrbitDragging) return;

      const dx = e.clientX - this.lastDragX;
      const dy = e.clientY - this.lastDragY;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;

      this.cameraYaw -= dx * 0.005;
      this.cameraPitch = Math.max(0.12, Math.min(1.2, this.cameraPitch + dy * 0.005));
    };

    const handlePointerUp = () => {
      this.isOrbitDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.cameraDistance = Math.max(4.0, Math.min(15.0, this.cameraDistance + e.deltaY * 0.01));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    this.cleanupInputs = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
    };
  }

  private cleanupInputs: () => void = () => {};

  private handleRaycastSelect(clientX: number, clientY: number) {
    const mouse = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // 1. Check NPC interaction
    for (const npc of this.npcs) {
      const wx = (npc.x - 28) * 2.2;
      const wz = (npc.y - 28) * 2.2;
      const dist = Math.hypot(wx - this.warriorMesh.position.x, wz - this.warriorMesh.position.z);
      if (dist < 4.0) {
        const hit = raycaster.intersectObjects(this.npcMeshes, true);
        if (hit.length > 0) {
          sound.playClick();
          this.onOpenDialogue?.(npc);
          return;
        }
      }
    }

    // 2. Check Monster Selection
    const monsterGroups = this.monsters.filter((m) => m.state !== 'dead').map((m) => m.group);
    const hits = raycaster.intersectObjects(monsterGroups, true);
    if (hits.length > 0) {
      let topObj: THREE.Object3D | null = hits[0].object;
      while (topObj && !this.monsters.some((m) => m.group === topObj)) {
        topObj = topObj.parent;
      }
      if (topObj) {
        const found = this.monsters.find((m) => m.group === topObj);
        if (found) {
          this.targetMonster = found;
          sound.playClick();
          return;
        }
      }
    }
  }

  public toggleAggroRadius(): boolean {
    this.showAggroRadius = !this.showAggroRadius;
    this.monsters.forEach((m) => m.aggroRing.setVisible(this.showAggroRadius));
    return this.showAggroRadius;
  }

  public setWeatherMode(mode: WeatherMode) {
    this.weather.setMode(mode);
  }

  public setJoystick(jx: number, jy: number) {
    this.joystickVec.x = jx;
    this.joystickVec.y = jy;
  }

  public setLanguage(lang: Language) {
    this.language = lang;
  }

  public triggerBasicAttack() {
    sound.playSword();
    this.fadeToAction('attack', 0.1);

    setTimeout(() => {
      this.fadeToAction(this.isPlayerWalking ? (this.keys['shift'] ? 'run' : 'walk') : 'idle', 0.2);
    }, 400);

    let target = this.targetMonster;
    if (!target || target.state === 'dead') {
      target = this.getClosestMonsterInRange(3.2);
    }

    if (target && target.state !== 'dead') {
      const dist = Math.hypot(
        target.x - this.warriorMesh.position.x,
        target.z - this.warriorMesh.position.z
      );
      if (dist <= 3.5) {
        this.dealDamageToMonster(target, 1.0);
      }
    }
  }

  public triggerSkill(index: number) {
    const skill = this.skills[index];
    if (!skill || skill.currentCooldown > 0) return;
    if (this.stats.mp < skill.mpCost) {
      this.addFloatingText(
        this.warriorMesh.position.x,
        1.8,
        this.warriorMesh.position.z,
        'No Mana!',
        '#60a5fa'
      );
      return;
    }

    this.stats.mp -= skill.mpCost;
    skill.currentCooldown = skill.cooldown;
    this.notifyUI();

    if (index === 0) {
      // 1. Whirlwind
      this.isWhirlwinding = true;
      if (this.slashArcMesh) {
        (this.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
      }
      sound.playWhirlwind();
      this.fadeToAction('attack', 0.1);

      setTimeout(() => {
        this.isWhirlwinding = false;
        if (this.slashArcMesh) {
          (this.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
        this.fadeToAction(this.isPlayerWalking ? (this.keys['shift'] ? 'run' : 'walk') : 'idle', 0.2);
      }, 450);

      this.monsters.forEach((m) => {
        if (m.state === 'dead') return;
        const d = Math.hypot(m.x - this.warriorMesh.position.x, m.z - this.warriorMesh.position.z);
        if (d <= 4.5) {
          this.dealDamageToMonster(m, 1.8);
        }
      });
    } else if (index === 1) {
      // 2. Thunder Dash
      sound.playDash();
      const target = this.targetMonster || this.getClosestMonsterInRange(7.0);
      if (target) {
        this.warriorMesh.position.x = target.x - Math.sin(this.warriorHeading) * 1.2;
        this.warriorMesh.position.z = target.z - Math.cos(this.warriorHeading) * 1.2;
        this.dealDamageToMonster(target, 1.5);
      }
    } else if (index === 2) {
      // 3. Dragon Roar
      sound.playRoar();
      this.roarBuffTimer = 12.0;
      this.addFloatingText(
        this.warriorMesh.position.x,
        2.2,
        this.warriorMesh.position.z,
        'WAR CRY! +35% ATK',
        '#f59e0b'
      );
    } else if (index === 3) {
      // 4. Heavenly Blade
      sound.playHoly();
      const target = this.targetMonster || this.getClosestMonsterInRange(8.0);
      const hitX = target ? target.x : this.warriorMesh.position.x;
      const hitZ = target ? target.z : this.warriorMesh.position.z;

      this.addFloatingText(hitX, 2.8, hitZ, 'HEAVENLY BLADE!', '#e0e7ff');

      this.monsters.forEach((m) => {
        if (m.state === 'dead') return;
        const d = Math.hypot(m.x - hitX, m.z - hitZ);
        if (d <= 5.0) {
          this.dealDamageToMonster(m, 3.0);
        }
      });
    }
  }

  public usePotion(type: 'health' | 'mana') {
    const id = type === 'health' ? 'health_potion' : 'mana_potion';
    const pot = this.inventory.find((i) => i.id === id);
    if (!pot || !pot.quantity || pot.quantity <= 0) return;

    sound.playPotion();
    pot.quantity--;
    if (pot.quantity <= 0) {
      this.inventory = this.inventory.filter((i) => i !== pot);
    }

    if (type === 'health') {
      const heal = Math.min(150, this.stats.maxHp - this.stats.hp);
      this.stats.hp += heal;
      this.addFloatingText(
        this.warriorMesh.position.x,
        1.8,
        this.warriorMesh.position.z,
        `+${heal} HP`,
        '#22c55e'
      );
    } else {
      const rest = Math.min(100, this.stats.maxMp - this.stats.mp);
      this.stats.mp += rest;
      this.addFloatingText(
        this.warriorMesh.position.x,
        1.8,
        this.warriorMesh.position.z,
        `+${rest} MP`,
        '#38bdf8'
      );
    }
    this.notifyUI();
  }

  private dealDamageToMonster(monster: Monster3DEntity, skillMultiplier: number) {
    let atk = this.stats.strength * 2 + 15;
    if (this.equipment.weapon?.attack) atk += this.equipment.weapon.attack;
    if (this.roarBuffTimer > 0) atk = Math.floor(atk * 1.35);

    const isCrit = Math.random() < this.stats.agility * 0.02 + 0.05;
    let dmg = Math.max(5, Math.floor((atk * skillMultiplier - monster.defense) * (0.85 + Math.random() * 0.3)));
    if (isCrit) dmg = Math.floor(dmg * 1.8);

    monster.hp = Math.max(0, monster.hp - dmg);
    monster.isAggro = true;
    monster.state = 'chase';
    monster.aggroRing.setAggro(true);

    this.addFloatingText(
      monster.x,
      1.5,
      monster.z,
      `${isCrit ? 'CRIT! ' : ''}-${dmg}`,
      isCrit ? '#f59e0b' : '#ef4444'
    );

    const hpRatio = monster.hp / monster.maxHp;
    monster.hpBarFill.scale.x = Math.max(0.001, hpRatio);
    monster.hpBarFill.position.x = -(1 - hpRatio) * 0.58;

    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  private killMonster(monster: Monster3DEntity) {
    monster.state = 'dead';
    monster.deathTimer = 10.0;
    monster.group.visible = false;
    monster.aggroRing.setVisible(false);

    const cfg = MONSTER_CONFIGS[monster.type];
    const expReward = Math.floor(cfg.expReward * (this.elderBlessing ? 1.2 : 1.0));
    const goldDrop = Math.floor(cfg.goldMin + Math.random() * (cfg.goldMax - cfg.goldMin));
    const xCoinsDrop = Math.random() < cfg.xCoinsDropChance ? (monster.type === 'treant' ? 5 : 1) : 0;

    this.stats.kills++;
    this.addExp(expReward);
    this.stats.gold += goldDrop;
    this.stats.xCoins += xCoinsDrop;

    this.spawnLoot(monster.x, monster.z, goldDrop, xCoinsDrop);

    this.quests.forEach((q) => {
      if (q.status === 'in_progress' && q.targetMonster === monster.type) {
        q.currentCount = Math.min(q.targetCount, q.currentCount + 1);
        if (q.currentCount >= q.targetCount) {
          q.status = 'ready_to_claim';
          this.onChatMessage?.({
            id: generateUniqueMsgId('quest_done'),
            timestamp: new Date().toLocaleTimeString(),
            text: t(this.language, 'logQuestCompleted', { quest: t(this.language, q.titleKey as any) }),
            type: 'quest',
          });
        }
      }
    });

    this.onChatMessage?.({
      id: generateUniqueMsgId('kill'),
      timestamp: new Date().toLocaleTimeString(),
      text: t(this.language, 'logDefeated', {
        target: t(this.language, cfg.nameKey as any),
        exp: expReward,
        gold: goldDrop,
      }),
      type: 'combat',
    });

    this.notifyUI();
  }

  private spawnLoot(x: number, z: number, gold: number, xCoins: number) {
    const group = new THREE.Group();
    group.position.set(x, 0.35, z);

    const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshBasicMaterial({ color: xCoins > 0 ? 0x38bdf8 : 0xf59e0b });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    group.add(coinMesh);

    this.scene.add(group);
    this.lootEntities.push({
      id: `loot_${Date.now()}_${Math.random()}`,
      x,
      z,
      item: { id: 'gold', nameKey: 'gold', descKey: 'gold', type: 'material', rarity: 'common', icon: '🪙', levelReq: 1, buyPriceGold: 0, sellPriceGold: 0 },
      goldAmount: gold,
      xCoinsAmount: xCoins,
      group,
      rotSpeed: 3.0,
    });
  }

  public addItemToInventory(item: Item) {
    const existing = this.inventory.find((i) => i.id === item.id);
    if (existing && existing.quantity) {
      existing.quantity += item.quantity || 1;
    } else {
      this.inventory.push({ ...item, quantity: item.quantity || 1 });
    }
    this.notifyUI();
  }

  public toggleWeather(): WeatherMode {
    const modes: WeatherMode[] = ['rain', 'snow', 'clear'];
    const nextIdx = (modes.indexOf(this.weather.mode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    this.weather.setMode(nextMode);
    return nextMode;
  }

  public addFloatingText(
    x: number,
    arg2: number,
    arg3: string | number,
    arg4?: string,
    arg5?: string | number
  ) {
    let y = 1.8;
    let z = 0;
    let text = '';
    let color = '#fbbf24';

    if (typeof arg3 === 'string') {
      z = (arg2 - 28) * 2.2;
      text = arg3;
      color = arg4 || '#fbbf24';
    } else {
      y = arg2;
      z = arg3;
      text = (arg4 as string) || '';
      color = (arg5 as string) || '#fbbf24';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 130, 34);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.0, 0.5, 1.0);
    sprite.position.set(x, y, z);
    this.scene.add(sprite);

    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      x,
      y,
      z,
      text,
      color,
      life: 0,
      maxLife: 1.2,
      vy: 1.2,
      canvas,
      sprite,
    });
  }

  public addExp(amount: number) {
    this.stats.exp += amount;
    while (this.stats.exp >= this.stats.maxExp) {
      this.stats.exp -= this.stats.maxExp;
      this.stats.level++;
      this.stats.maxExp = Math.floor(this.stats.maxExp * 1.5);
      this.stats.statPoints += 5;
      this.stats.maxHp += 25;
      this.stats.hp = this.stats.maxHp;
      this.stats.maxMp += 15;
      this.stats.mp = this.stats.maxMp;
      sound.playLevelUp();
      this.addFloatingText(
        this.warriorMesh.position.x,
        2.5,
        this.warriorMesh.position.z,
        `LEVEL UP! Lv.${this.stats.level}`,
        '#fbbf24'
      );
    }
    this.notifyUI();
  }

  private getClosestMonsterInRange(range: number): Monster3DEntity | null {
    let closest: Monster3DEntity | null = null;
    let minD = range;
    this.monsters.forEach((m) => {
      if (m.state === 'dead') return;
      const d = Math.hypot(m.x - this.warriorMesh.position.x, m.z - this.warriorMesh.position.z);
      if (d < minD) {
        minD = d;
        closest = m;
      }
    });
    return closest;
  }

  public notifyUI() {
    this.onStatsUpdate?.({ ...this.stats });
    this.onInventoryUpdate?.([...this.inventory], { ...this.equipment });
    this.onQuestsUpdate?.([...this.quests]);
  }

  public equipItem(item: Item) {
    if (this.stats.level < item.levelReq) return;
    sound.playClick();
    const slot = item.type as keyof Equipment;
    if (this.equipment[slot]) {
      this.inventory.push(this.equipment[slot]!);
    }
    this.equipment[slot] = item;
    this.inventory = this.inventory.filter((i) => i !== item);
    this.recalculateStats();
    this.notifyUI();
  }

  public unequipItem(slot: keyof Equipment) {
    if (!this.equipment[slot]) return;
    sound.playClick();
    this.inventory.push(this.equipment[slot]!);
    this.equipment[slot] = null;
    this.recalculateStats();
    this.notifyUI();
  }

  public buyItem(item: Item) {
    if (this.stats.gold < item.buyPriceGold) return;
    sound.playClick();
    this.stats.gold -= item.buyPriceGold;
    const existing = this.inventory.find((i) => i.id === item.id);
    if (existing && existing.quantity) {
      existing.quantity++;
    } else {
      this.inventory.push({ ...item, quantity: 1 });
    }
    this.notifyUI();
  }

  public sellItem(item: Item) {
    sound.playClick();
    this.stats.gold += item.sellPriceGold;
    if (item.quantity && item.quantity > 1) {
      item.quantity--;
    } else {
      this.inventory = this.inventory.filter((i) => i !== item);
    }
    this.notifyUI();
  }

  private recalculateStats() {
    let bonusHp = 0;
    let bonusMp = 0;
    Object.values(this.equipment).forEach((eq) => {
      if (eq?.hpBonus) bonusHp += eq.hpBonus;
      if (eq?.mpBonus) bonusMp += eq.mpBonus;
    });
    this.stats.maxHp = 100 + this.stats.vitality * 20 + bonusHp;
    this.stats.maxMp = 50 + this.stats.spirit * 15 + bonusMp;
  }

  /**
   * Main 60 FPS Engine Tick Loop
   */
  private tick() {
    if (this.isDestroyed) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    // Profiler
    this.frameCount++;
    if (now - this.lastFpsTime >= 500) {
      this.measuredFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameTimeMs = parseFloat((dt * 1000).toFixed(1));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    // 1. Update Player Movement (WASD + Mobile Joystick)
    this.updatePlayerMovement(dt);

    // 2. Update Third-Person Camera Follow
    this.updateCameraFollow(dt);

    // 3. Update Player Animation Mixer
    if (this.playerMixer) {
      this.playerMixer.update(dt);
    }

    // 4. Update Monsters AI & Mixers
    this.updateMonsters(dt);

    // 5. Update Loot Pickup
    this.updateLoot(dt);

    // 6. Update Floating Combat Texts
    this.updateFloatingTexts(dt);

    // 7. Update Skills Cooldown & Buffs
    this.skills.forEach((s) => {
      if (s.currentCooldown > 0) {
        s.currentCooldown = Math.max(0, s.currentCooldown - dt);
      }
    });
    if (this.roarBuffTimer > 0) {
      this.roarBuffTimer = Math.max(0, this.roarBuffTimer - dt);
    }

    // 8. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame(this.tick);
  }

  private updatePlayerMovement(dt: number) {
    let inputX = 0;
    let inputZ = 0;

    if (this.keys['w'] || this.keys['arrowup']) inputZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) inputZ += 1;
    if (this.keys['a'] || this.keys['arrowleft']) inputX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) inputX += 1;

    if (Math.abs(this.joystickVec.x) > 0.05 || Math.abs(this.joystickVec.y) > 0.05) {
      inputX += this.joystickVec.x;
      inputZ += this.joystickVec.y;
    }

    const inputLen = Math.hypot(inputX, inputZ);
    if (inputLen > 0.05) {
      this.isPlayerWalking = true;
      const normX = inputX / Math.max(1, inputLen);
      const normZ = inputZ / Math.max(1, inputLen);

      const camForwardX = -Math.sin(this.cameraYaw);
      const camForwardZ = -Math.cos(this.cameraYaw);
      const camRightX = Math.cos(this.cameraYaw);
      const camRightZ = -Math.sin(this.cameraYaw);

      const moveX = camRightX * normX + camForwardX * -normZ;
      const moveZ = camRightZ * normX + camForwardZ * -normZ;

      const baseSpeed = 4.8 + this.stats.agility * 0.15;
      const speed = this.roarBuffTimer > 0 ? baseSpeed * 1.25 : baseSpeed;

      this.warriorMesh.position.x += moveX * speed * dt;
      this.warriorMesh.position.z += moveZ * speed * dt;

      const bound = 54 * 1.1;
      this.warriorMesh.position.x = Math.max(-bound, Math.min(bound, this.warriorMesh.position.x));
      this.warriorMesh.position.z = Math.max(-bound, Math.min(bound, this.warriorMesh.position.z));

      const targetAngle = Math.atan2(moveX, moveZ);
      let diff = targetAngle - this.warriorHeading;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.warriorHeading += diff * 0.25;
      this.warriorMesh.rotation.y = this.warriorHeading;

      if (this.currentActionName !== 'attack') {
        this.fadeToAction((this.keys['shift'] || Math.hypot(this.joystickVec.x, this.joystickVec.y) > 0.88) ? 'run' : 'walk');
      }
    } else {
      this.isPlayerWalking = false;
      if (this.currentActionName !== 'attack') {
        this.fadeToAction('idle');
      }
    }

    this.playerPos.x = this.warriorMesh.position.x / 2.2 + 28;
    this.playerPos.y = this.warriorMesh.position.z / 2.2 + 28;
  }

  private updateCameraFollow(dt: number) {
    const px = this.warriorMesh.position.x;
    const py = this.warriorMesh.position.y;
    const pz = this.warriorMesh.position.z;

    const targetCamX = px + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const targetCamY = py + 1.4 + Math.sin(this.cameraPitch) * this.cameraDistance;
    const targetCamZ = pz + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    // Frame-rate-independent smoothing keeps the follow camera consistent on mobile and desktop.
    const cameraDamping = 1 - Math.exp(-7.5 * Math.max(0, dt));
    this.camera.position.x += (targetCamX - this.camera.position.x) * cameraDamping;
    this.camera.position.y += (targetCamY - this.camera.position.y) * cameraDamping;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * cameraDamping;

    this.camera.lookAt(px, py + 0.9, pz);
  }

  private updateMonsters(dt: number) {
    const px = this.warriorMesh.position.x;
    const pz = this.warriorMesh.position.z;

    this.monsters.forEach((m) => {
      if (m.mixer) {
        m.mixer.update(dt);
      }

      if (m.state === 'dead') {
        m.deathTimer -= dt;
        if (m.deathTimer <= 0) {
          m.state = 'idle';
          m.hp = m.maxHp;
          m.group.position.set(m.spawnX, 0, m.spawnZ);
          m.x = m.spawnX;
          m.z = m.spawnZ;
          m.group.visible = true;
          m.aggroRing.mesh.position.set(m.spawnX, 0.05, m.spawnZ);
          m.aggroRing.setAggro(false);
          m.aggroRing.setVisible(this.showAggroRadius);
          m.hpBarFill.scale.x = 1.0;
          m.hpBarFill.position.x = 0;
        }
        return;
      }

      m.animTimer += dt;
      const distToPlayer = Math.hypot(px - m.x, pz - m.z);

      if (distToPlayer <= m.aggroRadius) {
        if (!m.isAggro) {
          m.isAggro = true;
          m.state = 'chase';
          m.aggroRing.setAggro(true);
        }
      } else if (distToPlayer > m.aggroRadius * 1.5 && m.isAggro) {
        m.isAggro = false;
        m.state = 'patrol';
        m.aggroRing.setAggro(false);
      }

      m.aggroRing.mesh.position.set(m.x, 0.05, m.z);

      if (m.state === 'chase') {
        const attackRange = m.type === 'treant' ? 2.5 : 1.8;
        if (distToPlayer > attackRange) {
          const dirX = (px - m.x) / distToPlayer;
          const dirZ = (pz - m.z) / distToPlayer;
          m.x += dirX * m.moveSpeed * dt;
          m.z += dirZ * m.moveSpeed * dt;
          m.group.position.set(m.x, 0, m.z);
          m.group.rotation.y = Math.atan2(dirX, dirZ);

          if (m.actions && m.currentAction !== 'walk' && m.actions['walk']) {
            m.actions[m.currentAction!]?.fadeOut(0.2);
            m.actions['walk'].reset().fadeIn(0.2).play();
            m.currentAction = 'walk';
          }
        } else {
          m.state = 'attack';
        }
      } else if (m.state === 'attack') {
        m.attackCooldown -= dt;
        if (m.actions && m.currentAction !== 'attack' && m.actions['attack']) {
          m.actions[m.currentAction!]?.fadeOut(0.1);
          m.actions['attack'].reset().fadeIn(0.1).play();
          m.currentAction = 'attack';
        }

        if (m.attackCooldown <= 0) {
          m.attackCooldown = 1.4;
          let monsterDmg = Math.max(3, m.attack - (this.equipment.armor?.defense || 0));
          this.stats.hp = Math.max(0, this.stats.hp - monsterDmg);
          sound.playHit();
          this.addFloatingText(px, 1.8, pz, `-${monsterDmg}`, '#dc2626');
          this.notifyUI();

          if (this.stats.hp <= 0) {
            this.stats.hp = this.stats.maxHp;
            this.warriorMesh.position.set(-26.4, 0, -26.4);
            this.addFloatingText(-26.4, 2.0, -26.4, 'Revived at Town Fountain!', '#38bdf8');
            this.notifyUI();
          }
        }

        if (distToPlayer > (m.type === 'treant' ? 3.0 : 2.2)) {
          m.state = 'chase';
        }
      } else {
        const distToSpawn = Math.hypot(m.spawnX - m.x, m.spawnZ - m.z);
        if (distToSpawn > 0.5) {
          const dirX = (m.spawnX - m.x) / distToSpawn;
          const dirZ = (m.spawnZ - m.z) / distToSpawn;
          m.x += dirX * (m.moveSpeed * 0.4) * dt;
          m.z += dirZ * (m.moveSpeed * 0.4) * dt;
          m.group.position.set(m.x, 0, m.z);
          m.group.rotation.y = Math.atan2(dirX, dirZ);

          if (m.actions && m.currentAction !== 'walk' && m.actions['walk']) {
            m.actions[m.currentAction!]?.fadeOut(0.2);
            m.actions['walk'].reset().fadeIn(0.2).play();
            m.currentAction = 'walk';
          }
        } else {
          if (m.actions && m.currentAction !== 'idle' && m.actions['idle']) {
            m.actions[m.currentAction!]?.fadeOut(0.2);
            m.actions['idle'].reset().fadeIn(0.2).play();
            m.currentAction = 'idle';
          }
        }
      }

      m.hpBarGroup.quaternion.copy(this.camera.quaternion);
    });

    if (this.targetMonster && this.targetMonster.state !== 'dead') {
      this.targetIndicator.visible = true;
      this.targetIndicator.position.set(this.targetMonster.x, 0.06, this.targetMonster.z);
    } else {
      this.targetIndicator.visible = false;
    }
  }

  private updateLoot(dt: number) {
    const px = this.warriorMesh.position.x;
    const pz = this.warriorMesh.position.z;

    for (let i = this.lootEntities.length - 1; i >= 0; i--) {
      const loot = this.lootEntities[i];
      loot.group.rotation.y += loot.rotSpeed * dt;

      const d = Math.hypot(px - loot.x, pz - loot.z);
      if (d <= 1.8) {
        sound.playCoin();
        if (loot.goldAmount) {
          this.addFloatingText(px, 1.2, pz, `+${loot.goldAmount} Gold`, '#f59e0b');
        }
        if (loot.xCoinsAmount) {
          this.addFloatingText(px, 1.6, pz, `+${loot.xCoinsAmount} X Coins`, '#38bdf8');
        }
        this.scene.remove(loot.group);
        this.lootEntities.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y += ft.vy * dt;
      ft.sprite.position.y = ft.y;
      ft.sprite.material.opacity = Math.max(0, 1 - ft.life / ft.maxLife);

      if (ft.life >= ft.maxLife) {
        this.scene.remove(ft.sprite);
        ft.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    this.cleanupInputs();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
