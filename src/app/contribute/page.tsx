'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Upload, MapPin, CheckCircle2, AlertCircle, Sparkles, Navigation } from 'lucide-react';
import { extractGpsFromImage } from '@/lib/exif';
import type * as LType from 'leaflet';

const SRM_CENTER_LAT = 12.8236;
const SRM_CENTER_LNG = 80.0445;

export default function ContributePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [spotName, setSpotName] = useState('');
  const [area, setArea] = useState('SRM & Surrounds');
  const [difficulty, setDifficulty] = useState('medium');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsDetected, setGpsDetected] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Initialize interactive Leaflet Satellite map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;

      const southWest = L.latLng(12.790, 80.010);
      const northEast = L.latLng(12.860, 80.075);
      const bounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapContainerRef.current, {
        center: coords ? [coords.lat, coords.lng] : [SRM_CENTER_LAT, SRM_CENTER_LNG],
        zoom: coords ? 18.5 : 17.5,
        minZoom: 14,
        maxZoom: 19,
        maxBounds: bounds,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      // Click to place or move marker
      map.on('click', (e: LType.LeafletMouseEvent) => {
        setCoords({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
        updateMapMarker(e.latlng.lat, e.latlng.lng, map, L);
      });

      if (coords) {
        updateMapMarker(coords.lat, coords.lng, map, L);
      }
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

  const updateMapMarker = (
    lat: number,
    lng: number,
    map = mapInstanceRef.current,
    L?: any
  ) => {
    if (!map) return;

    import('leaflet').then((leafletMod) => {
      const LInstance = L || leafletMod;
      const pinIcon = LInstance.divIcon({
        className: 'custom-guess-pin',
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

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = LInstance.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        marker.on('dragend', (evt: any) => {
          const pos = evt.target.getLatLng();
          setCoords({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
        });
        markerRef.current = marker;
      }
      map.panTo([lat, lng]);
    });
  };

  // Handle file selection & EXIF GPS auto-detection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setGpsDetected(false);

    // Try extracting EXIF GPS coordinates
    const gps = await extractGpsFromImage(file);
    if (gps) {
      setCoords({ lat: gps.latitude, lng: gps.longitude });
      setGpsDetected(true);
      if (mapInstanceRef.current) {
        updateMapMarker(gps.latitude, gps.longitude);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose or snap a photo');
      return;
    }
    if (!spotName.trim()) {
      setError('Please enter a spot name');
      return;
    }
    if (!coords) {
      setError('Please tap the exact spot on the map to place a pin');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Compress image client-side to keep payload lightweight and fast
      const compressedBlob = await new Promise<Blob>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob || selectedFile), 'image/jpeg', 0.82);
          } else {
            resolve(selectedFile);
          }
        };
        img.onerror = () => resolve(selectedFile);
        img.src = URL.createObjectURL(selectedFile);
      });

      const formData = new FormData();
      formData.append('file', compressedBlob, 'photo.jpg');
      formData.append('name', spotName.trim());
      formData.append('latitude', coords.lat.toString());
      formData.append('longitude', coords.lng.toString());
      formData.append('area', area);
      formData.append('difficulty', difficulty);

      const res = await fetch('/api/contribute', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit spot');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong submitting your spot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">
            Spot Added Successfully!
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            <span className="font-semibold text-amber-300">"{spotName}"</span> is now part of the active Campus Geo pool. Other players can now guess your spot!
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              Play Game Now
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedFile(null);
                setPreviewUrl(null);
                setSpotName('');
                setCoords(null);
                setGpsDetected(false);
                if (markerRef.current) {
                  markerRef.current.remove();
                  markerRef.current = null;
                }
              }}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition"
            >
              Contribute Another Spot
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center p-4 sm:p-6 select-none relative">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-xl flex items-center justify-between py-3 mb-4 z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Community Spots</span>
        </div>
      </header>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col gap-5 z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Add a Campus Spot</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Snap or upload a photo at SRM KTR, pinpoint where you stood, and add it to the game pool.
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-600/50 text-rose-200 px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Photo Upload */}
        {/* Step 1: Photo Upload */}
        <div className="flex flex-col gap-2">
          <label htmlFor="landmark-photo-upload" className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Photo of Landmark
          </label>
          <input
            ref={fileInputRef}
            id="landmark-photo-upload"
            type="file"
            accept="image/*"
            capture="environment"
            aria-label="Upload photo of campus landmark"
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group">
              <img src={previewUrl} alt="Preview of uploaded campus spot" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change uploaded landmark photo"
                className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition"
              >
                Tap to Change Photo
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Snap or upload campus photo"
              className="w-full h-40 border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer bg-slate-950/50 hover:bg-slate-950/80 transition text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-2 text-amber-400">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-200">
                Snap or Upload Campus Photo
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Auto-reads phone camera GPS if available
              </p>
            </div>
          )}

          {/* GPS Detection Status */}
          {selectedFile && (
            <div
              className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
                gpsDetected
                  ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              <MapPin className={`w-4 h-4 ${gpsDetected ? 'text-emerald-400' : 'text-slate-500'}`} />
              {gpsDetected ? (
                <span>📍 GPS coordinates auto-detected from photo!</span>
              ) : (
                <span>No GPS tag found — please tap your spot on the satellite map below.</span>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Interactive Pin Map */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Pin Location on Satellite
            </span>
            {coords && (
              <span className="text-[11px] font-mono text-emerald-400">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            )}
          </div>
          <div className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 relative">
            <div ref={mapContainerRef} className="w-full h-full" />
            {!coords && (
              <div className="absolute top-2 left-2 z-[500] bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[11px] text-amber-300 font-medium">
                Tap anywhere on campus to drop pin
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Spot Information */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3. Spot Details
          </span>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="spot-name" className="text-xs text-slate-300 font-medium">
              Landmark / Spot Name
            </label>
            <input
              id="spot-name"
              type="text"
              required
              placeholder="e.g. Mechanical Lab Portico, Tech Park 4th Floor"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="spot-area" className="text-xs text-slate-300 font-medium">
                Area / Neighborhood (Optional)
              </label>
              <input
                id="spot-area"
                type="text"
                placeholder="e.g. Abode Valley, Estancia, Potheri, Tech Park..."
                value={area === 'SRM & Surrounds' ? '' : area}
                onChange={(e) => setArea(e.target.value.trim() || 'SRM & Surrounds')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-300 font-medium">Difficulty Level</span>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-700">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    aria-label={`Select difficulty: ${d}`}
                    className={`py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      difficulty === d
                        ? d === 'hard'
                          ? 'bg-rose-500 text-white shadow'
                          : d === 'medium'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Saving Spot...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Submit to Game Pool</span>
            </>
          )}
        </button>
      </form>
    </main>
  );
}
