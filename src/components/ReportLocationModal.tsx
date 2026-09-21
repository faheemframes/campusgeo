'use client';

import React, { useState } from 'react';
import { Flag, X, Check, MapPin, AlertTriangle, Send } from 'lucide-react';
import { formatDistance } from '@/lib/scoring';

interface ReportLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  actualLatitude: number;
  actualLongitude: number;
  guessLatitude?: number | null;
  guessLongitude?: number | null;
  distanceMeters?: number | null;
  imageUrl?: string | null;
}

export default function ReportLocationModal({
  isOpen,
  onClose,
  locationId,
  locationName,
  actualLatitude,
  actualLongitude,
  guessLatitude,
  guessLongitude,
  distanceMeters,
  imageUrl,
}: ReportLocationModalProps) {
  const [reason, setReason] = useState<string>('wrong_location');
  const [suggestMyGuess, setSuggestMyGuess] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [autoApplied, setAutoApplied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/report-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          locationName,
          actualLatitude,
          actualLongitude,
          guessLatitude: suggestMyGuess && guessLatitude ? guessLatitude : null,
          guessLongitude: suggestMyGuess && guessLongitude ? guessLongitude : null,
          reason,
          note,
          autoUpdate: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setAutoApplied(Boolean(data.autoApplied));
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setAutoApplied(false);
    setError(null);
    setNote('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report Incorrect Location"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-text"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Flag className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Think our pin was wrong?
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Lock in your pin & correct the map</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close report dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-bold text-white">
              {autoApplied ? 'Location Corrected & Locked In! 🎯' : 'Feedback Submitted!'}
            </h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              {autoApplied ? (
                <>
                  Awesome! Your pinned coordinates have been <strong className="text-emerald-400">directly applied</strong> to the live database for <strong className="text-white">{locationName}</strong>. All future games will now use this corrected pin!
                </>
              ) : (
                <>
                  Thank you for helping keep SRM Campus Geo accurate! Your report and suggested spot details have been recorded.
                </>
              )}
            </p>
            <button
              onClick={handleClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition active:scale-95"
            >
              Back to Game
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-3 flex flex-col gap-3.5 text-xs text-slate-300">
            {/* Spot summary */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.06] flex items-center gap-3">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={locationName}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Spot Name</span>
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {locationName}
                </p>
                {distanceMeters !== undefined && distanceMeters !== null && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    {formatDistance(distanceMeters)} difference from your guess
                  </span>
                )}
              </div>
            </div>

            {/* Use My Guess Option */}
            {guessLatitude && guessLongitude && (
              <label className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 cursor-pointer hover:bg-emerald-500/15 transition">
                <input
                  type="checkbox"
                  checked={suggestMyGuess}
                  onChange={(e) => setSuggestMyGuess(e.target.checked)}
                  className="mt-0.5 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-slate-900 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Lock in my pin as the correct location (instant update)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Coordinates: <span className="font-mono text-slate-300">{guessLatitude.toFixed(6)}, {guessLongitude.toFixed(6)}</span>
                  </p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">
                    ⚡ This will immediately calibrate this spot so upcoming games use your pin!
                  </p>
                </div>
              </label>
            )}

            {/* Reason selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                What is wrong?
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setReason('wrong_location')}
                  className={
                    reason === 'wrong_location'
                      ? 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-slate-950/40 border-white/[0.06] text-slate-400 hover:text-white'
                  }
                >
                  📍 Pin is off on map
                </button>
                <button
                  type="button"
                  onClick={() => setReason('wrong_name')}
                  className={
                    reason === 'wrong_name'
                      ? 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-slate-950/40 border-white/[0.06] text-slate-400 hover:text-white'
                  }
                >
                  🏷️ Wrong spot name
                </button>
                <button
                  type="button"
                  onClick={() => setReason('wrong_photo')}
                  className={
                    reason === 'wrong_photo'
                      ? 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-slate-950/40 border-white/[0.06] text-slate-400 hover:text-white'
                  }
                >
                  📷 Photo mismatch
                </button>
                <button
                  type="button"
                  onClick={() => setReason('other')}
                  className={
                    reason === 'other'
                      ? 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-left transition bg-slate-950/40 border-white/[0.06] text-slate-400 hover:text-white'
                  }
                >
                  💬 Other issue
                </button>
              </div>
            </div>

            {/* Note input */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Note (Optional)
              </span>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Dr. TP Ganesan Auditorium is opposite Tech Park, not near railway..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {error && (
              <div className="p-2 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit CTA */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
