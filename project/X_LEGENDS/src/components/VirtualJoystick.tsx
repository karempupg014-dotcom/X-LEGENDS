import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = 48; // Max thumbstick radius

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      setKnobPos({ x: 0, y: 0 });
      onMove(0, 0);
      return;
    }

    const clampedDist = Math.min(distance, radius);
    const nx = dx / distance;
    const ny = dy / distance;

    setKnobPos({
      x: nx * clampedDist,
      y: ny * clampedDist,
    });

    onMove(nx * (clampedDist / radius), ny * (clampedDist / radius));
  };

  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      if (touchIdRef.current !== null) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
      }
    };
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-28 h-28 rounded-full bg-stone-900/70 border-2 border-stone-600/60 backdrop-blur-xs flex items-center justify-center select-none touch-none shadow-xl pointer-events-auto"
      style={{ touchAction: 'none' }}
    >
      {/* Outer base marks */}
      <div className="absolute inset-2 rounded-full border border-stone-500/30 pointer-events-none" />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/40 top-2 pointer-events-none" />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/40 bottom-2 pointer-events-none" />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/40 left-2 pointer-events-none" />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/40 right-2 pointer-events-none" />

      {/* Thumbstick Knob */}
      <div
        className={`w-12 h-12 rounded-full transition-transform ease-out duration-75 pointer-events-none shadow-md ${
          isDragging
            ? 'bg-gradient-to-br from-amber-500 to-amber-700 scale-105 border-2 border-amber-300'
            : 'bg-gradient-to-br from-stone-700 to-stone-800 border-2 border-stone-500'
        }`}
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-stone-900/60 border border-stone-400/40" />
        </div>
      </div>
    </div>
  );
};
