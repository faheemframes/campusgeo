'use client';

import React from 'react';
import { Compass, X, MapPin, Eye, Trophy, Camera, HelpCircle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to Play SRM GeoGuessr"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-text"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                How to Play
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">SRM KTR Campus Geo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close how to play dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="py-3 sm:py-4 flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Step 1: Examine */}
          <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs sm:text-sm">1. Look Around the Photo</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Pan across the photo or zoom in. Spot distinctive architecture, building colors, road catenaries, trees, or signboards.
              </p>
            </div>
          </div>

          {/* Step 2: Pin on Map */}
          <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs sm:text-sm">2. Drop Your Guess Pin</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Tap on the Google Satellite campus map where you believe the camera was standing. Switch between <strong>Satellite+</strong> and <strong>Street</strong> views for clues!
              </p>
            </div>
          </div>

          {/* Step 3: Scoring & Colors */}
          <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-100 text-xs sm:text-sm">3. Score Up to 5,000 Pts / Round</h3>
              <p className="text-slate-400 text-xs mt-0.5 mb-2">
                Scores are color-coded based on your proximity to the actual target:
              </p>

              {/* Color guide tags */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono font-semibold">
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>4,500 - 5,000 (Bullseye! 🎯)</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  <span>3,000 - 4,499 (Great ⚡)</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                  <span>1,000 - 2,999 (Warmer 🧭)</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span>0 - 999 (Way Off 💀)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Leaderboard & Story Card */}
          <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Camera className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs sm:text-sm">4. Global Rank & 9:16 Story Card</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                At the end of all 5 rounds, see your live campus rank and percentile (e.g. <em>Top 3% of SRMites</em>). Download the Instagram Story card to share!
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition active:scale-95 shadow-md shadow-amber-500/20"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}
