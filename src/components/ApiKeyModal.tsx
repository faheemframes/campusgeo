'use client';

import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        localStorage.getItem('CAMPUS_GEO_GOOGLE_API_KEY') ||
        '';
      setApiKey(existing);
      setHasSavedKey(!!existing.trim());
    }
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (apiKey.trim()) {
        localStorage.setItem('CAMPUS_GEO_GOOGLE_API_KEY', apiKey.trim());
        setHasSavedKey(true);
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onKeySaved?.();
          onClose();
          window.location.reload();
        }, 1200);
      } else {
        localStorage.removeItem('CAMPUS_GEO_GOOGLE_API_KEY');
        setHasSavedKey(false);
        onKeySaved?.();
        onClose();
        window.location.reload();
      }
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('CAMPUS_GEO_GOOGLE_API_KEY');
      setApiKey('');
      setHasSavedKey(false);
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-white flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Google Street View Setup</h2>
              <p className="text-xs text-slate-400">Live 360° Real Campus Imagery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanation */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed flex flex-col gap-2.5">
          <p>
            To stream <strong>official Google Street View</strong> 360° panoramas around SRM KTR (Tech Park, GST Road, UB, Hostels), Google requires a <strong>Google Maps Platform API key</strong> with the <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">Maps JavaScript API</code> enabled.
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Your key is stored locally in your browser session or .env.</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400">Current Mode:</span>
          {hasSavedKey ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Google Street View Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold bg-amber-950/50 border border-amber-800/60 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              No Key Configured (Photosphere Mode)
            </span>
          )}
        </div>

        {/* Key Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Google Maps API Key
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition font-mono"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          {hasSavedKey && (
            <button
              onClick={handleClear}
              className="py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 transition"
            >
              Clear Key
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>SAVED & ACTIVATING...</span>
              </>
            ) : (
              <span>ENABLE LIVE STREET VIEW</span>
            )}
          </button>
        </div>

        <a
          href="https://console.cloud.google.com/google/maps-apis/credentials"
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-[11px] text-slate-500 hover:text-amber-400 transition flex items-center justify-center gap-1 mt-1"
        >
          <span>Get a Google Maps API key from Google Cloud Console</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
