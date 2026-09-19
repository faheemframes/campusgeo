'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, RotateCcw, Trophy, MapPin, Sparkles, Navigation, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import ShareStoryCard from './ShareStoryCard';
import { formatDistance } from '@/lib/scoring';

interface FinalRound {
  roundNumber: number;
  score: number;
  distanceMeters: number;
  locationName: string;
}

interface FinalResultViewProps {
  totalScore: number;
  rounds: FinalRound[];
  onPlayAgain: () => void;
}

export default function FinalResultView({
  totalScore,
  rounds,
  onPlayAgain,
}: FinalResultViewProps) {
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on finish
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ffffff'],
      });
    } catch {
      // Ignore if canvas not supported
    }
  }, []);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#080b11] text-white flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden select-none">
      {/* Top Brand Tag */}
      <header className="w-full max-w-md pt-1 pb-1 sm:pt-2 sm:pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-black tracking-widest text-xs sm:text-sm text-slate-200 uppercase">
            CAMPUS GEO
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] sm:text-xs text-slate-300 font-medium">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>SRM KTR</span>
        </div>
      </header>

      {/* Main Score Showcase Card */}
      <div className="w-full max-w-md flex-1 min-h-0 my-auto flex flex-col justify-between bg-slate-900/90 border border-white/[0.08] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header & Big Score */}
        <div className="flex flex-col items-center text-center shrink-0">
          <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-amber-400 uppercase">
            GAME COMPLETE
          </span>

          <div className="flex items-baseline justify-center gap-1.5 mt-0.5 sm:mt-1">
            <span className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-sm">
              {totalScore.toLocaleString()}
            </span>
            <span className="text-sm sm:text-xl font-bold font-mono text-slate-400">
              / 25k
            </span>
          </div>

          <div className="mt-1 sm:mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] sm:text-xs font-semibold text-slate-300">
            <span>5 ROUNDS</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">
              {totalScore >= 20000
                ? 'Campus Legend 🏆'
                : totalScore >= 15000
                ? 'Pro Navigator ⚡'
                : 'Campus Explorer 🧭'}
            </span>
          </div>
        </div>

        {/* 5-Rounds Breakdown */}
        <div className="w-full my-auto py-1 sm:py-2 flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Round Breakdown</span>
            <span>Score</span>
          </div>

          {rounds.map((round) => (
            <div
              key={round.roundNumber}
              className="w-full bg-slate-950/60 border border-white/[0.06] rounded-xl px-2.5 py-1.5 sm:py-2 flex items-center justify-between hover:border-white/[0.12] transition"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold font-mono text-slate-300 shrink-0">
                  {round.roundNumber}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {round.locationName}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Navigation className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                    {formatDistance(round.distanceMeters)} off
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
                  {round.score.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">/ 5,000</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action CTAs */}
        <div className="w-full shrink-0 flex flex-col gap-2 pt-1 sm:pt-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full py-2.5 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>SHARE RESULT CARD</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPlayAgain}
              className="w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={() => router.push('/contribute')}
              className="w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] hover:text-amber-300 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>+ ADD SPOT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shareable 9:16 Instagram Story Card Modal */}
      <ShareStoryCard
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        totalScore={totalScore}
        rounds={rounds}
      />
    </div>
  );
}

