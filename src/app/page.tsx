'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Play, MapPin, Camera, Info, X } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

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

        {/* Game Info Link */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="mt-3 text-xs text-slate-400 hover:text-amber-400 transition flex items-center gap-1.5 underline underline-offset-4 decoration-slate-700 hover:decoration-amber-400"
          aria-label="How to play SRM GeoGuessr and game rules"
        >
          <Info className="w-3.5 h-3.5" />
          <span>How to Play & Campus Spots</span>
        </button>

        {/* Secondary information */}
        <p className="mt-3 text-xs sm:text-sm font-medium tracking-wide text-slate-300">
          Explore. Guess. Lock it in.
        </p>

        {/* Search Engine Crawlable Content (Rich Semantic Metadata for SRM Game / SRM GeoGuessr) */}
        <section className="sr-only" aria-label="About Campus Geo SRM GeoGuessr">
          <h2>Campus Geo — The Viral SRM KTR GeoGuessr Game</h2>
          <p>
            Campus Geo is the premier SRM GeoGuessr and campus exploration game for SRM Institute of Science and Technology (SRMIST), Kattankulathur. Players test their campus knowledge across 5 rapid rounds of 360° street view panoramas and landmark photographs.
          </p>
          <h3>Iconic SRM Landmarks Featured:</h3>
          <ul>
            <li>Tech Park facade, Fast Food Plaza, and Canteen walkway</li>
            <li>Dr. T.P. Ganesan Auditorium entrance, arch, and dome</li>
            <li>Java Green lawns and Clock Tower</li>
            <li>University Building (UB) front and central atrium</li>
            <li>Potheri Railway Station, pedestrian footbridge, and tracks</li>
            <li>Kattankulathur Railway Station platforms and station gate</li>
            <li>Bio-Engineering Block, Medical College, and Academic Blocks</li>
            <li>Abode Valley and Estancia student neighborhood zones</li>
          </ul>
          <h3>How to Play SRM GeoGuessr:</h3>
          <p>
            1. Examine the 360-degree interactive panorama or high-resolution campus photo. Look for architecture clues, signboards, building facades, and roads.
            2. Pan and zoom across the high-resolution satellite guess map of SRM KTR.
            3. Pin your location guess and click "Lock Guess". Earn up to 5,000 points per round based on proximity calculated with high-precision Haversine math.
            4. Share your 9:16 story score card with friends on WhatsApp and Instagram!
          </p>
        </section>
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

      {/* How to Play & About SRM GeoGuessr Modal */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="About SRM GeoGuessr and How to Play"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 select-text"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  About Campus Geo
                </h2>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                aria-label="Close rules dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 flex flex-col gap-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div>
                <h3 className="font-bold text-amber-300 uppercase tracking-wide text-xs mb-1">
                  🎯 The Ultimate SRM KTR GeoGuessr
                </h3>
                <p>
                  Think you know every corner of SRM Kattankulathur? Campus Geo puts you in 5 random spots across campus—from Tech Park to TP Ganesan, Java Green, Potheri station, and hidden walkways.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-amber-300 uppercase tracking-wide text-xs mb-1">
                  🕹️ How to Play
                </h3>
                <ol className="list-decimal pl-4 space-y-1">
                  <li><strong>Explore the Photo:</strong> Drag to look around or zoom in on architectural clues.</li>
                  <li><strong>Pin on Satellite:</strong> Tap on the SRM campus map where you think the camera was standing.</li>
                  <li><strong>Lock It In:</strong> Submit your guess! You earn up to 5,000 points per round based on proximity.</li>
                  <li><strong>Share Your Score:</strong> Complete all 5 rounds to generate your shareable story result card!</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-amber-300 uppercase tracking-wide text-xs mb-1">
                  📸 Crowdsource Spots
                </h3>
                <p>
                  Have a favorite photo or secret hangout spot on campus? Use the <strong>Contribute</strong> button to upload a photo and add it to the game pool for other students to guess!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

