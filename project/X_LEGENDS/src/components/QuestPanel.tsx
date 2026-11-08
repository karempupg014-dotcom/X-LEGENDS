import React from 'react';
import { Quest, Language } from '../game/types';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { X, CheckCircle2, Clock, Sparkles, Coins } from 'lucide-react';

interface QuestPanelProps {
  quests: Quest[];
  language: Language;
  onClose: () => void;
  onClaimReward: (quest: Quest) => void;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  quests,
  language,
  onClose,
  onClaimReward,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-stone-900/95 border-2 border-amber-600/60 rounded-xl shadow-2xl p-5 text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg font-bold font-fantasy text-amber-400">
                {t(language, 'questPanel')}
              </h2>
              <span className="text-xs text-stone-400">
                {quests.filter((q) => q.status !== 'completed').length} {t(language, 'inProgress')}
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

        {/* Quest List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {quests.map((q) => {
            const isReady = q.status === 'ready_to_claim';
            const isDone = q.status === 'completed';

            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isReady
                    ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                    : isDone
                    ? 'bg-stone-950/40 border-stone-800 opacity-60'
                    : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    ) : isReady ? (
                      <Sparkles size={18} className="text-amber-400 shrink-0 animate-pulse" />
                    ) : (
                      <Clock size={18} className="text-stone-400 shrink-0" />
                    )}
                    <h3 className="font-bold text-sm text-stone-200">
                      {q.id === 'quest_boars'
                        ? language === 'ar' ? 'تهديد الخنازير البرية' : 'The Wild Boar Threat'
                        : q.id === 'quest_goblins'
                        ? language === 'ar' ? 'تطهير أطلال العفاريت' : 'Clearing Shadow Goblins'
                        : q.id === 'quest_vipers'
                        ? language === 'ar' ? 'حصاد سم الأفاعي' : 'Harvesting Viper Venom'
                        : language === 'ar' ? 'سقوط حارس الشجر الفاسد' : 'Fall of the Corrupted Treant'}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      isDone
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800'
                        : isReady
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {isDone ? t(language, 'completed') : isReady ? t(language, 'readyToClaim') : t(language, 'inProgress')}
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed mb-3">
                  {t(language, q.descKey as any)}
                </p>

                {/* Progress bar */}
                {!isDone && (
                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>{language === 'ar' ? 'التقدم' : 'Progress'}</span>
                      <span className="font-bold tabular-nums">
                        {q.currentCount} / {q.targetCount}
                      </span>
                    </div>
                    <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (q.currentCount / q.targetCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Rewards Strip */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800/80">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Coins size={13} /> {q.rewardGold} {t(language, 'gold')}
                    </span>
                    <span className="text-blue-300 font-medium">
                      +{q.rewardExp} {t(language, 'exp')}
                    </span>
                    <span className="flex items-center gap-1 text-purple-300">
                      <Sparkles size={13} /> {q.rewardXCoins} {t(language, 'xCoins')}
                    </span>
                    {q.rewardItem && (
                      <span className="text-xs" title={t(language, q.rewardItem.nameKey as any)}>
                        🎁 {q.rewardItem.icon}
                      </span>
                    )}
                  </div>

                  {isReady && (
                    <button
                      onClick={() => onClaimReward(q)}
                      className="py-1 px-3 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      {t(language, 'claimReward')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
