'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin, Maximize2, Minimize2, Check } from 'lucide-react';
import type * as LType from 'leaflet';

interface GuessMapProps {
  onLockGuess: (lat: number, lng: number) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

// SRM KTR Campus Coordinates
const SRM_CENTER_LAT = 12.8236;
const SRM_CENTER_LNG = 80.0445;
const DEFAULT_ZOOM = 16;

export default function GuessMap({
  onLockGuess,
  isSubmitting = false,
  disabled = false,
}: GuessMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  const [guessCoord, setGuessCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');
      leafletRef.current = L;

      if (!isMounted || !mapContainerRef.current) return;

      // Define SRM KTR Campus bounds (prevents scrolling off to another state)
      const southWest = L.latLng(12.805, 80.02);
      const northEast = L.latLng(12.845, 80.065);
      const bounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapContainerRef.current, {
        center: [SRM_CENTER_LAT, SRM_CENTER_LNG],
        zoom: DEFAULT_ZOOM,
        minZoom: 14,
        maxZoom: 19,
        maxBounds: bounds,
        maxBoundsViscosity: 0.8,
        zoomControl: false,
        attributionControl: false,
      });

      // Crisp CartoDB Positron / OSM tiles for campus clarity
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      // Top right zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;

      // Click to drop guess marker
      map.on('click', (e: LType.LeafletMouseEvent) => {
        if (disabled || isSubmitting) return;

        const { lat, lng } = e.latlng;
        setGuessCoord({ lat, lng });

        // Custom red pin icon
        const pinIcon = L.divIcon({
          className: 'custom-guess-pin',
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
              <div class="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
                <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
              </div>
              <div class="absolute -bottom-1 w-2 h-2 bg-red-600 rotate-45"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
        }
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [disabled, isSubmitting]);

  // Invalidate map size when expanding/collapsing or hovering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isExpanded, isHovered]);

  const handleCenterCampus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([SRM_CENTER_LAT, SRM_CENTER_LNG], DEFAULT_ZOOM, {
        animate: true,
      });
    }
  };

  const handleLockIn = () => {
    if (guessCoord && !disabled && !isSubmitting) {
      onLockGuess(guessCoord.lat, guessCoord.lng);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative transition-all duration-300 ease-out z-20 flex flex-col ${
        isExpanded
          ? 'w-[92vw] sm:w-[480px] h-[520px] shadow-2xl'
          : isHovered
          ? 'w-[88vw] sm:w-[400px] h-[340px] shadow-xl'
          : 'w-[80vw] sm:w-[320px] h-[240px] shadow-lg opacity-90 hover:opacity-100'
      } rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 backdrop-blur-md`}
    >
      {/* Map Header Toolbar */}
      <div className="absolute top-2 left-2 z-[500] flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-xs text-slate-200">
        <MapPin className="w-3.5 h-3.5 text-red-400" />
        <span className="font-semibold tracking-wide">SRM KTR Campus</span>
      </div>

      <div className="absolute top-2 right-12 z-[500] flex items-center gap-1">
        <button
          onClick={handleCenterCampus}
          title="Reset to Campus Center"
          className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Minimize Map' : 'Maximize Map'}
          className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition"
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full flex-1 bg-slate-950" />

      {/* Action Footer */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400 truncate">
          {guessCoord ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Pin placed
            </span>
          ) : (
            <span>Tap map to drop pin</span>
          )}
        </div>

        <button
          onClick={handleLockIn}
          disabled={!guessCoord || disabled || isSubmitting}
          className={`px-5 py-2 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-md flex items-center gap-2 ${
            guessCoord && !disabled && !isSubmitting
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>LOCKING...</span>
            </div>
          ) : (
            'LOCK GUESS'
          )}
        </button>
      </div>
    </div>
  );
}
