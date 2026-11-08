import React, { useState, useEffect, useRef } from 'react';
import {
  PlayerStats,
  Skill,
  Item,
  Language,
  ChatMessage,
} from '../game/types';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { GameEngine } from '../game/engine';
import { VirtualJoystick } from './VirtualJoystick';
import {
  Volume2,
  VolumeX,
  Globe,
  Settings,
  Sword,
  User,
  Backpack,
  Scroll,
  ShoppingBag,
  Zap,
  Eye,
  EyeOff,
  CloudRain,
} from 'lucide-react';

interface HUDProps {
  engine: GameEngine | null;
  stats: PlayerStats;
  skills: Skill[];
  inventory: Item[];
  playerPos: { x: number; y: number };
  language: Language;
  isMuted: boolean;
  showJoystick: boolean;
  chatMessages: ChatMessage[];
  autoAttack: boolean;
  onTriggerAttack: () => void;
  onTriggerSkill: (index: number) => void;
  onUsePotion: (type: 'health' | 'mana') => void;
  onOpenCharacter: () => void;
  onOpenInventory: () => void;
  onOpenQuests: () => void;
  onOpenShop: () => void;
  onToggleAutoAttack: () => void;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onOpenPause: () => void;
  onJoystickMove: (x: number, y: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  stats,
  skills,
  inventory,
  playerPos,
  language,
  isMuted,
  showJoystick,
  chatMessages,
  autoAttack,
  onTriggerAttack,
  onTriggerSkill,
  onUsePotion,
  onOpenCharacter,
  onOpenInventory,
  onOpenQuests,
  onOpenShop,
  onToggleAutoAttack,
  onToggleSound,
  onToggleLanguage,
  onOpenPause,
  onJoystickMove,
}) => {
  const [chatTab, setChatTab] = useState<'all' | 'combat' | 'system'>('all');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [aggroVisible, setAggroVisible] = useState(engine?.showAggroRadius ?? true);
  const [weatherMode, setWeatherMode] = useState(engine?.weather.mode ?? 'rain');
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real measured FPS state from engine
  const [fpsReadout, setFpsReadout] = useState({ fps: 60, ms: 16.6 });

  // Update FPS readout at 2Hz (every 500ms) without causing frame drops
  useEffect(() => {
    const interval = setInterval(() => {
      if (engine) {
        setFpsReadout({
          fps: engine.measuredFps,
          ms: engine.frameTimeMs,
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [engine]);

  // Real-time 3D Minimap Radar drawing
  useEffect(() => {
    let animId: number;
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderMinimap = () => {
      if (!engine) return;

      const mw = canvas.width;
      const mh = canvas.height;
      ctx.clearRect(0, 0, mw, mh);

      // Radar background
      ctx.fillStyle = '#090d10';
      ctx.fillRect(0, 0, mw, mh);

      const scaleX = mw / 56;
      const scaleY = mh / 56;

      // Town sanctuary zone
      ctx.fillStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.fillRect(4 * scaleX, 4 * scaleY, 23 * scaleX, 23 * scaleY);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(4 * scaleX, 4 * scaleY, 23 * scaleX, 23 * scaleY);

      // Wildwoods forest zone
      ctx.fillStyle = 'rgba(22, 101, 52, 0.2)';
      ctx.fillRect(28 * scaleX, 4 * scaleY, 24 * scaleX, 48 * scaleY);

      // NPCs (Yellow dots)
      ctx.fillStyle = '#eab308';
      for (const npc of engine.npcs) {
        ctx.beginPath();
        ctx.arc(npc.x * scaleX, npc.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Monsters in 3D coordinates converted to grid
      for (const mob of engine.monsters) {
        if (mob.state === 'dead') continue;
        const gridX = mob.x / 2.2 + 28;
        const gridZ = mob.z / 2.2 + 28;

        // Draw Aggro Radius ring on minimap if enabled
        if (engine.showAggroRadius) {
          ctx.strokeStyle = mob.isAggro ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(gridX * scaleX, gridZ * scaleY, (mob.aggroRadius / 2.2) * scaleX, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = mob.type === 'treant' ? '#f97316' : mob.isAggro ? '#ef4444' : '#f87171';
        const rad = mob.type === 'treant' ? 3.5 : 2;
        ctx.beginPath();
        ctx.arc(gridX * scaleX, gridZ * scaleY, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player Beacon (Gold dot with pulse ring)
      const px = engine.playerPos.x * scaleX;
      const py = engine.playerPos.y * scaleY;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(renderMinimap);
    };

    animId = requestAnimationFrame(renderMinimap);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  // Potions count
  const hpPotions = inventory.find((i) => i.id === 'health_potion')?.quantity || 0;
  const mpPotions = inventory.find((i) => i.id === 'mana_potion')?.quantity || 0;

  // Percentage calculations
  const hpPct = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const mpPct = Math.max(0, Math.min(100, (stats.mp / stats.maxMp) * 100));
  const expPct = Math.max(0, Math.min(100, (stats.exp / stats.maxExp) * 100));

  const isTown = playerPos.x <= 28 && playerPos.y <= 28;

  const filteredChat = chatMessages.filter((m) => {
    if (chatTab === 'all') return true;
    if (chatTab === 'combat') return m.type === 'combat';
    if (chatTab === 'system') return m.type === 'system' || m.type === 'quest';
    return true;
  });

  // Selected Target Monster
  const targetMob = engine?.targetMonster && engine.targetMonster.state !== 'dead' ? engine.targetMonster : null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden flex flex-col justify-between p-2.5 sm:p-3.5">
      {/* ================= TOP PERIMETER ROW ================= */}
      <div className="flex justify-between items-start gap-3">
        {/* Zone 1: Classic MMORPG Character Plate */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-gradient-to-r from-stone-950/95 via-stone-900/90 to-stone-950/80 p-2 rounded-xl border border-amber-600/60 shadow-2xl backdrop-blur-xs">
          {/* Ornate Avatar Crest */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenCharacter();
            }}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-amber-600 to-stone-900 p-0.5 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            title={t(language, 'characterPanel')}
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-stone-900 text-2xl border border-amber-400/60">
              ⚔️
            </div>
            {/* Level Crest Badge */}
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-[10px] sm:text-[11px] rounded-full border border-stone-900 tabular-nums shadow">
              {stats.level}
            </div>
          </div>

          {/* Status Bars Cluster */}
          <div className="w-36 sm:w-44 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-300 font-fantasy tracking-wide">
                Warrior
              </span>
              {/* Real Measured FPS Badge */}
              <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-nums">
                {fpsReadout.fps} FPS
              </span>
            </div>

            {/* Health Bar (Classic MMORPG Blood Red) */}
            <div className="relative h-3 bg-stone-950 rounded-full overflow-hidden border border-red-950/90 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 transition-all duration-200"
                style={{ width: `${hpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-bold text-white drop-shadow tabular-nums">
                {stats.hp} / {stats.maxHp}
              </span>
            </div>

            {/* Mana Bar (Classic MMORPG Royal Azure) */}
            <div className="relative h-2.5 bg-stone-950 rounded-full overflow-hidden border border-blue-950/90 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 transition-all duration-200"
                style={{ width: `${mpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-bold text-white drop-shadow tabular-nums">
                {stats.mp} / {stats.maxMp}
              </span>
            </div>

            {/* Buff Badges */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {engine?.roarBuffTimer && engine.roarBuffTimer > 0 ? (
                <div
                  className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] text-amber-300 flex items-center gap-1 font-mono"
                  title="War Cry: +35% ATK, +25% SPD"
                >
                  <span>🦁</span>
                  <span className="tabular-nums font-bold">{Math.ceil(engine.roarBuffTimer)}s</span>
                </div>
              ) : null}
              {engine?.elderBlessing ? (
                <div
                  className="px-1.5 py-0.2 rounded bg-indigo-500/20 border border-indigo-500/40 text-[9px] text-indigo-300 flex items-center gap-1"
                  title="Sage Blessing: +20% EXP"
                >
                  <span>🧙‍♂️</span>
                  <span>+20%</span>
                </div>
              ) : null}
              {stats.statPoints > 0 && (
                <button
                  onClick={onOpenCharacter}
                  className="px-1.5 py-0.2 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[9px] animate-pulse cursor-pointer shadow"
                >
                  +{stats.statPoints} {t(language, 'points')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top-Center Selected Monster Target Plate */}
        {targetMob && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-stone-950/90 px-3 py-1.5 rounded-xl border border-red-700/80 shadow-2xl backdrop-blur-xs">
            <span className="text-xl">
              {targetMob.type === 'treant' ? '🌲' : targetMob.type === 'wolf' ? '🐺' : targetMob.type === 'boar' ? '🐗' : targetMob.type === 'goblin' ? '👺' : '🐍'}
            </span>
            <div className="w-32 sm:w-40">
              <div className="flex justify-between items-center text-[10px] text-red-300 font-bold">
                <span>{targetMob.type.toUpperCase()}</span>
                <span>{targetMob.hp} / {targetMob.maxHp}</span>
              </div>
              <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-red-950 mt-0.5">
                <div
                  className="h-full bg-red-600 transition-all duration-150"
                  style={{ width: `${(targetMob.hp / targetMob.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Zone 2: Minimap Radar & Utilities */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          {/* Utility Quick Strip */}
          <div className="flex items-center gap-1 bg-stone-950/90 p-1 rounded-lg border border-stone-800 backdrop-blur-xs">
            {/* Quick Aggro Radius Toggle Button (User Request) */}
            <button
              onClick={() => {
                if (engine) {
                  sound.playClick();
                  const nextVal = engine.toggleAggroRadius();
                  setAggroVisible(nextVal);
                }
              }}
              className={`p-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                aggroVisible ? 'bg-amber-950/60 text-amber-300 border border-amber-700/60' : 'text-stone-400 hover:bg-stone-800'
              }`}
              title={t(language, 'aggroRadiusToggle')}
            >
              {aggroVisible ? <Eye size={13} /> : <EyeOff size={13} />}
              <span className="hidden lg:inline">{language === 'ar' ? 'النطاق' : 'Aggro'}</span>
            </button>

            {/* Quick Weather Toggle Button (User Request) */}
            <button
              onClick={() => {
                if (engine) {
                  sound.playClick();
                  const nextMode = engine.toggleWeather();
                  setWeatherMode(nextMode);
                }
              }}
              className="p-1.5 rounded hover:bg-stone-800 text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              title={t(language, 'weatherToggle')}
            >
              <CloudRain size={13} />
              <span className="hidden lg:inline">
                {weatherMode === 'rain' ? t(language, 'weatherRain') : weatherMode === 'snow' ? t(language, 'weatherSnow') : t(language, 'weatherClear')}
              </span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onToggleLanguage();
              }}
              className="px-2 py-1 rounded hover:bg-stone-800 text-stone-300 hover:text-amber-400 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
              title={t(language, 'languageToggle')}
            >
              <Globe size={13} />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onToggleSound();
              }}
              className="p-1 rounded hover:bg-stone-800 text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenPause();
              }}
              className="p-1 rounded hover:bg-stone-800 text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
              title={t(language, 'pauseMenu')}
            >
              <Settings size={14} />
            </button>
          </div>

          {/* Real Canvas Minimap Radar */}
          <div className="relative w-28 h-28 rounded-xl bg-stone-950 border-2 border-stone-700/80 overflow-hidden shadow-2xl flex flex-col justify-between p-1">
            <canvas ref={minimapCanvasRef} width={112} height={112} className="absolute inset-0 pointer-events-none" />
            
            {/* Zone Tag */}
            <div className="text-[9px] font-bold text-amber-300 truncate z-10 drop-shadow">
              {isTown ? t(language, 'townName') : t(language, 'forestName')}
            </div>

            {/* Coordinates */}
            <div className="text-[9px] font-mono text-stone-300 font-bold tabular-nums text-right z-10 drop-shadow">
              {Math.round(playerPos.x)},{Math.round(playerPos.y)}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MOBILE CONTROLS (NON-OVERLAPPING) ================= */}
      {showJoystick && (
        <div className="flex justify-between items-end mb-1 w-full">
          {/* Virtual Joystick */}
          <div className="pointer-events-auto" data-joystick="true">
            <VirtualJoystick onMove={onJoystickMove} />
          </div>

          {/* Compact Right Mobile Attack & Skill Arc */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5 pr-1">
            <div className="flex gap-1.5">
              <button
                onClick={() => onTriggerSkill(0)}
                className="w-10 h-10 rounded-full bg-stone-900 border-2 border-amber-500/80 flex items-center justify-center text-sm active:scale-95 shadow-lg"
              >
                {skills[0]?.icon}
              </button>
              <button
                onClick={() => onTriggerSkill(1)}
                className="w-10 h-10 rounded-full bg-stone-900 border-2 border-amber-500/80 flex items-center justify-center text-sm active:scale-95 shadow-lg"
              >
                {skills[1]?.icon}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onTriggerSkill(2)}
                className="w-10 h-10 rounded-full bg-stone-900 border-2 border-amber-500/80 flex items-center justify-center text-sm active:scale-95 shadow-lg"
              >
                {skills[2]?.icon}
              </button>
              {/* Primary Attack Button */}
              <button
                onClick={onTriggerAttack}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-xl active:scale-95 shadow-2xl"
              >
                ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM ACTION BAR & PANELS ================= */}
      <div className="flex flex-col gap-1.5">
        {/* Chat Log & Quick Buttons Row */}
        <div className="flex justify-between items-end gap-3">
          {/* Bottom-Left: Compact Combat & System Chat Log */}
          <div className="pointer-events-auto w-60 sm:w-72 bg-stone-950/90 rounded-lg border border-stone-800 shadow-xl overflow-hidden backdrop-blur-xs hidden sm:block">
            {/* Tabs */}
            <div className="flex items-center justify-between px-2 py-0.5 bg-stone-900 border-b border-stone-800 text-[10px]">
              <div className="flex gap-2 font-medium">
                <button
                  onClick={() => setChatTab('all')}
                  className={`cursor-pointer ${chatTab === 'all' ? 'text-amber-400 font-bold' : 'text-stone-400'}`}
                >
                  {t(language, 'chatTabAll')}
                </button>
                <button
                  onClick={() => setChatTab('combat')}
                  className={`cursor-pointer ${chatTab === 'combat' ? 'text-red-400 font-bold' : 'text-stone-400'}`}
                >
                  {t(language, 'chatTabCombat')}
                </button>
                <button
                  onClick={() => setChatTab('system')}
                  className={`cursor-pointer ${chatTab === 'system' ? 'text-blue-400 font-bold' : 'text-stone-400'}`}
                >
                  {t(language, 'chatTabSystem')}
                </button>
              </div>
              <button
                onClick={() => setChatCollapsed(!chatCollapsed)}
                className="text-stone-400 hover:text-stone-200 text-[8px] cursor-pointer"
              >
                {chatCollapsed ? '▲' : '▼'}
              </button>
            </div>

            {/* Messages */}
            {!chatCollapsed && (
              <div className="p-1.5 h-20 overflow-y-auto space-y-0.5 text-[10.5px] leading-tight">
                {filteredChat.slice(-7).map((msg, idx) => (
                  <div
                    key={`${msg.id}_${idx}`}
                    className={`${
                      msg.type === 'combat'
                        ? 'text-amber-300'
                        : msg.type === 'quest'
                        ? 'text-emerald-400'
                        : 'text-stone-300'
                    }`}
                  >
                    <span className="text-[8.5px] text-stone-500 tabular-nums mr-1">
                      [{msg.timestamp.split(' ')[0]}]
                    </span>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom-Right: Quick MMORPG Action Panels Buttons */}
          <div className="pointer-events-auto flex items-center gap-1 bg-stone-950/90 p-1 rounded-xl border border-stone-800 shadow-xl backdrop-blur-xs">
            <button
              onClick={() => {
                sound.playClick();
                onToggleAutoAttack();
              }}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                autoAttack
                  ? 'bg-red-600/30 border-red-500 text-red-300 ring-1 ring-red-500/40'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title={autoAttack ? t(language, 'autoAttackOn') : t(language, 'autoAttackOff')}
            >
              <Zap size={14} />
              <span className="hidden md:inline text-[11px]">{t(language, 'autoAttack')}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenCharacter();
              }}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer"
              title={`${t(language, 'characterPanel')} [C]`}
            >
              <User size={15} />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenInventory();
              }}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer"
              title={`${t(language, 'inventoryPanel')} [I]`}
            >
              <Backpack size={15} />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenQuests();
              }}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer"
              title={`${t(language, 'questPanel')} [L]`}
            >
              <Scroll size={15} />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenShop();
              }}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer"
              title={`${t(language, 'shopPanel')} [K]`}
            >
              <ShoppingBag size={15} />
            </button>
          </div>
        </div>

        {/* Action Hotbar (Skills & Potions) */}
        <div className="pointer-events-auto flex items-center justify-center gap-1 sm:gap-1.5">
          {/* Health Potion [Q] */}
          <button
            onClick={() => onUsePotion('health')}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-stone-950 border-2 border-red-800 hover:border-red-500 flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
            title={`${t(language, 'hpPotion')} [Q]`}
          >
            <span className="text-base">🧪</span>
            <span className="absolute -top-1.5 -left-1.5 px-1 rounded bg-stone-900 border border-stone-700 text-[8.5px] font-mono font-bold text-stone-300">
              Q
            </span>
            <span className="absolute -bottom-1 -right-1 px-1 rounded bg-red-950 text-[9px] font-bold text-white tabular-nums border border-red-700">
              {hpPotions}
            </span>
          </button>

          {/* Mana Potion [E] */}
          <button
            onClick={() => onUsePotion('mana')}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-stone-950 border-2 border-blue-800 hover:border-blue-500 flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
            title={`${t(language, 'mpPotion')} [E]`}
          >
            <span className="text-base">💧</span>
            <span className="absolute -top-1.5 -left-1.5 px-1 rounded bg-stone-900 border border-stone-700 text-[8.5px] font-mono font-bold text-stone-300">
              E
            </span>
            <span className="absolute -bottom-1 -right-1 px-1 rounded bg-blue-950 text-[9px] font-bold text-white tabular-nums border border-blue-700">
              {mpPotions}
            </span>
          </button>

          <div className="w-px h-6 bg-stone-800 mx-0.5" />

          {/* Basic Melee Slash [Space] */}
          <button
            onClick={onTriggerAttack}
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-amber-700 to-stone-900 border-2 border-amber-400 hover:border-amber-300 flex flex-col items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer"
            title={`${t(language, 'skillBasic')} [Space]`}
          >
            <Sword size={20} className="text-amber-200" />
            <span className="absolute -top-1.5 -left-1.5 px-1 rounded bg-stone-900 border border-stone-700 text-[8px] font-mono font-bold text-stone-300">
              Spc
            </span>
          </button>

          {/* 4 Class Skills */}
          {skills.map((skill, index) => {
            const hasCooldown = skill.currentCooldown > 0;
            const cdPct = hasCooldown ? (skill.currentCooldown / skill.cooldown) * 100 : 0;

            return (
              <button
                key={skill.id}
                onClick={() => onTriggerSkill(index)}
                disabled={hasCooldown}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-stone-950 border-2 flex flex-col items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer overflow-hidden ${
                  hasCooldown
                    ? 'border-stone-800 opacity-80 cursor-not-allowed'
                    : 'border-amber-600/80 hover:border-amber-400'
                }`}
                title={`${t(language, skill.nameKey as any)} [${skill.keybind}]`}
              >
                <span className="text-lg select-none">{skill.icon}</span>

                {/* Keybind badge */}
                <span className="absolute -top-1.5 -left-1.5 px-1 rounded bg-stone-900 border border-stone-700 text-[8.5px] font-mono font-bold text-stone-300 z-10">
                  {skill.keybind}
                </span>

                {/* MP cost */}
                <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-blue-400 font-bold z-10">
                  {skill.mpCost}
                </span>

                {/* Cooldown sweep */}
                {hasCooldown && (
                  <div
                    className="absolute inset-0 bg-stone-950/85 flex items-center justify-center text-xs font-bold text-amber-400 font-mono"
                    style={{
                      background: `conic-gradient(rgba(0,0,0,0.85) ${cdPct}%, transparent 0)`,
                    }}
                  >
                    <span className="z-20 text-[10px] tabular-nums font-bold">
                      {skill.currentCooldown.toFixed(1)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Global EXP Bar */}
        <div className="relative w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-amber-900/40 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300"
            style={{ width: `${expPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-bold text-stone-300 drop-shadow tabular-nums">
            {t(language, 'exp')} {stats.exp} / {stats.maxExp} ({expPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
