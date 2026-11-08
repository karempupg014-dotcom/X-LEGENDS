import React from 'react';
import { NPCEntity, Quest, Language } from '../game/types';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { X, Sparkles, ShoppingBag, ShieldCheck, Scroll } from 'lucide-react';

interface DialogueModalProps {
  npc: NPCEntity;
  quest?: Quest;
  language: Language;
  onClose: () => void;
  onAcceptQuest?: (questId: string) => void;
  onClaimQuest?: (quest: Quest) => void;
  onOpenShop?: () => void;
  onElderBlessing?: () => void;
  onTeleportTown?: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  quest,
  language,
  onClose,
  onAcceptQuest,
  onClaimQuest,
  onOpenShop,
  onElderBlessing,
  onTeleportTown,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-stone-900/95 border-2 border-amber-600/70 rounded-xl shadow-2xl p-6 text-stone-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-700/40 to-stone-800 border-2 border-amber-500/60 flex items-center justify-center text-3xl shadow-inner">
              {npc.icon}
            </div>
            <div>
              <h3 className="font-bold font-fantasy text-lg text-amber-300">
                {t(language, npc.nameKey as any)}
              </h3>
              <p className="text-xs text-stone-400">
                {t(language, npc.titleKey as any)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* NPC Dialogue Prose */}
        <div className="p-4 rounded-lg bg-stone-950/80 border border-stone-800/80 mb-5">
          <p className="text-sm text-stone-200 leading-relaxed italic">
            "{t(language, npc.dialogueKey as any)}"
          </p>
        </div>

        {/* Quest Offer Box if applicable */}
        {quest && quest.status === 'available' && (
          <div className="mb-4 p-3 bg-amber-950/30 rounded-lg border border-amber-600/40">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
              <Scroll size={14} />
              <span>{language === 'ar' ? 'مهمة متاحة:' : 'Available Quest:'} {t(language, quest.titleKey as any)}</span>
            </div>
            <p className="text-xs text-stone-300 mb-2">
              {language === 'ar'
                ? `المطلوب: القضاء على ${quest.targetCount} من وحوش الغابة.`
                : `Objective: Slay ${quest.targetCount} forest creatures.`}
            </p>
            <div className="text-[11px] text-amber-400">
              {t(language, 'rewards')}: {quest.rewardGold} {t(language, 'gold')} · {quest.rewardExp} {t(language, 'exp')} · {quest.rewardXCoins} {t(language, 'xCoins')}
            </div>
          </div>
        )}

        {quest && quest.status === 'ready_to_claim' && (
          <div className="mb-4 p-3 bg-emerald-950/40 rounded-lg border border-emerald-500/50">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
              <Sparkles size={14} />
              <span>{language === 'ar' ? 'المهمة اكتملت بنجاح!' : 'Quest Successfully Completed!'}</span>
            </div>
            <p className="text-xs text-stone-300">
              {language === 'ar'
                ? 'عمل رائع أيها المحارب! تفضل باستلام مكافأتك الملكية.'
                : 'Outstanding work Warrior! Please accept your royal reward.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {quest && quest.status === 'available' && onAcceptQuest && (
            <button
              onClick={() => onAcceptQuest(quest.id)}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Scroll size={16} />
              {t(language, 'accept')}
            </button>
          )}

          {quest && quest.status === 'ready_to_claim' && onClaimQuest && (
            <button
              onClick={() => onClaimQuest(quest)}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Sparkles size={16} />
              {t(language, 'claimReward')}
            </button>
          )}

          {(npc.role === 'alchemist' || npc.role === 'blacksmith') && onOpenShop && (
            <button
              onClick={() => {
                onClose();
                onOpenShop();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors cursor-pointer"
            >
              <ShoppingBag size={16} className="text-amber-400" />
              {t(language, 'shopPanel')}
            </button>
          )}

          {npc.role === 'elder' && onElderBlessing && (
            <button
              onClick={onElderBlessing}
              className="w-full py-2.5 px-4 rounded-lg bg-stone-800 hover:bg-indigo-900/60 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors cursor-pointer"
            >
              <Sparkles size={16} className="text-indigo-400" />
              {language === 'ar' ? 'طلب بركة الحكمة (+20% خبرة)' : 'Request Sage\'s Blessing (+20% EXP)'}
            </button>
          )}

          {npc.role === 'elder' && onTeleportTown && (
            <button
              onClick={onTeleportTown}
              className="w-full py-2 px-4 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors cursor-pointer"
            >
              <ShieldCheck size={14} className="text-blue-400" />
              {language === 'ar' ? 'الانتقال إلى نافورة البلدة' : 'Teleport to Town Fountain'}
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2 px-4 rounded-lg bg-transparent hover:bg-stone-800/60 text-stone-400 text-xs transition-colors cursor-pointer"
          >
            {t(language, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
