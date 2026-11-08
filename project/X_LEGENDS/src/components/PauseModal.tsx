import React from 'react';
import { Language } from '../game/types';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { Volume2, VolumeX, Globe, RotateCcw, Play, Gamepad2, X, Eye, CloudRain } from 'lucide-react';

interface PauseModalProps {
  language: Language;
  isMuted: boolean;
  showJoystick: boolean;
  showAggroRadius?: boolean;
  weatherMode?: 'clear' | 'rain' | 'snow';
  onResume: () => void;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onToggleJoystick: () => void;
  onToggleAggroRadius?: () => void;
  onToggleWeather?: () => void;
  onResetProgress: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  language,
  isMuted,
  showJoystick,
  showAggroRadius = true,
  weatherMode = 'rain',
  onResume,
  onToggleSound,
  onToggleLanguage,
  onToggleJoystick,
  onToggleAggroRadius,
  onToggleWeather,
  onResetProgress,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 pointer-events-auto backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-stone-900/95 border-2 border-amber-600/60 rounded-xl shadow-2xl p-6 text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚔️</span>
            <h2 className="text-lg font-bold font-fantasy text-amber-400">
              {t(language, 'pauseMenu')}
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-full py-2 px-3.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 border border-stone-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} className="text-emerald-400" />}
              {t(language, 'soundToggle')}
            </span>
            <span className="font-bold text-stone-400">
              {isMuted ? (language === 'ar' ? 'مكتوم' : 'Muted') : (language === 'ar' ? 'مفعل' : 'Enabled')}
            </span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="w-full py-2 px-3.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 border border-stone-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <Globe size={15} className="text-blue-400" />
              {t(language, 'languageToggle')}
            </span>
            <span className="font-bold text-amber-400">
              {language === 'ar' ? 'العربية (RTL)' : 'English (LTR)'}
            </span>
          </button>

          {/* Mobile Joystick Toggle */}
          <button
            onClick={onToggleJoystick}
            className="w-full py-2 px-3.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 border border-stone-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <Gamepad2 size={15} className="text-purple-400" />
              {t(language, 'joystickToggle')}
            </span>
            <span className="font-bold text-stone-400">
              {showJoystick ? (language === 'ar' ? 'ظاهر' : 'Visible') : (language === 'ar' ? 'مخفي' : 'Hidden')}
            </span>
          </button>

          {/* Monster Aggro Radius Toggle (User Request) */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleAggroRadius?.();
            }}
            className="w-full py-2 px-3.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 border border-stone-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <Eye size={15} className="text-amber-400" />
              {t(language, 'aggroRadiusToggle')}
            </span>
            <span className={`font-bold ${showAggroRadius ? 'text-amber-400' : 'text-stone-500'}`}>
              {showAggroRadius ? t(language, 'aggroRadiusOn') : t(language, 'aggroRadiusOff')}
            </span>
          </button>

          {/* Atmospheric Weather Toggle (User Request) */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleWeather?.();
            }}
            className="w-full py-2 px-3.5 rounded-lg bg-stone-950/80 hover:bg-stone-800 border border-stone-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <CloudRain size={15} className="text-cyan-400" />
              {t(language, 'weatherToggle')}
            </span>
            <span className="font-bold text-cyan-400">
              {weatherMode === 'rain'
                ? t(language, 'weatherRain')
                : weatherMode === 'snow'
                ? t(language, 'weatherSnow')
                : t(language, 'weatherClear')}
            </span>
          </button>

          {/* Reset progress */}
          <button
            onClick={onResetProgress}
            className="w-full py-2 px-3.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 flex items-center justify-between text-xs text-red-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <RotateCcw size={15} />
              {t(language, 'resetProgress')}
            </span>
          </button>
        </div>

        {/* 3D Camera Controls Hint */}
        <div className="bg-stone-950/90 rounded-lg p-2.5 border border-stone-800 text-[11px] text-stone-300 text-center mb-4">
          <p className="text-amber-300 font-semibold mb-1">🎮 {language === 'ar' ? 'التحكم بالكاميرا 3D' : '3D Camera Orbit'}</p>
          <p className="text-stone-400 text-[10px]">{t(language, 'cameraHint')}</p>
        </div>

        <p className="text-[11px] text-stone-400 text-center mb-4">
          {t(language, 'saveNotice')}
        </p>

        {/* Resume Button */}
        <button
          onClick={() => {
            sound.playClick();
            onResume();
          }}
          className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
        >
          <Play size={16} />
          {t(language, 'resume')}
        </button>
      </div>
    </div>
  );
};
