import React, { useState } from 'react';
import { Item, Language } from '../game/types';
import { SHOP_ITEMS } from '../game/items';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { X, Coins, Sparkles, Swords, Shield, Zap } from 'lucide-react';

interface ShopModalProps {
  gold: number;
  xCoins: number;
  inventory: Item[];
  language: Language;
  onClose: () => void;
  onBuyItem: (item: Item) => void;
  onSellItem: (item: Item) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  gold,
  xCoins,
  inventory,
  language,
  onClose,
  onBuyItem,
  onSellItem,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-400/80 bg-amber-950/20';
      case 'epic':
        return 'border-purple-500/80 bg-purple-950/20';
      case 'rare':
        return 'border-blue-500/80 bg-blue-950/20';
      default:
        return 'border-stone-800 bg-stone-950/60';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-stone-900/95 border-2 border-amber-600/60 rounded-xl shadow-2xl p-5 text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏪</span>
            <div>
              <h2 className="text-lg font-bold font-fantasy text-amber-400">
                {t(language, 'shopPanel')}
              </h2>
              <span className="text-xs text-stone-400">
                {language === 'ar' ? 'متجر بلدة التاج الملكية' : 'Crown Town Royal Emporium'}
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

        {/* Currency Strip & Tab switcher */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Functional segmented tab controls */}
          <div className="flex items-center gap-1 p-1 bg-stone-950 rounded-lg border border-stone-800">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('buy');
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeTab === 'buy'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t(language, 'buy')}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('sell');
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeTab === 'sell'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t(language, 'sell')} ({inventory.length})
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Coins size={14} />
              <span className="font-bold tabular-nums">{gold.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-300">
              <Sparkles size={14} />
              <span className="font-bold tabular-nums">{xCoins}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'buy' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {SHOP_ITEMS.map((item) => {
              const canAfford =
                gold >= item.buyPriceGold &&
                (!item.buyPriceXCoins || xCoins >= item.buyPriceXCoins);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex flex-col justify-between ${getRarityColor(
                    item.rarity
                  )}`}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="text-2xl shrink-0 p-1 bg-stone-900 rounded-md border border-stone-800">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-stone-200 truncate">
                        {t(language, item.nameKey as any)}
                      </h4>
                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">
                        {t(language, item.descKey as any)}
                      </p>
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div className="flex flex-wrap gap-1 mb-2 text-[10px]">
                    {item.attack && (
                      <span className="text-red-400 flex items-center gap-0.5">
                        <Swords size={10} /> +{item.attack} ATK
                      </span>
                    )}
                    {item.defense && (
                      <span className="text-blue-400 flex items-center gap-0.5">
                        <Shield size={10} /> +{item.defense} DEF
                      </span>
                    )}
                    {item.speedBonus && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Zap size={10} /> +{Math.round((item.speedBonus - 1) * 100)}% Spd
                      </span>
                    )}
                    {item.healHp && (
                      <span className="text-emerald-400">+{item.healHp} HP</span>
                    )}
                    {item.restoreMp && (
                      <span className="text-blue-400">+{item.restoreMp} MP</span>
                    )}
                  </div>

                  {/* Price & Buy Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-300 font-bold tabular-nums">
                        {item.buyPriceGold} {t(language, 'gold')}
                      </span>
                      {item.buyPriceXCoins && (
                        <span className="text-purple-300 font-bold tabular-nums">
                          + {item.buyPriceXCoins} {t(language, 'xCoins')}
                        </span>
                      )}
                    </div>
                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyItem(item)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {t(language, 'buy')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {inventory.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-stone-500 text-xs">
                {t(language, 'emptySlot')} · {language === 'ar' ? 'حقيبتك فارغة حالياً' : 'Your inventory is currently empty'}
              </div>
            ) : (
              inventory.map((item, idx) => (
                <div
                  key={`${item.id}_${idx}`}
                  className="p-3 rounded-lg border border-stone-800 bg-stone-950/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 bg-stone-900 rounded-md border border-stone-800">
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-stone-200">
                        {t(language, item.nameKey as any)}
                        {item.quantity && item.quantity > 1 && ` (x${item.quantity})`}
                      </h4>
                      <span className="text-[11px] text-amber-400">
                        {item.sellPriceGold} {t(language, 'gold')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSellItem(item)}
                    className="px-3 py-1.5 rounded-md bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-300 text-xs font-bold transition-colors border border-stone-700 cursor-pointer"
                  >
                    {t(language, 'sell')}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
