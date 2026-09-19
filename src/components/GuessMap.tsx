'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin, Maximize2, Minimize2, Check, Layers, RotateCcw } from 'lucide-react';
import type * as LType from 'leaflet';

interface GuessMapProps {
  roundNumber?: number;
  onLockGuess: (lat: number, lng: number) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

// SRM KTR Campus Coordinates
const SRM_CENTER_LAT = 12.8236;
const SRM_CENTER_LNG = 80.0445;
const DEFAULT_ZOOM = 16;

export default function GuessMap({
  roundNumber = 1,
  onLockGuess,
  isSubmitting = false,
  disabled = false,
}: GuessMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const disabledRef = useRef(disabled);
  const isSubmittingRef = useRef(isSubmitting);

  disabledRef.current = disabled;
  isSubmittingRef.current = isSubmitting;

  const [guessCoord, setGuessCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isSatellite, setIsSatellite] = useState<boolean>(false);

  // Initialize Map once on mount
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

      // Standard OpenStreetMap tiles (free, reliable, complete SRM campus detail)
      const streetLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        }
      );

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
        }
      );

      streetLayer.addTo(map);

      // Top right zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      (map as any)._streetLayer = streetLayer;
      (map as any)._satelliteLayer = satelliteLayer;

      // Click to drop guess marker directly
      map.on('click', (e: LType.LeafletMouseEvent) => {
        if (disabledRef.current || isSubmittingRef.current) return;
        placePin(e.latlng.lat, e.latlng.lng, map, L);
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
  }, []);

  // Helper to place or move the marker
  const placePin = (
    lat: number,
    lng: number,
    map: LType.Map | null = mapInstanceRef.current,
    L: typeof import('leaflet') | null = leafletRef.current
  ) => {
    if (!map || !L) return;
    setGuessCoord({ lat, lng });

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
  };

  // Reset pin when moving to a new round
  useEffect(() => {
    setGuessCoord(null);
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([SRM_CENTER_LAT, SRM_CENTER_LNG], DEFAULT_ZOOM, {
        animate: true,
      });
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    }
  }, [roundNumber]);

  // Invalidate map size when expanding/collapsing or hovering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isExpanded, isHovered]);

  const handleToggleLayer = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current as any;
    if (isSatellite) {
      if (map._satelliteLayer) map.removeLayer(map._satelliteLayer);
      if (map._streetLayer) map.addLayer(map._streetLayer);
      setIsSatellite(false);
    } else {
      if (map._streetLayer) map.removeLayer(map._streetLayer);
      if (map._satelliteLayer) map.addLayer(map._satelliteLayer);
      setIsSatellite(true);
    }
  };

  const handleCenterCampus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([SRM_CENTER_LAT, SRM_CENTER_LNG], DEFAULT_ZOOM, {
        animate: true,
      });
    }
  };

  const handleDropAtCenter = () => {
    if (!mapInstanceRef.current || disabled || isSubmitting) return;
    const center = mapInstanceRef.current.getCenter();
    placePin(center.lat, center.lng);
  };

  const handleClearPin = () => {
    if (disabled || isSubmitting) return;
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setGuessCoord(null);
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
          ? 'w-[92vw] sm:w-[500px] h-[540px] shadow-2xl'
          : isHovered
          ? 'w-[88vw] sm:w-[420px] h-[360px] shadow-xl'
          : 'w-[82vw] sm:w-[340px] h-[260px] shadow-lg opacity-90 hover:opacity-100'
      } rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 backdrop-blur-md`}
    >
      {/* Map Header Toolbar */}
      <div className="absolute top-2 left-2 z-[500] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-xs text-slate-200">
        <MapPin className="w-3.5 h-3.5 text-red-400" />
        <span className="font-semibold tracking-wide">SRM KTR Campus</span>
      </div>

      <div className="absolute top-2 right-12 z-[500] flex items-center gap-1">
        <button
          onClick={handleToggleLayer}
          title={isSatellite ? 'Switch to Street Map' : 'Switch to Satellite'}
          className={`p-1.5 rounded-full backdrop-blur-md border border-slate-700/60 transition ${
            isSatellite
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
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

      {/* Center Aim Reticle (visible when no pin placed so user can pan then pin) */}
      {!guessCoord && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[450] pointer-events-none opacity-40 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-red-500 rounded-full" />
          </div>
        </div>
      )}

      {/* Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full flex-1 bg-slate-950" />

      {/* Action Footer */}
      <div className="p-2.5 sm:p-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {guessCoord ? (
            <button
              onClick={handleClearPin}
              disabled={disabled || isSubmitting}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Pin</span>
            </button>
          ) : (
            <button
              onClick={handleDropAtCenter}
              disabled={disabled || isSubmitting}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1 transition active:scale-95"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN AT CENTER</span>
            </button>
          )}
        </div>

        <button
          onClick={handleLockIn}
          disabled={!guessCoord || disabled || isSubmitting}
          className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md flex items-center gap-2 ${
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
