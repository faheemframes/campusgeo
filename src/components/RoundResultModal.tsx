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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Round {roundNumber} of {totalRounds} Result
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {locationName}
          </span>
        </div>

        {/* Map View */}
        <div className="relative w-full h-64 sm:h-80 bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 text-xs shadow-md">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Your Guess</span>
            </div>
          </div>
        </div>

        {/* Result Stats Section */}
        <div className="p-6 bg-slate-900 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Distance Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Navigation className="w-3.5 h-3.5 text-blue-400" /> Distance Off
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {formatDistance(distanceMeters)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">from actual point</span>
            </div>

            {/* Score Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Round Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {score.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ 5,000</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5">points awarded</span>
            </div>
          </div>

          {/* Prompt Format Visual Breakdown:
              ACTUAL LOCATION
              ●
                  183 m
              ●
              YOUR GUESS
          */}
          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={locationName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300" />
              )}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Actual Location</span>
                <span className="text-slate-200 font-medium line-clamp-1">{locationName}</span>
              </div>
            </div>

            <div className="flex flex-col items-center px-3 border-x border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Span</span>
              <span className="text-amber-400 font-bold font-mono">{formatDistance(distanceMeters)}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Your Guess</span>
                <span className="text-slate-200 font-medium">{score} pts</span>
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500 border border-red-300" />
            </div>
          </div>

          {/* Action CTA */}
          <button
            onClick={onNext}
            className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            <span>{isGameOver ? 'SEE FINAL SCORE' : 'NEXT ROUND'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
