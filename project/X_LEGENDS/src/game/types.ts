export type Language = 'ar' | 'en';

export type GameState = 'TITLE_SCREEN' | 'PLAYING' | 'PAUSED';

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ItemType = 'weapon' | 'helmet' | 'armor' | 'boots' | 'ring' | 'amulet' | 'consumable' | 'material';

export interface Item {
  id: string;
  nameKey: string;
  descKey: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  levelReq: number;
  attack?: number;
  defense?: number;
  hpBonus?: number;
  mpBonus?: number;
  healHp?: number;
  restoreMp?: number;
  speedBonus?: number;
  buyPriceGold: number;
  buyPriceXCoins?: number;
  sellPriceGold: number;
  quantity?: number;
}

export interface Equipment {
  weapon: Item | null;
  helmet: Item | null;
  armor: Item | null;
  boots: Item | null;
  ring: Item | null;
  amulet: Item | null;
}

export interface PlayerStats {
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  statPoints: number;
  strength: number; // Boosts Attack
  agility: number;   // Boosts Attack Speed & Crit Rate
  vitality: number;  // Boosts HP & Defense
  spirit: number;    // Boosts MP & Skill Power
  gold: number;
  xCoins: number;
  kills: number;
}

export type MonsterType = 'wolf' | 'boar' | 'goblin' | 'viper' | 'treant';

export interface MonsterConfig {
  type: MonsterType;
  nameKey: string;
  level: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackSpeed: number;
  expReward: number;
  goldMin: number;
  goldMax: number;
  xCoinsDropChance: number;
  size: number;
  color: string;
  accentColor: string;
  dropTable: string[]; // item ids
}

export interface MonsterEntity {
  id: string;
  type: MonsterType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  spawnX: number;
  spawnY: number;
  hp: number;
  maxHp: number;
  direction: Direction;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
  animTimer: number;
  attackCooldown: number;
  hitFlashTimer: number;
  isAggro: boolean;
  deathTimer: number;
}

export interface NPCEntity {
  id: string;
  nameKey: string;
  titleKey: string;
  x: number;
  y: number;
  direction: Direction;
  role: 'guard' | 'alchemist' | 'blacksmith' | 'elder';
  dialogueKey: string;
  questId?: string;
  icon: string;
}

export interface LootEntity {
  id: string;
  x: number;
  y: number;
  item: Item;
  goldAmount?: number;
  xCoinsAmount?: number;
  spawnTime: number;
  elevation: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  opacity: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'spark' | 'ring';
}

export interface Skill {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  mpCost: number;
  cooldown: number; // in seconds
  currentCooldown: number;
  range: number;
  keybind: string;
}

export interface Quest {
  id: string;
  titleKey: string;
  descKey: string;
  npcId: string;
  targetMonster?: MonsterType;
  targetCount: number;
  currentCount: number;
  rewardExp: number;
  rewardGold: number;
  rewardXCoins: number;
  rewardItem?: Item;
  status: 'available' | 'in_progress' | 'ready_to_claim' | 'completed';
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  text: string;
  type: 'system' | 'combat' | 'quest' | 'chat';
}
