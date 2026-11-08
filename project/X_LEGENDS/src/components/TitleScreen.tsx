import React, { useEffect, useRef } from 'react';
import { Language } from '../game/types';
import { t } from '../game/localization';
import { sound } from '../game/audio';
import { Volume2, VolumeX, Globe, Play } from 'lucide-react';

interface TitleScreenProps {
  language: Language;
  isMuted: boolean;
  hasSavedGame: boolean;
  onStartGame: () => void;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  language,
  isMuted,
  hasSavedGame,
  onStartGame,
  onToggleSound,
  onToggleLanguage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background animated particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Floating embers and stars
    const embers: Array<{ x: number; y: number; size: number; speedY: number; speedX: number; opacity: number }> = [];
    for (let i = 0; i < 60; i++) {
      embers.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1 + Math.random() * 3,
        speedY: -0.3 - Math.random() * 0.8,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: 0.2 + Math.random() * 0.7,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep atmospheric background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(0.5, '#17110e');
      grad.addColorStop(1, '#0c0704');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant isometric mountain silhouette
      ctx.fillStyle = 'rgba(18, 14, 12, 0.7)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(0, canvas.height * 0.65);
      ctx.lineTo(canvas.width * 0.35, canvas.height * 0.5);
      ctx.lineTo(canvas.width * 0.65, canvas.height * 0.7);
      ctx.lineTo(canvas.width, canvas.height * 0.55);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Draw floating golden ember particles
      for (const e of embers) {
        e.y += e.speedY;
        e.x += e.speedX;
        if (e.y < -10) {
          e.y = canvas.height + 10;
          e.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = `rgba(245, 158, 11, ${e.opacity})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Enter or Space key to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        sound.playClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 select-none overflow-hidden">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 -z-10 pointer-events-none" />

      {/* Top utility row: Audio & Language */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-amber-500/80 font-mono">
            MMORPG PROTOTYPE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onToggleLanguage();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 text-xs transition-colors cursor-pointer"
          >
            <Globe size={14} className="text-amber-400" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto z-10 max-w-2xl text-center px-4">
        {/* Bespoke Fantasy SVG Logo Lockup */}
        <div className="relative mb-4">
          <svg
            className="w-80 sm:w-96 md:w-[480px] h-auto max-h-40 filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)]"
            viewBox="0 0 600 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>

            {/* Crossed Decorative Crest Swords */}
            <path d="M 280 15 L 320 145 M 320 15 L 280 145" stroke="url(#bladeGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.3" />

            {/* Wings / Crest Accents */}
            <path d="M 120 80 Q 200 40 280 70 M 480 80 Q 400 40 320 70" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" opacity="0.6" />

            {/* English / Latin Display */}
            <text
              x="300"
              y="90"
              textAnchor="middle"
              fontFamily="Cinzel, serif"
              fontWeight="900"
              fontSize="68"
              fill="url(#goldGrad)"
              letterSpacing="8"
            >
              X LEGENDS
            </text>

            {/* Arabic Calligraphy Subtitle */}
            <text
              x="300"
              y="135"
              textAnchor="middle"
              fontFamily="Cairo, sans-serif"
              fontWeight="800"
              fontSize="24"
              fill="#fbbf24"
              letterSpacing="2"
            >
              إكـس ليـجـنـدز
            </text>
          </svg>
        </div>

        <p className="text-stone-300 text-sm md:text-base max-w-lg mb-4 leading-relaxed font-fantasy">
          {t(language, 'gameSubtitle')}
        </p>

        {/* Hero Character Showcase Centerpiece */}
        <div className="relative my-3 flex flex-col items-center">
          {/* Glowing runic dais */}
          <div className="w-24 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse" />
          <div className="absolute -top-12 flex flex-col items-center">
            {/* Detailed 2D Hero Preview */}
            <div className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-bounce duration-1000">
              ⚔️
            </div>
            <span className="text-[10px] font-fantasy font-bold tracking-widest text-amber-300 mt-1 uppercase">
              Warrior of Crown Town
            </span>
          </div>
        </div>

        {/* Primary Start CTA */}
        <button
          onClick={() => {
            sound.playClick();
            onStartGame();
          }}
          className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold font-fantasy text-base md:text-lg shadow-xl shadow-amber-950/60 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3 border-2 border-amber-300/80"
        >
          <Play size={20} className="fill-stone-950" />
          <span>{hasSavedGame ? t(language, 'continueGame') : t(language, 'startGame')}</span>
        </button>

        {/* Flat control-hint line as per Game Craft Guidelines */}
        <div className="mt-8 text-xs text-stone-400 font-mono tracking-wide">
          {language === 'ar'
            ? 'WASD / الأسهم للحركة · مفتاح المسافة للهجوم · Esc للتوقف'
            : 'WASD Move · Space Action · Esc Pause'}
        </div>
      </div>

      {/* Footer info */}
      <div className="w-full max-w-5xl flex justify-between items-center text-[11px] text-stone-400 z-10 border-t border-stone-800/80 pt-3">
        <span>X LEGENDS © 2026</span>
        <span>HTML5 Canvas & React Engine</span>
      </div>
    </div>
  );
};
