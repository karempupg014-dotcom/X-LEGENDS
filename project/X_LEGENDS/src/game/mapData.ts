import { NPCEntity, MonsterConfig } from './types';

export const MAP_WIDTH = 56;
export const MAP_HEIGHT = 56;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export enum TileType {
  GRASS = 0,
  TOWN_STONE = 1,
  TOWN_PLAZA = 2,
  DIRT_PATH = 3,
  WATER = 4,
  FLOWER_GRASS = 5,
  DARK_GRASS = 6,
}

export enum ObjectType {
  NONE = 0,
  TREE_OAK = 1,
  TREE_PINE = 2,
  FOUNTAIN = 3,
  BUILDING_HOUSE = 4,
  BUILDING_FORGE = 5,
  BUILDING_TAVERN = 6,
  LAMP_POST = 7,
  STONE_FENCE = 8,
  MUSHROOM_CLUSTER = 9,
  BARREL = 10,
  MARKET_STALL = 11,
  TOWN_GATE = 12,
  ANVIL = 13,
  BOULDER = 14,
}

export interface MapObject {
  x: number;
  y: number;
  type: ObjectType;
  solid: boolean;
  width?: number;
  height?: number;
}

export const MONSTER_CONFIGS: Record<string, MonsterConfig> = {
  wolf: {
    type: 'wolf',
    nameKey: 'monsterWolf',
    level: 1,
    maxHp: 80,
    attack: 14,
    defense: 4,
    moveSpeed: 2.2,
    attackSpeed: 1.1,
    expReward: 35,
    goldMin: 12,
    goldMax: 28,
    xCoinsDropChance: 0.1,
    size: 26,
    color: '#64748b',
    accentColor: '#94a3b8',
    dropTable: ['wolf_pelt', 'health_potion'],
  },
  boar: {
    type: 'boar',
    nameKey: 'monsterBoar',
    level: 2,
    maxHp: 130,
    attack: 19,
    defense: 8,
    moveSpeed: 1.8,
    attackSpeed: 1.3,
    expReward: 55,
    goldMin: 20,
    goldMax: 42,
    xCoinsDropChance: 0.15,
    size: 28,
    color: '#78350f',
    accentColor: '#b45309',
    dropTable: ['boar_meat', 'iron_helm', 'health_potion'],
  },
  goblin: {
    type: 'goblin',
    nameKey: 'monsterGoblin',
    level: 3,
    maxHp: 180,
    attack: 26,
    defense: 12,
    moveSpeed: 2.5,
    attackSpeed: 0.9,
    expReward: 85,
    goldMin: 35,
    goldMax: 65,
    xCoinsDropChance: 0.25,
    size: 24,
    color: '#15803d',
    accentColor: '#86efac',
    dropTable: ['goblin_dagger', 'mana_potion', 'speed_elixir'],
  },
  viper: {
    type: 'viper',
    nameKey: 'monsterViper',
    level: 4,
    maxHp: 240,
    attack: 34,
    defense: 14,
    moveSpeed: 2.0,
    attackSpeed: 1.2,
    expReward: 120,
    goldMin: 50,
    goldMax: 90,
    xCoinsDropChance: 0.35,
    size: 25,
    color: '#b91c1c',
    accentColor: '#f87171',
    dropTable: ['viper_venom', 'ruby_ring', 'health_potion', 'mana_potion'],
  },
  treant: {
    type: 'treant',
    nameKey: 'monsterTreant',
    level: 6,
    maxHp: 650,
    attack: 48,
    defense: 25,
    moveSpeed: 1.4,
    attackSpeed: 1.6,
    expReward: 350,
    goldMin: 180,
    goldMax: 320,
    xCoinsDropChance: 1.0, // Guaranteed 3-8 X Coins!
    size: 44,
    color: '#2d6a4f',
    accentColor: '#d97706',
    dropTable: ['treant_core', 'treant_plate', 'dragonfang_sword', 'amulet_life'],
  },
};

export const INITIAL_NPCS: NPCEntity[] = [
  {
    id: 'npc_captain',
    nameKey: 'npcCaptainName',
    titleKey: 'npcCaptainTitle',
    x: 25,
    y: 17,
    direction: 'SW',
    role: 'guard',
    dialogueKey: 'npcCaptainDialog',
    questId: 'quest_boars',
    icon: '🛡️',
  },
  {
    id: 'npc_elena',
    nameKey: 'npcElenaName',
    titleKey: 'npcElenaTitle',
    x: 13,
    y: 11,
    direction: 'SE',
    role: 'alchemist',
    dialogueKey: 'npcElenaDialog',
    questId: 'quest_vipers',
    icon: '🧪',
  },
  {
    id: 'npc_gareth',
    nameKey: 'npcGarethName',
    titleKey: 'npcGarethTitle',
    x: 9,
    y: 21,
    direction: 'SE',
    role: 'blacksmith',
    dialogueKey: 'npcGarethDialog',
    questId: 'quest_treant',
    icon: '⚒️',
  },
  {
    id: 'npc_elder',
    nameKey: 'npcElderName',
    titleKey: 'npcElderTitle',
    x: 17,
    y: 17,
    direction: 'S',
    role: 'elder',
    dialogueKey: 'npcElderDialog',
    icon: '🧙‍♂️',
  },
];

// Generate world tile matrix and static objects
export function generateMapData(): {
  tiles: TileType[][];
  collision: boolean[][];
  objects: MapObject[];
} {
  const tiles: TileType[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => TileType.GRASS)
  );

  const collision: boolean[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => false)
  );

  const objects: MapObject[] = [];

  // 1. Fill ground tiles
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Map boundaries are solid walls
      if (x <= 1 || x >= MAP_WIDTH - 2 || y <= 1 || y >= MAP_HEIGHT - 2) {
        collision[y][x] = true;
        continue;
      }

      // Town Zone: X from 4 to 26, Y from 4 to 26
      if (x >= 4 && x <= 26 && y >= 4 && y <= 26) {
        // Plaza area
        if (x >= 12 && x <= 20 && y >= 12 && y <= 20) {
          tiles[y][x] = TileType.TOWN_PLAZA;
        } else if (
          // Main paths
          (x >= 15 && x <= 17) ||
          (y >= 15 && y <= 17) ||
          (x >= 24 && y >= 15 && y <= 17) // east road
        ) {
          tiles[y][x] = TileType.TOWN_STONE;
        } else {
          tiles[y][x] = TileType.TOWN_STONE;
        }
      } else {
        // Forest Zone
        // Winding dirt path leading into forest
        const isPath =
          (x >= 26 && x <= 46 && y >= 15 && y <= 17) ||
          (x >= 36 && x <= 38 && y >= 17 && y <= 40) ||
          (x >= 38 && x <= 48 && y >= 32 && y <= 34);

        if (isPath) {
          tiles[y][x] = TileType.DIRT_PATH;
        } else if ((x + y * 7) % 5 === 0) {
          tiles[y][x] = TileType.FLOWER_GRASS;
        } else if ((x * 3 + y) % 6 === 0) {
          tiles[y][x] = TileType.DARK_GRASS;
        } else {
          tiles[y][x] = TileType.GRASS;
        }
      }
    }
  }

  // 2. Town Buildings and Props
  // Town Central Fountain at (16, 16)
  objects.push({ x: 16, y: 16, type: ObjectType.FOUNTAIN, solid: true, width: 2, height: 2 });
  collision[16][16] = true;
  collision[16][17] = true;
  collision[17][16] = true;
  collision[17][17] = true;

  // Town Tavern / House at (8, 7)
  objects.push({ x: 8, y: 7, type: ObjectType.BUILDING_TAVERN, solid: true, width: 4, height: 4 });
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      collision[7 + dy][8 + dx] = true;
    }
  }

  // Alchemist Shop / Stall at (14, 9)
  objects.push({ x: 14, y: 9, type: ObjectType.MARKET_STALL, solid: true, width: 2, height: 2 });
  collision[9][14] = true;
  collision[9][15] = true;
  collision[10][14] = true;
  collision[10][15] = true;

  // Blacksmith Forge at (7, 19)
  objects.push({ x: 7, y: 19, type: ObjectType.BUILDING_FORGE, solid: true, width: 4, height: 3 });
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      collision[19 + dy][7 + dx] = true;
    }
  }
  // Anvil outside forge
  objects.push({ x: 9, y: 22, type: ObjectType.ANVIL, solid: true });
  collision[22][9] = true;

  // Residential Houses
  objects.push({ x: 21, y: 7, type: ObjectType.BUILDING_HOUSE, solid: true, width: 3, height: 3 });
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      collision[7 + dy][21 + dx] = true;
    }
  }

  objects.push({ x: 20, y: 21, type: ObjectType.BUILDING_HOUSE, solid: true, width: 3, height: 3 });
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      collision[21 + dy][20 + dx] = true;
    }
  }

  // Town Lamp Posts
  const lampPositions = [
    { x: 13, y: 14 },
    { x: 19, y: 14 },
    { x: 13, y: 19 },
    { x: 19, y: 19 },
    { x: 23, y: 15 },
    { x: 23, y: 18 },
  ];
  lampPositions.forEach((pos) => {
    objects.push({ x: pos.x, y: pos.y, type: ObjectType.LAMP_POST, solid: true });
    collision[pos.y][pos.x] = true;
  });

  // Town Stone Walls & Gates
  // East wall at X = 27
  for (let y = 4; y <= 26; y++) {
    // Leave gate gap at y = 15, 16, 17
    if (y < 15 || y > 17) {
      objects.push({ x: 27, y, type: ObjectType.STONE_FENCE, solid: true });
      collision[y][27] = true;
    } else if (y === 15) {
      objects.push({ x: 27, y: 16, type: ObjectType.TOWN_GATE, solid: false });
    }
  }

  // South wall at Y = 27
  for (let x = 4; x <= 27; x++) {
    objects.push({ x, y: 27, type: ObjectType.STONE_FENCE, solid: true });
    collision[27][x] = true;
  }

  // 3. Forest Objects (Trees, Rocks, Mushrooms)
  // Procedural natural placement for wildwoods
  for (let y = 3; y < MAP_HEIGHT - 3; y += 2) {
    for (let x = 29; x < MAP_WIDTH - 3; x += 2) {
      // Don't place on paths
      if (tiles[y][x] === TileType.DIRT_PATH || tiles[y + 1]?.[x] === TileType.DIRT_PATH) {
        continue;
      }

      // Boss clearing at (44, 42)
      if (Math.hypot(x - 44, y - 42) < 5) {
        continue;
      }
      // Monster clearing 1 (Wolves) around (33, 10)
      if (Math.hypot(x - 33, y - 10) < 4) {
        continue;
      }
      // Monster clearing 2 (Boars) around (34, 25)
      if (Math.hypot(x - 34, y - 25) < 4) {
        continue;
      }
      // Monster clearing 3 (Goblins) around (44, 20)
      if (Math.hypot(x - 44, y - 20) < 4) {
        continue;
      }
      // Monster clearing 4 (Vipers) around (42, 34)
      if (Math.hypot(x - 42, y - 34) < 4) {
        continue;
      }

      const seed = (x * 17 + y * 31) % 100;
      if (seed < 36) {
        // Oak Tree
        objects.push({ x, y, type: ObjectType.TREE_OAK, solid: true });
        collision[y][x] = true;
      } else if (seed < 58) {
        // Pine Tree
        objects.push({ x, y, type: ObjectType.TREE_PINE, solid: true });
        collision[y][x] = true;
      } else if (seed < 70) {
        // Mossy Boulder
        objects.push({ x, y, type: ObjectType.BOULDER, solid: true });
        collision[y][x] = true;
      } else if (seed < 82) {
        // Mushroom Cluster (walkable)
        objects.push({ x, y, type: ObjectType.MUSHROOM_CLUSTER, solid: false });
      }
    }
  }

  return { tiles, collision, objects };
}

// Initial monster spawns across the forest
export function getInitialMonsterSpawns(): Array<{
  type: string;
  x: number;
  y: number;
}> {
  return [
    // Wolves (Outer Forest: Lv 1)
    { type: 'wolf', x: 31, y: 9 },
    { type: 'wolf', x: 33, y: 11 },
    { type: 'wolf', x: 35, y: 8 },
    { type: 'wolf', x: 32, y: 13 },

    // Wild Boars (Meadow: Lv 2)
    { type: 'boar', x: 33, y: 24 },
    { type: 'boar', x: 35, y: 26 },
    { type: 'boar', x: 32, y: 28 },
    { type: 'boar', x: 36, y: 23 },

    // Shadow Goblins (Ruins: Lv 3)
    { type: 'goblin', x: 43, y: 18 },
    { type: 'goblin', x: 45, y: 21 },
    { type: 'goblin', x: 42, y: 22 },
    { type: 'goblin', x: 46, y: 19 },

    // Crimson Vipers (Marsh: Lv 4)
    { type: 'viper', x: 41, y: 33 },
    { type: 'viper', x: 43, y: 35 },
    { type: 'viper', x: 40, y: 36 },
    { type: 'viper', x: 44, y: 32 },

    // Corrupted Treant (Deep Grove Boss: Lv 6)
    { type: 'treant', x: 44, y: 42 },
  ];
}
