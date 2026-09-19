'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowRight, Trophy, MapPin, Navigation } from 'lucide-react';
import { formatDistance } from '@/lib/scoring';
import type * as LType from 'leaflet';

interface RoundResultModalProps {
  roundNumber: number;
  totalRounds: number;
  score: number;
  distanceMeters: number;
  actualLatitude: number;
  actualLongitude: number;
  guessLatitude: number;
  guessLongitude: number;
  locationName: string;
  imageUrl?: string;
  isGameOver: boolean;
  onNext: () => void;
}

export default function RoundResultModal({
  roundNumber,
  totalRounds,
  score,
  distanceMeters,
  actualLatitude,
  actualLongitude,
  guessLatitude,
  guessLongitude,
  locationName,
  imageUrl,
  isGameOver,
  onNext,
}: RoundResultModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderResultMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
        }
      ).addTo(map);

      // Guess Pin (Red, precise tip)
      const guessIcon = L.divIcon({
        className: 'result-guess-pin',
        html: `
          <div style="width: 32px; height: 42px; position: relative; pointer-events: none; margin: 0; padding: 0;">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.7));">
              <path d="M16 1C7.716 1 1 7.716 1 16C1 27.5 16 41 16 41C16 41 31 27.5 31 16C31 7.716 24.284 1 16 1Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="16" cy="16" r="5.5" fill="#FFFFFF"/>
              <circle cx="16" cy="16" r="2.5" fill="#EF4444"/>
            </svg>
            <div style="position: absolute; bottom: 0; left: 16px; transform: translate(-50%, 50%); width: 5px; height: 5px; border-radius: 50%; background: #EF4444; border: 1px solid #FFFFFF;"></div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 41],
      });

      // Actual Pin (Emerald Green, precise tip)
      const actualIcon = L.divIcon({
        className: 'result-actual-pin',
        html: `
          <div style="width: 32px; height: 42px; position: relative; pointer-events: none; margin: 0; padding: 0;">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.7));">
              <path d="M16 1C7.716 1 1 7.716 1 16C1 27.5 16 41 16 41C16 41 31 27.5 31 16C31 7.716 24.284 1 16 1Z" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="16" cy="16" r="5.5" fill="#FFFFFF"/>
              <circle cx="16" cy="16" r="2.5" fill="#10B981"/>
            </svg>
            <div style="position: absolute; bottom: 0; left: 16px; transform: translate(-50%, 50%); width: 5px; height: 5px; border-radius: 50%; background: #10B981; border: 1px solid #FFFFFF;"></div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 41],
      });

      const guessMarker = L.marker([guessLatitude, guessLongitude], { icon: guessIcon }).addTo(map);
      const actualMarker = L.marker([actualLatitude, actualLongitude], { icon: actualIcon }).addTo(map);

      // Connecting Polyline
      const line = L.polyline(
        [
          [guessLatitude, guessLongitude],
          [actualLatitude, actualLongitude],
        ],
        {
          color: '#f59e0b',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }
      ).addTo(map);

      // Fit bounds to show both pins comfortably
      const group = L.featureGroup([guessMarker, actualMarker, line]);
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 18 });

      mapInstanceRef.current = map;
    }

    renderResultMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [actualLatitude, actualLongitude, guessLatitude, guessLongitude]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3.5 bg-slate-900/95 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-300">
              Round {roundNumber} of {totalRounds}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400 truncate max-w-[180px] sm:max-w-xs">
            {locationName}
          </span>
        </div>

        {/* Map View */}
        <div className="relative w-full h-44 sm:h-72 bg-slate-950 shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Map Legend Overlay */}
          <div className="absolute bottom-2.5 left-2.5 z-[500] flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.08] text-[10px] sm:text-xs shadow-md">
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-1 text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span>Your Guess</span>
            </div>
          </div>
        </div>

        {/* Result Stats Section */}
        <div className="p-3 sm:p-5 bg-slate-900 flex flex-col gap-2.5 sm:gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Distance Card */}
            <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-2.5 sm:p-3.5 flex flex-col">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-0.5">
                <Navigation className="w-3 h-3 text-blue-400 shrink-0" /> Distance Off
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {formatDistance(distanceMeters)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-mono">from target</span>
            </div>

            {/* Score Card */}
            <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-2.5 sm:p-3.5 flex flex-col">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-0.5">
                <Trophy className="w-3 h-3 text-amber-400 shrink-0" /> Round Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {score.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">/ 5k</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 font-mono">points awarded</span>
            </div>
          </div>

          {/* Location Summary Row */}
          <div className="bg-slate-950/40 rounded-xl p-2 sm:p-2.5 border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={locationName}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover border border-slate-700 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400">Target Spot</span>
                <span className="text-slate-200 font-medium truncate text-xs">{locationName}</span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[9px] uppercase font-bold text-slate-400">Accuracy</span>
              <span className="text-amber-400 font-mono font-bold text-xs">{score > 4500 ? 'Bullseye! 🎯' : `${score} pts`}</span>
            </div>
          </div>

          {/* Action CTA */}
          <button
            onClick={onNext}
            className="w-full py-2.5 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isGameOver ? 'SEE FINAL SCORE' : 'NEXT ROUND'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

