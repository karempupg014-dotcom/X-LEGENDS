import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/engine';
import { PlayerStats, Equipment, Item, Quest, NPCEntity, ChatMessage, Language } from '../game/types';
import { AssetManager } from '../game/three/assetManager';
import { Shield, Sparkles } from 'lucide-react';

interface GameCanvasProps {
  initialStats: PlayerStats;
  initialEquipment: Equipment;
  initialInventory: Item[];
  initialQuests: Quest[];
  initialPos: { x: number; y: number };
  language: Language;
  onEngineReady: (engine: GameEngine) => void;
  onStatsUpdate: (stats: PlayerStats) => void;
  onInventoryUpdate: (inventory: Item[], equipment: Equipment) => void;
  onQuestsUpdate: (quests: Quest[]) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onOpenDialogue: (npc: NPCEntity) => void;
  onOpenShop: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  initialStats,
  initialEquipment,
  initialInventory,
  initialQuests,
  initialPos,
  language,
  onEngineReady,
  onStatsUpdate,
  onInventoryUpdate,
  onQuestsUpdate,
  onChatMessage,
  onOpenDialogue,
  onOpenShop,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const weatherCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Asset Loading Screen State
  const [isLoading, setIsLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);
  const [currentAssetLabel, setCurrentAssetLabel] = useState('Initializing 3D World...');

  useEffect(() => {
    let isCancelled = false;

    const startLoadingAndInitEngine = async () => {
      const assetManager = AssetManager.getInstance();

      // Step 1: Asynchronously load all 3D GLB assets with progress callback
      await assetManager.loadAll((percent, assetKey) => {
        if (!isCancelled) {
          setLoadPercent(percent);
          setCurrentAssetLabel(assetKey);
        }
      });

      if (isCancelled) return;
      setIsLoading(false);

      const container = containerRef.current;
      const weatherCanvas = weatherCanvasRef.current;
      if (!container || !weatherCanvas) return;

      // Step 2: Instantiate 3D Engine with loaded GLBs
      const engine = new GameEngine(
        container,
        initialStats,
        initialEquipment,
        initialInventory,
        initialQuests,
        initialPos,
        language
      );

      engine.onStatsUpdate = onStatsUpdate;
      engine.onInventoryUpdate = onInventoryUpdate;
      engine.onQuestsUpdate = onQuestsUpdate;
      engine.onChatMessage = onChatMessage;
      engine.onOpenDialogue = onOpenDialogue;
      engine.onOpenShop = onOpenShop;

      engineRef.current = engine;
      onEngineReady(engine);

      // Weather Particle System Loop on Overlay Canvas
      let weatherAnimId: number;
      let lastWeatherTime = performance.now();
      const weatherCtx = weatherCanvas.getContext('2d');

      const renderWeather = () => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastWeatherTime) / 1000);
        lastWeatherTime = now;

        if (weatherCtx && engine.weather) {
          weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
          engine.weather.render(weatherCtx, weatherCanvas.width, weatherCanvas.height, dt);
        }

        weatherAnimId = requestAnimationFrame(renderWeather);
      };

      // Resize handling
      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        weatherCanvas.width = w;
        weatherCanvas.height = h;

        if (engine.renderer && engine.camera) {
          engine.camera.aspect = w / h;
          engine.camera.updateProjectionMatrix();
          engine.renderer.setSize(w, h);
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      weatherAnimId = requestAnimationFrame(renderWeather);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(weatherAnimId);
        engine.destroy();
        engineRef.current = null;
      };
    };

    startLoadingAndInitEngine();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update language on engine when changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setLanguage(language);
    }
  }, [language]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none bg-stone-950">
      {/* 3D WebGL Three.js Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Atmospheric Weather Overlay Canvas */}
      <canvas
        ref={weatherCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* STEP 7: High-Quality MMORPG Asset Loading Screen Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-stone-100 p-6 backdrop-blur-md">
          {/* Ornate Glowing Crest Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 via-amber-700 to-stone-900 p-1 shadow-2xl animate-pulse">
              <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center border-2 border-amber-400">
                <Shield size={38} className="text-amber-400" />
              </div>
            </div>
            <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-300 animate-bounce" />
          </div>

          <h2 className="text-2xl font-bold font-fantasy text-amber-400 tracking-wider mb-1 drop-shadow-md">
            X LEGENDS
          </h2>
          <p className="text-xs text-stone-400 mb-6 font-medium">
            {language === 'ar' ? 'جاري تحميل عالم الفانتازيا ثلاثي الأبعاد...' : 'Loading 3D Fantasy Realm & Assets...'}
          </p>

          {/* Progress Bar Container */}
          <div className="w-72 sm:w-96 space-y-2">
            <div className="flex justify-between items-center text-xs text-stone-300 font-mono font-semibold">
              <span className="truncate max-w-[200px] text-amber-300">
                {currentAssetLabel.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-emerald-400 tabular-nums font-bold">{loadPercent}%</span>
            </div>

            <div className="h-3 w-full bg-stone-950 rounded-full overflow-hidden border border-amber-600/60 p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-emerald-400 rounded-full transition-all duration-200 shadow-md"
                style={{ width: `${loadPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
