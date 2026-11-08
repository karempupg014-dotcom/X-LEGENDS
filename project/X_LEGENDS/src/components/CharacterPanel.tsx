import React from 'react';
import { PlayerStats, Equipment, Language } from '../game/types';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { X, Shield, Swords, Zap, Heart, Sparkles, Plus } from 'lucide-react';

interface CharacterPanelProps {
  stats: PlayerStats;
  equipment: Equipment;
  language: Language;
  onClose: () => void;
  onUpgradeStat: (stat: 'strength' | 'agility' | 'vitality' | 'spirit') => void;
  onUnequip: (slot: keyof Equipment) => void;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  stats,
  equipment,
  language,
  onClose,
  onUpgradeStat,
  onUnequip,
}) => {
  // Calculations
  const calculatedAtk = Math.round(10 + stats.strength * 2.2 + (equipment.weapon?.attack || 0) + (equipment.ring?.attack || 0));
  const calculatedDef = Math.round(5 + stats.vitality * 1.5 + (equipment.armor?.defense || 0) + (equipment.helmet?.defense || 0) + (equipment.boots?.defense || 0) + (equipment.amulet?.defense || 0));
  const calculatedCrit = Math.min(65, Math.round((0.05 + stats.agility * 0.015) * 100));
  const calculatedSpeed = (2.8 + stats.agility * 0.04) * (equipment.boots?.speedBonus || 1.0);

  const gearSlots: Array<{ key: keyof Equipment; labelKey: any; icon: string }> = [
    { key: 'helmet', labelKey: 'slotHelmet', icon: '🪖' },
    { key: 'weapon', labelKey: 'slotWeapon', icon: '⚔️' },
    { key: 'armor', labelKey: 'slotArmor', icon: '🛡️' },
    { key: 'boots', labelKey: 'slotBoots', icon: '👢' },
    { key: 'ring', labelKey: 'slotRing', icon: '💍' },
    { key: 'amulet', labelKey: 'slotAmulet', icon: '📿' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-stone-900/95 border-2 border-amber-600/60 rounded-xl shadow-2xl p-6 text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700/80 pb-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <div>
              <h2 className="text-xl font-bold font-fantasy text-amber-400">
                {t(language, 'characterPanel')}
              </h2>
              <span className="text-xs text-stone-400">
                {t(language, 'level')} {stats.level} · Warrior (محارب)
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Equipment Doll & Core Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-amber-300 border-b border-stone-800 pb-1">
              {t(language, 'equippedGear')}
            </h3>

            {/* Gear grid */}
            <div className="grid grid-cols-3 gap-3">
              {gearSlots.map((slot) => {
                const item = equipment[slot.key];
                return (
                  <div
                    key={slot.key}
                    onClick={() => {
                      if (item) onUnequip(slot.key);
                    }}
                    className={`relative p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      item
                        ? 'bg-stone-800/90 border-amber-500/50 hover:border-amber-400 hover:scale-105'
                        : 'bg-stone-950/60 border-stone-800 border-dashed text-stone-600'
                    }`}
                    title={item ? `${t(language, item.nameKey as any)} (Click to Unequip)` : t(language, slot.labelKey)}
                  >
                    <div className="text-2xl mb-1">{item ? item.icon : slot.icon}</div>
                    <div className="text-xs truncate font-medium text-stone-300">
                      {item ? t(language, item.nameKey as any) : t(language, slot.labelKey)}
                    </div>
                    {item && (
                      <span className="text-[10px] text-amber-400 block">
                        {item.attack ? `+${item.attack} ATK` : item.defense ? `+${item.defense} DEF` : ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Battle Stats Readout */}
            <div className="bg-stone-950/80 rounded-lg p-3.5 border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Swords size={14} className="text-red-400" />
                  {t(language, 'atk')}:
                </span>
                <span className="font-bold text-amber-300 tabular-nums">{calculatedAtk}</span>
              </div>
              <div className="flex justify-between items-center text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Shield size={14} className="text-blue-400" />
                  {t(language, 'def')}:
                </span>
                <span className="font-bold text-blue-300 tabular-nums">{calculatedDef}</span>
              </div>
              <div className="flex justify-between items-center text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" />
                  {t(language, 'crit')}:
                </span>
                <span className="font-bold text-yellow-300 tabular-nums">{calculatedCrit}%</span>
              </div>
              <div className="flex justify-between items-center text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  {t(language, 'speed')}:
                </span>
                <span className="font-bold text-emerald-300 tabular-nums">{calculatedSpeed.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Attribute Points Allocation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-1">
              <h3 className="text-sm font-semibold text-amber-300">
                {t(language, 'statPoints')}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 tabular-nums">
                {stats.statPoints} {t(language, 'points')}
              </span>
            </div>

            {/* 4 Attributes */}
            <div className="space-y-3">
              {/* Strength */}
              <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-200 text-sm">
                    <Swords size={15} className="text-red-400" />
                    {t(language, 'strength')}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {t(language, 'strengthDesc')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-400 tabular-nums text-base">
                    {stats.strength}
                  </span>
                  {stats.statPoints > 0 && (
                    <button
                      onClick={() => onUpgradeStat('strength')}
                      className="p-1 rounded-md bg-amber-600 hover:bg-amber-500 text-stone-950 transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Agility */}
              <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-200 text-sm">
                    <Zap size={15} className="text-amber-400" />
                    {t(language, 'agility')}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {t(language, 'agilityDesc')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-400 tabular-nums text-base">
                    {stats.agility}
                  </span>
                  {stats.statPoints > 0 && (
                    <button
                      onClick={() => onUpgradeStat('agility')}
                      className="p-1 rounded-md bg-amber-600 hover:bg-amber-500 text-stone-950 transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Vitality */}
              <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-200 text-sm">
                    <Heart size={15} className="text-emerald-400" />
                    {t(language, 'vitality')}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {t(language, 'vitalityDesc')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-400 tabular-nums text-base">
                    {stats.vitality}
                  </span>
                  {stats.statPoints > 0 && (
                    <button
                      onClick={() => onUpgradeStat('vitality')}
                      className="p-1 rounded-md bg-amber-600 hover:bg-amber-500 text-stone-950 transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Spirit */}
              <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-200 text-sm">
                    <Sparkles size={15} className="text-blue-400" />
                    {t(language, 'spirit')}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {t(language, 'spiritDesc')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-400 tabular-nums text-base">
                    {stats.spirit}
                  </span>
                  {stats.statPoints > 0 && (
                    <button
                      onClick={() => onUpgradeStat('spirit')}
                      className="p-1 rounded-md bg-amber-600 hover:bg-amber-500 text-stone-950 transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Currency overview */}
            <div className="p-3 rounded-lg bg-stone-950/80 border border-amber-900/40 flex justify-around text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🪙</span>
                <div>
                  <div className="text-stone-400">{t(language, 'gold')}</div>
                  <div className="font-bold text-amber-300 tabular-nums">{stats.gold.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">💎</span>
                <div>
                  <div className="text-stone-400">{t(language, 'xCoins')}</div>
                  <div className="font-bold text-purple-400 tabular-nums">{stats.xCoins}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
