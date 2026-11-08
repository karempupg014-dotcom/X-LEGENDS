import React, { useState } from 'react';
import { Item, Equipment, Language } from '../game/types';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { X, Shield, Swords, Zap, Coins, Sparkles } from 'lucide-react';

interface InventoryPanelProps {
  inventory: Item[];
  equipment: Equipment;
  gold: number;
  xCoins: number;
  language: Language;
  onClose: () => void;
  onEquip: (item: Item) => void;
  onUseItem: (item: Item) => void;
  onSellItem: (item: Item) => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  inventory,
  equipment: _equipment,
  gold,
  xCoins,
  language,
  onClose,
  onEquip,
  onUseItem,
  onSellItem,
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const TOTAL_SLOTS = 24;
  const slots: Array<Item | null> = Array.from({ length: TOTAL_SLOTS }, (_, i) => inventory[i] || null);

  const getRarityBorder = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-400 bg-amber-950/30 shadow-amber-500/20 shadow-md';
      case 'epic':
        return 'border-purple-500 bg-purple-950/30';
      case 'rare':
        return 'border-blue-500 bg-blue-950/30';
      case 'common':
      default:
        return 'border-stone-700 bg-stone-950/60';
    }
  };

  const isEquippable = (item: Item) => {
    return ['weapon', 'helmet', 'armor', 'boots', 'ring', 'amulet'].includes(item.type);
  };

  const isUsable = (item: Item) => {
    return item.type === 'consumable';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-stone-900/95 border-2 border-amber-600/60 rounded-xl shadow-2xl p-5 text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <div>
              <h2 className="text-lg font-bold font-fantasy text-amber-400">
                {t(language, 'inventoryPanel')}
              </h2>
              <span className="text-xs text-stone-400">
                {inventory.length} / {TOTAL_SLOTS} {t(language, 'inventory')}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Currency Strip */}
        <div className="flex items-center justify-between px-3 py-2 bg-stone-950/90 rounded-lg border border-stone-800 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-amber-400" />
            <span className="text-stone-400">{t(language, 'gold')}:</span>
            <span className="font-bold text-amber-300 tabular-nums text-sm">
              {gold.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-stone-400">{t(language, 'xCoins')}:</span>
            <span className="font-bold text-purple-300 tabular-nums text-sm">
              {xCoins}
            </span>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-6 gap-2 mb-4 max-h-64 overflow-y-auto p-1">
          {slots.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (item) {
                  sound.playClick();
                  setSelectedItem(item);
                } else {
                  setSelectedItem(null);
                }
              }}
              className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                item ? getRarityBorder(item.rarity) : 'border-stone-800/80 bg-stone-950/40'
              } ${selectedItem === item && item ? 'ring-2 ring-amber-400 scale-105' : 'hover:border-stone-500'}`}
            >
              {item && (
                <>
                  <span className="text-2xl select-none">{item.icon}</span>
                  {item.quantity && item.quantity > 1 && (
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-stone-950/90 text-[10px] font-bold text-amber-300 border border-stone-700 tabular-nums">
                      {item.quantity}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Selected Item Detail Panel */}
        {selectedItem ? (
          <div className="p-3 bg-stone-950/90 rounded-lg border border-amber-600/40 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedItem.icon}</span>
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">
                    {t(language, selectedItem.nameKey as any)}
                  </h4>
                  <span className="text-[11px] capitalize text-stone-400">
                    {selectedItem.rarity} {selectedItem.type}
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] text-amber-400/90">
                {t(language, 'sell')}: {selectedItem.sellPriceGold} {t(language, 'gold')}
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {t(language, selectedItem.descKey as any)}
            </p>

            {/* Stat modifiers */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              {selectedItem.attack && (
                <span className="flex items-center gap-1 text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/40">
                  <Swords size={12} /> +{selectedItem.attack} ATK
                </span>
              )}
              {selectedItem.defense && (
                <span className="flex items-center gap-1 text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/40">
                  <Shield size={12} /> +{selectedItem.defense} DEF
                </span>
              )}
              {selectedItem.speedBonus && (
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
                  <Zap size={12} /> +{Math.round((selectedItem.speedBonus - 1) * 100)}% Speed
                </span>
              )}
              {selectedItem.healHp && (
                <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
                  +{selectedItem.healHp} HP
                </span>
              )}
              {selectedItem.restoreMp && (
                <span className="text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/40">
                  +{selectedItem.restoreMp} MP
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t border-stone-800">
              {isEquippable(selectedItem) && (
                <button
                  onClick={() => {
                    onEquip(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t(language, 'equip')}
                </button>
              )}
              {isUsable(selectedItem) && (
                <button
                  onClick={() => {
                    onUseItem(selectedItem);
                    if (!selectedItem.quantity || selectedItem.quantity <= 1) {
                      setSelectedItem(null);
                    }
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t(language, 'useItem')}
                </button>
              )}
              <button
                onClick={() => {
                  onSellItem(selectedItem);
                  if (!selectedItem.quantity || selectedItem.quantity <= 1) {
                    setSelectedItem(null);
                  }
                }}
                className="py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-300 text-xs transition-colors border border-stone-700 cursor-pointer"
              >
                {t(language, 'sell')} ({selectedItem.sellPriceGold} {t(language, 'gold')})
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-stone-950/50 rounded-lg border border-stone-800/80 text-center text-xs text-stone-500">
            {t(language, 'emptySlot')} · {language === 'ar' ? 'انقر على أي عنصر لفحصه أو تجهيزه' : 'Click on an item to inspect or equip it'}
          </div>
        )}
      </div>
    </div>
  );
};
