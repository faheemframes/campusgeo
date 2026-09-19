'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Play, MapPin, Camera } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to initialize game session');
      }

      const data = await res.json();
      router.push(`/game/${data.gameId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong starting the game.');
      setIsStarting(false);
    }
  };

  return (
    <main className="h-[100dvh] max-h-[100dvh] w-full bg-[#080b11] text-white flex flex-col items-center justify-between p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Subtle Grid Backdrop */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Top Bar / Location Pill */}
      <header className="w-full max-w-md pt-2 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>SRM KTR Campus</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>
      </header>

      {/* Center Hero Section */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto z-10 py-2">
        {/* Animated Compass Icon Graphic */}
        <div className="relative mb-5 sm:mb-7 flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center backdrop-blur-md shadow-xl">
            <Compass className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 stroke-[1.75]" />
          </div>
          <div className="absolute -inset-1.5 rounded-3xl border border-amber-500/20 animate-pulse pointer-events-none" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-sm">
          CAMPUS GEO
        </h1>

        {/* Core Question */}
        <p className="mt-2 text-base sm:text-lg font-bold text-slate-300">
          How well do you know SRM?
        </p>

        {/* Error message if any */}
        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs w-full">
            {error}
          </div>
        )}

        {/* Primary CTA: PLAY 360° */}
        <button
          onClick={handleStartGame}
          disabled={isStarting}
          aria-label={isStarting ? 'Starting game...' : 'Play 360 Campus Geo Game'}
          className="mt-6 w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-lg tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group min-h-[48px]"
        >
          {isStarting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>STARTING GAME...</span>
            </div>
          ) : (
            <>
              <Play className="w-5 h-5 fill-slate-950 group-hover:translate-x-0.5 transition" />
              <span>PLAY 360°</span>
            </>
          )}
        </button>

        {/* Secondary Action: Add a Campus Spot */}
        <button
          onClick={() => router.push('/contribute')}
          aria-label="Contribute a new campus spot to the game pool"
          className="mt-2.5 w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 hover:text-white transition flex items-center justify-center gap-2 active:scale-95 min-h-[44px]"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Contribute a Campus Spot</span>
        </button>

        {/* Secondary information */}
        <p className="mt-4 text-xs sm:text-sm font-medium tracking-wide text-slate-300">
          Explore. Guess. Lock it in.
        </p>
      </div>

      {/* Footer Details */}
      <footer className="w-full max-w-md pb-2 flex flex-col items-center text-center gap-1 z-10 shrink-0">
        <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
          5 quick rounds • 360° Panoramas • Shareable card
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400">
          Built for SRM Institute of Science and Technology, Kattankulathur
        </div>
      </footer>
    </main>
  );
}

