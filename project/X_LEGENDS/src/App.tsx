import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  Language,
  PlayerStats,
  Equipment,
  Item,
  Quest,
  NPCEntity,
  ChatMessage,
} from './game/types';
import { loadSavedGame, saveGame, clearSavedGame, DEFAULT_PLAYER_STATS } from './game/storage';
import { sound } from './game/audio';
import { t } from './game/localization';
import { GameEngine, generateUniqueMsgId } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { CharacterPanel } from './components/CharacterPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { QuestPanel } from './components/QuestPanel';
import { ShopModal } from './components/ShopModal';
import { DialogueModal } from './components/DialogueModal';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal } from './components/PauseModal';
import { INITIAL_INVENTORY, INITIAL_EQUIPMENT } from './game/items';
import { INITIAL_QUESTS } from './game/quests';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_SCREEN');

  // Load initial persistent game data
  const initialData = useRef(loadSavedGame()).current;

  const [language, setLanguage] = useState<Language>(initialData.language || 'ar');
  const [stats, setStats] = useState<PlayerStats>(initialData.playerStats);
  const [equipment, setEquipment] = useState<Equipment>(initialData.equipment);
  const [inventory, setInventory] = useState<Item[]>(initialData.inventory);
  const [quests, setQuests] = useState<Quest[]>(initialData.quests);
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>(initialData.playerPos);

  // Audio & Mobile state
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showJoystick, setShowJoystick] = useState(false);
  const [autoAttack, setAutoAttack] = useState(false);
  const [showAggroRadius, setShowAggroRadius] = useState(true);
  const [weatherMode, setWeatherMode] = useState<'clear' | 'rain' | 'snow'>('rain');

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    'character' | 'inventory' | 'quests' | 'shop' | 'dialogue' | null
  >(null);
  const [dialogueNpc, setDialogueNpc] = useState<NPCEntity | null>(null);

  // Chat Log
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      timestamp: new Date().toLocaleTimeString(),
      text: language === 'ar' ? 'مرحباً بك في إكس ليجندز (X LEGENDS)!' : 'Welcome to X LEGENDS!',
      type: 'system',
    },
    {
      id: 'welcome_2',
      timestamp: new Date().toLocaleTimeString(),
      text: language === 'ar' ? 'تحرك في أرجاء بلدة التاج الملكية وتحدث مع الحراس والسكان.' : 'Explore Crown Town and speak with the guards and townspeople.',
      type: 'system',
    },
  ]);

  // Game Engine instance ref
  const engineRef = useRef<GameEngine | null>(null);

  // Sync document language and RTL/LTR direction
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Auto-detect mobile touch support
  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setShowJoystick(true);
    }
  }, []);

  // Save game helper
  const persistCurrentState = useCallback(() => {
    saveGame({
      playerStats: stats,
      equipment,
      inventory,
      quests,
      playerPos: engineRef.current ? { ...engineRef.current.playerPos } : playerPos,
      language,
    });
  }, [stats, equipment, inventory, quests, playerPos, language]);

  // Periodic autosave every 20 seconds
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const interval = setInterval(persistCurrentState, 20000);
      return () => clearInterval(interval);
    }
  }, [gameState, persistCurrentState]);

  // Engine callbacks
  const handleStatsUpdate = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
  }, []);

  const handleInventoryUpdate = useCallback((newInventory: Item[], newEquipment: Equipment) => {
    setInventory(newInventory);
    setEquipment(newEquipment);
  }, []);

  const handleQuestsUpdate = useCallback((newQuests: Quest[]) => {
    setQuests(newQuests);
  }, []);

  const handleChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev.slice(-30), msg]);
  }, []);

  const handleOpenDialogue = useCallback((npc: NPCEntity) => {
    setDialogueNpc(npc);
    setActiveModal('dialogue');
  }, []);

  const handleOpenShop = useCallback(() => {
    setActiveModal('shop');
  }, []);

  // Poll player position from engine only when crossing grid coordinates to prevent wasteful React renders
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    let lastX = Math.round(playerPos.x);
    let lastY = Math.round(playerPos.y);

    const interval = setInterval(() => {
      if (engineRef.current) {
        const curX = Math.round(engineRef.current.playerPos.x);
        const curY = Math.round(engineRef.current.playerPos.y);
        if (curX !== lastX || curY !== lastY) {
          lastX = curX;
          lastY = curY;
          setPlayerPos({ x: engineRef.current.playerPos.x, y: engineRef.current.playerPos.y });
        }
      }
    }, 400);
    return () => clearInterval(interval);
  }, [gameState, playerPos.x, playerPos.y]);

  // Keyboard shortcut listener for panels & pause (C, I, L, K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' && gameState !== 'PAUSED') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        sound.playClick();
        if (activeModal) {
          setActiveModal(null);
        } else {
          setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
        }
        return;
      }

      // Ignore panel hotkeys if a modal is open
      if (activeModal) return;

      const key = e.key.toLowerCase();
      if (key === 'c') {
        sound.playClick();
        setActiveModal('character');
      } else if (key === 'i') {
        sound.playClick();
        setActiveModal('inventory');
      } else if (key === 'l') {
        sound.playClick();
        setActiveModal('quests');
      } else if (key === 'k') {
        sound.playClick();
        setActiveModal('shop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeModal]);

  // Character attribute upgrade handler
  const handleUpgradeStat = (stat: 'strength' | 'agility' | 'vitality' | 'spirit') => {
    if (stats.statPoints <= 0) return;
    sound.playClick();
    const updated = {
      ...stats,
      [stat]: stats[stat] + 1,
      statPoints: stats.statPoints - 1,
    };
    if (stat === 'vitality') {
      updated.maxHp += 20;
      updated.hp += 20;
    } else if (stat === 'spirit') {
      updated.maxMp += 15;
      updated.mp += 15;
    }

    setStats(updated);
    if (engineRef.current) {
      engineRef.current.stats = updated;
      engineRef.current.notifyUI();
    }
  };

  // Quest claim reward handler
  const handleClaimQuest = (quest: Quest) => {
    sound.playQuestComplete();
    quest.status = 'completed';

    // Grant rewards
    const updatedStats = {
      ...stats,
      gold: stats.gold + quest.rewardGold,
      xCoins: stats.xCoins + quest.rewardXCoins,
    };

    if (engineRef.current) {
      engineRef.current.stats = updatedStats;
      engineRef.current.addExp(quest.rewardExp);
      if (quest.rewardItem) {
        engineRef.current.addItemToInventory({ ...quest.rewardItem });
      }
      engineRef.current.notifyUI();
    } else {
      setStats(updatedStats);
    }

    setQuests([...quests]);

    handleChatMessage({
      id: generateUniqueMsgId('quest_claim'),
      timestamp: new Date().toLocaleTimeString(),
      text: t(language, 'logQuestClaimed', {
        gold: quest.rewardGold,
        exp: quest.rewardExp,
        coins: quest.rewardXCoins,
      }),
      type: 'quest',
    });

    setActiveModal(null);
  };

  // Quest accept handler
  const handleAcceptQuest = (questId: string) => {
    sound.playClick();
    const q = quests.find((item) => item.id === questId);
    if (q) {
      q.status = 'in_progress';
      setQuests([...quests]);
      if (engineRef.current) {
        engineRef.current.quests = [...quests];
        engineRef.current.notifyUI();
      }
      handleChatMessage({
        id: generateUniqueMsgId('quest_accept'),
        timestamp: new Date().toLocaleTimeString(),
        text: language === 'ar' ? `تم قبول المهمة: ${t(language, q.titleKey as any)}` : `Accepted Quest: ${t(language, q.titleKey as any)}`,
        type: 'quest',
      });
    }
    setActiveModal(null);
  };

  // Elder blessing
  const handleElderBlessing = () => {
    sound.playClick();
    if (engineRef.current) {
      engineRef.current.elderBlessing = true;
      engineRef.current.addFloatingText(
        engineRef.current.playerPos.x,
        engineRef.current.playerPos.y - 1.0,
        t(language, 'elderBlessingGiven'),
        '#818cf8',
        16
      );
    }
    handleChatMessage({
      id: generateUniqueMsgId('elder_blessing'),
      timestamp: new Date().toLocaleTimeString(),
      text: t(language, 'elderBlessingGiven'),
      type: 'system',
    });
    setActiveModal(null);
  };

  // Teleport to town fountain
  const handleTeleportTown = () => {
    sound.playPotion();
    if (engineRef.current) {
      engineRef.current.playerPos = { x: 16, y: 18 };
      engineRef.current.playerTargetPos = null;
      engineRef.current.addFloatingText(16, 17, 'Returned to Fountain', '#38bdf8', 16);
    }
    setActiveModal(null);
  };

  // Reset Progress
  const handleResetProgress = () => {
    if (window.confirm(t(language, 'resetConfirm'))) {
      clearSavedGame();
      setStats({ ...DEFAULT_PLAYER_STATS });
      setEquipment({ ...INITIAL_EQUIPMENT });
      setInventory([...INITIAL_INVENTORY]);
      setQuests([...INITIAL_QUESTS]);
      if (engineRef.current) {
        engineRef.current.stats = { ...DEFAULT_PLAYER_STATS };
        engineRef.current.equipment = { ...INITIAL_EQUIPMENT };
        engineRef.current.inventory = [...INITIAL_INVENTORY];
        engineRef.current.quests = [...INITIAL_QUESTS];
        engineRef.current.playerPos = { x: 16, y: 18 };
        engineRef.current.playerTargetPos = null;
        engineRef.current.notifyUI();
      }
      setGameState('TITLE_SCREEN');
      setActiveModal(null);
    }
  };

  // Toggle Sound Mute
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    if (engineRef.current) {
      engineRef.current.setLanguage(nextLang);
    }
  };

  // Toggle Aggro Radius
  const handleToggleAggroRadius = () => {
    if (engineRef.current) {
      const nextVal = engineRef.current.toggleAggroRadius();
      setShowAggroRadius(nextVal);
    } else {
      setShowAggroRadius(!showAggroRadius);
    }
  };

  // Toggle Weather
  const handleToggleWeather = () => {
    if (engineRef.current) {
      const nextMode = engineRef.current.toggleWeather();
      setWeatherMode(nextMode);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* Title Screen State */}
      {gameState === 'TITLE_SCREEN' && (
        <TitleScreen
          language={language}
          isMuted={isMuted}
          hasSavedGame={stats.level > 1 || stats.exp > 0}
          onStartGame={() => setGameState('PLAYING')}
          onToggleSound={handleToggleSound}
          onToggleLanguage={handleToggleLanguage}
        />
      )}

      {/* Main Playing & Canvas State */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          {/* Isolated 60fps Game Canvas */}
          <GameCanvas
            initialStats={stats}
            initialEquipment={equipment}
            initialInventory={inventory}
            initialQuests={quests}
            initialPos={playerPos}
            language={language}
            onEngineReady={(engine) => {
              engineRef.current = engine;
            }}
            onStatsUpdate={handleStatsUpdate}
            onInventoryUpdate={handleInventoryUpdate}
            onQuestsUpdate={handleQuestsUpdate}
            onChatMessage={handleChatMessage}
            onOpenDialogue={handleOpenDialogue}
            onOpenShop={handleOpenShop}
          />

          {/* Low-Occlusion MMORPG HUD */}
          <HUD
            engine={engineRef.current}
            stats={stats}
            skills={engineRef.current?.skills || []}
            inventory={inventory}
            playerPos={playerPos}
            language={language}
            isMuted={isMuted}
            showJoystick={showJoystick}
            chatMessages={chatMessages}
            autoAttack={autoAttack}
            onTriggerAttack={() => engineRef.current?.triggerBasicAttack()}
            onTriggerSkill={(idx) => engineRef.current?.triggerSkill(idx)}
            onUsePotion={(type) => engineRef.current?.usePotion(type)}
            onOpenCharacter={() => setActiveModal('character')}
            onOpenInventory={() => setActiveModal('inventory')}
            onOpenQuests={() => setActiveModal('quests')}
            onOpenShop={() => setActiveModal('shop')}
            onToggleAutoAttack={() => {
              setAutoAttack(!autoAttack);
              if (engineRef.current) engineRef.current.autoAttack = !autoAttack;
            }}
            onToggleSound={handleToggleSound}
            onToggleLanguage={handleToggleLanguage}
            onOpenPause={() => setGameState('PAUSED')}
            onJoystickMove={(jx, jy) => engineRef.current?.setJoystick(jx, jy)}
          />

          {/* Active Modals */}
          {activeModal === 'character' && (
            <CharacterPanel
              stats={stats}
              equipment={equipment}
              language={language}
              onClose={() => setActiveModal(null)}
              onUpgradeStat={handleUpgradeStat}
              onUnequip={(slot) => engineRef.current?.unequipItem(slot)}
            />
          )}

          {activeModal === 'inventory' && (
            <InventoryPanel
              inventory={inventory}
              equipment={equipment}
              gold={stats.gold}
              xCoins={stats.xCoins}
              language={language}
              onClose={() => setActiveModal(null)}
              onEquip={(item) => engineRef.current?.equipItem(item)}
              onUseItem={(item) => {
                if (item.healHp) engineRef.current?.usePotion('health');
                else if (item.restoreMp) engineRef.current?.usePotion('mana');
              }}
              onSellItem={(item) => engineRef.current?.sellItem(item)}
            />
          )}

          {activeModal === 'quests' && (
            <QuestPanel
              quests={quests}
              language={language}
              onClose={() => setActiveModal(null)}
              onClaimReward={handleClaimQuest}
            />
          )}

          {activeModal === 'shop' && (
            <ShopModal
              gold={stats.gold}
              xCoins={stats.xCoins}
              inventory={inventory}
              language={language}
              onClose={() => setActiveModal(null)}
              onBuyItem={(item) => engineRef.current?.buyItem(item)}
              onSellItem={(item) => engineRef.current?.sellItem(item)}
            />
          )}

          {activeModal === 'dialogue' && dialogueNpc && (
            <DialogueModal
              npc={dialogueNpc}
              quest={quests.find((q) => q.npcId === dialogueNpc.id)}
              language={language}
              onClose={() => setActiveModal(null)}
              onAcceptQuest={handleAcceptQuest}
              onClaimQuest={handleClaimQuest}
              onOpenShop={() => setActiveModal('shop')}
              onElderBlessing={handleElderBlessing}
              onTeleportTown={handleTeleportTown}
            />
          )}

          {/* Pause Menu */}
          {gameState === 'PAUSED' && (
            <PauseModal
              language={language}
              isMuted={isMuted}
              showJoystick={showJoystick}
              showAggroRadius={showAggroRadius}
              weatherMode={weatherMode}
              onResume={() => setGameState('PLAYING')}
              onToggleSound={handleToggleSound}
              onToggleLanguage={handleToggleLanguage}
              onToggleJoystick={() => setShowJoystick(!showJoystick)}
              onToggleAggroRadius={handleToggleAggroRadius}
              onToggleWeather={handleToggleWeather}
              onResetProgress={handleResetProgress}
            />
          )}
        </>
      )}
    </div>
  );
}
