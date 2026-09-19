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
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto">
      {/* Top Brand Tag */}
      <div className="w-full max-w-md pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-extrabold tracking-widest text-sm text-slate-300 uppercase">
            CAMPUS GEO
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>SRM KTR</span>
        </div>
      </div>

      {/* Main Score Showcase Card */}
      <div className="w-full max-w-md my-auto py-6 flex flex-col items-center">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">
            CAMPUS GEO
          </span>
          <span className="text-sm font-black tracking-wider text-amber-400 uppercase mb-4">
            YOUR SCORE
          </span>

          {/* Big Score Numbers */}
          <div className="flex flex-col items-center">
            <span className="text-6xl sm:text-7xl font-black tracking-tight text-white drop-shadow-md">
              {totalScore.toLocaleString()}
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-400 -mt-1">
              / 25,000
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
            <span>5 ROUNDS</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">Can you beat me?</span>
          </div>

          {/* 5-Rounds Breakdown */}
          <div className="w-full mt-8 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
              <span>ROUND BREAKDOWN</span>
              <span>SCORE</span>
            </div>

            {rounds.map((round) => (
              <div
                key={round.roundNumber}
                className="w-full bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-slate-300">
                    {round.roundNumber}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {round.locationName}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-blue-400" />
                      {formatDistance(round.distanceMeters)} off
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {round.score.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-600">/ 5,000</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="w-full mt-8 flex flex-col gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2.5"
            >
              <Share2 className="w-5 h-5" />
              <span>SHARE RESULT</span>
            </button>

            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wider uppercase bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:text-white transition flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={() => router.push('/contribute')}
              className="w-full py-3 rounded-2xl font-bold text-xs tracking-wider uppercase bg-slate-900/90 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:text-amber-300 hover:border-slate-700 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Contribute a Campus Spot</span>
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
