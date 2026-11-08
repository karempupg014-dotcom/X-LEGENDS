import { PlayerStats, Equipment, Item, Quest, Language } from './types';
import { INITIAL_INVENTORY, INITIAL_EQUIPMENT } from './items';
import { INITIAL_QUESTS } from './quests';

const STORAGE_KEY = 'X_LEGENDS_SAVE_DATA_V1';

export interface SavedGameData {
  playerStats: PlayerStats;
  equipment: Equipment;
  inventory: Item[];
  quests: Quest[];
  playerPos: { x: number; y: number };
  language: Language;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  level: 1,
  exp: 0,
  maxExp: 100,
  hp: 200,
  maxHp: 200,
  mp: 80,
  maxMp: 80,
  statPoints: 0,
  strength: 10,
  agility: 8,
  vitality: 10,
  spirit: 6,
  gold: 150,
  xCoins: 5,
  kills: 0,
};

export function loadSavedGame(): SavedGameData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        playerStats: { ...DEFAULT_PLAYER_STATS, ...parsed.playerStats },
        equipment: { ...INITIAL_EQUIPMENT, ...parsed.equipment },
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [...INITIAL_INVENTORY],
        quests: Array.isArray(parsed.quests) && parsed.quests.length > 0 ? parsed.quests : [...INITIAL_QUESTS],
        playerPos: parsed.playerPos || { x: 16, y: 18 },
        language: parsed.language || 'ar',
      };
    }
  } catch (err) {
    console.error('Failed to parse save data', err);
  }

  return {
    playerStats: { ...DEFAULT_PLAYER_STATS },
    equipment: { ...INITIAL_EQUIPMENT },
    inventory: [...INITIAL_INVENTORY],
    quests: [...INITIAL_QUESTS],
    playerPos: { x: 16, y: 18 },
    language: 'ar', // Default Arabic
  };
}

export function saveGame(data: SavedGameData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Unable to persist game state to localStorage', err);
  }
}

export function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Unable to clear save data', err);
  }
}
