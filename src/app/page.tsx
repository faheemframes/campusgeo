'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Play, MapPin } from 'lucide-react';

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
    <main className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-between p-6 select-none relative overflow-hidden">
      {/* Background Ambient Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Location Pill */}
      <header className="w-full max-w-md pt-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>SRM KTR Campus</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>v1.0</span>
        </div>
      </header>

      {/* Center Hero Section */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto z-10">
        {/* Animated Compass Icon Graphic */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-slate-700/60 flex items-center justify-center backdrop-blur-md shadow-2xl shadow-amber-500/10">
            <Compass className="w-12 h-12 text-amber-400 stroke-[1.75]" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-amber-500/20 animate-pulse pointer-events-none" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-sm">
          CAMPUS GEO
        </h1>

        {/* Core Question */}
        <p className="mt-3 text-lg sm:text-xl font-bold text-slate-300">
          How well do you know SRM?
        </p>

        {/* Error message if any */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs w-full">
            {error}
          </div>
        )}

        {/* Primary CTA: PLAY 360° */}
        <button
          onClick={handleStartGame}
          disabled={isStarting}
          className="mt-8 w-full py-4 px-6 rounded-2xl font-black text-lg tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
        >
          {isStarting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>STARTING GAME...</span>
            </div>
          ) : (
            <>
              <Play className="w-5 h-5 fill-slate-950 group-hover:translate-x-0.5 transition" />
              <span>PLAY 360°</span>
            </>
          )}
        </button>

        {/* Secondary information */}
        <p className="mt-6 text-sm font-semibold tracking-wide text-slate-400">
          Explore. Guess. Lock it in.
        </p>
      </div>

      {/* Footer Details */}
      <footer className="w-full max-w-md pb-4 flex flex-col items-center text-center gap-1 z-10">
        <div className="text-[11px] text-slate-500 font-medium">
          5 quick rounds • 360° Street View • Shareable story card
        </div>
        <div className="text-[10px] text-slate-600">
          Built for SRM Institute of Science and Technology, Kattankulathur
        </div>
      </footer>
    </main>
  );
}
