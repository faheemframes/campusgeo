'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createStreetViewProvider, StreetViewProvider } from '@/lib/streetview/provider';
import { Compass, RotateCw, ZoomIn, ZoomOut, AlertCircle, Key } from 'lucide-react';
import ApiKeyModal from './ApiKeyModal';

interface PanoramaViewerProps {
  panoId: string;
  areaHint?: string;
  roundNumber: number;
  totalRounds: number;
  onLoaded?: () => void;
}

export default function PanoramaViewer({
  panoId,
  areaHint,
  roundNumber,
  totalRounds,
  onLoaded,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<StreetViewProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    setLoadError(null);

    // Destroy existing provider if any
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }

    const provider = createStreetViewProvider();
    providerRef.current = provider;

    provider
      .init(container, {
        panoId,
        initialHeading: 0,
        initialPitch: 0,
        initialZoom: 1,
        onReady: () => {
          if (!isCancelled) {
            setIsLoading(false);
            onLoaded?.();
          }
        },
        onError: (err) => {
          if (!isCancelled) {
            console.error('Panorama viewer error:', err);
            setIsLoading(false);
            setLoadError('Street View imagery loading. You can still explore and guess.');
          }
        },
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Provider init warning:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [panoId, onLoaded]);

  const handleResetOrientation = () => {
    if (providerRef.current) {
      providerRef.current.setPov(0, 0);
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* 360 Viewport Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-semibold tracking-wider text-sm">
            LOADING 360° PANORAMA...
          </p>
          <p className="text-slate-400 text-xs mt-1">Round {roundNumber} of {totalRounds}</p>
        </div>
      )}

      {/* Top HUD: Round Indicator & Area Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            ROUND
          </span>
          <span className="text-sm font-extrabold text-white">
            {roundNumber} <span className="text-slate-500 font-normal">/ {totalRounds}</span>
          </span>
        </div>

        {areaHint && (
          <div className="hidden sm:flex bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs font-medium text-slate-300 items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Zone: {areaHint}</span>
          </div>
        )}
      </div>

      {/* Top Right Controls: Reset Heading / Street View Key */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setIsKeyModalOpen(true)}
          title="Google Street View Setup"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-700/60 backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-2.5"
        >
          <Key className="w-4 h-4" />
          <span className="hidden sm:inline">Street View Key</span>
        </button>
        <button
          onClick={handleResetOrientation}
          title="Reset View Orientation"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 backdrop-blur-md transition active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error / Fallback Notification Banner if any */}
      {loadError && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm bg-amber-950/80 border border-amber-600/40 text-amber-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{loadError}</span>
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </div>
  );
}
