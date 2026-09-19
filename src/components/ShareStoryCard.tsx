'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Share2, Download, Copy, Check, X, Sparkles } from 'lucide-react';
import { formatDistance } from '@/lib/scoring';

interface ShareRound {
  roundNumber: number;
  score: number;
  distanceMeters: number;
  locationName: string;
}

interface ShareStoryCardProps {
  totalScore: number;
  maxScore?: number;
  rounds: ShareRound[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareStoryCard({
  totalScore,
  maxScore = 25000,
  rounds,
  isOpen,
  onClose,
}: ShareStoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Generate 1080x1920 high-res Story Card on canvas
  useEffect(() => {
    if (!isOpen) return;

    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient: Deep Slate & Campus Night
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.45, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient glow orbs behind score
    const radialGrad = ctx.createRadialGradient(
      width / 2,
      750,
      50,
      width / 2,
      750,
      500
    );
    radialGrad.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
    radialGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 300, width, 900);

    // Geometric Grid Lines (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for (let y = 100; y < height; y += 120) {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(width - 80, y);
      ctx.stroke();
    }

    // Top Card Border Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // 1. BRAND HEADER: CAMPUS GEO
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('CAMPUS GEO', width / 2, 220);

    // Location Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('📍 SRM KTR', width / 2, 280);

    // 2. HERO "I SCORED" SECTION
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 38px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('I SCORED', width / 2, 540);

    // Big Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 130px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '-2px';
    ctx.fillText(totalScore.toLocaleString(), width / 2, 690);

    // Score Denominator
    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`/ ${maxScore.toLocaleString()}`, width / 2, 770);

    // Tier badge
    let tier = 'CAMPUS ROOKIE';
    let tierColor = '#94a3b8';
    if (totalScore >= 22000) {
      tier = '🏆 CAMPUS LEGEND';
      tierColor = '#fbbf24';
    } else if (totalScore >= 18000) {
      tier = '⚡ PRO NAVIGATOR';
      tierColor = '#38bdf8';
    } else if (totalScore >= 12000) {
      tier = '🧭 CAMPUS EXPLORER';
      tierColor = '#34d399';
    }

    // Pill badge background
    const pillW = 420;
    const pillH = 70;
    const pillX = (width - pillW) / 2;
    const pillY = 830;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 35);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();

    ctx.fillStyle = tierColor;
    ctx.font = '800 30px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(tier, width / 2, pillY + 46);

    // 3. 5-ROUND BREAKDOWN CONTAINER
    const boxY = 980;
    const boxW = width - 200;
    const boxH = 560;
    const boxX = 100;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Rounds Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '800 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('5 ROUNDS BREAKDOWN', boxX + 40, boxY + 60);

    // Each Round Row
    const rowHeight = 85;
    rounds.slice(0, 5).forEach((round, idx) => {
      const ry = boxY + 120 + idx * rowHeight;

      // Round number circle
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(boxX + 60, ry, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '700 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`R${round.roundNumber}`, boxX + 60, ry + 7);

      // Landmark name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 26px -apple-system, BlinkMacSystemFont, sans-serif';
      const maxTextW = 440;
      let text = round.locationName || `Location ${round.roundNumber}`;
      if (ctx.measureText(text).width > maxTextW) {
        text = text.slice(0, 22) + '...';
      }
      ctx.fillText(text, boxX + 110, ry + 8);

      // Score & Distance on Right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f59e0b';
      ctx.font = '800 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${round.score.toLocaleString()} pts`, boxX + boxW - 40, ry);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(formatDistance(round.distanceMeters), boxX + boxW - 40, ry + 24);
    });

    // 4. FOOTER CALLOUT
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 40px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Can you beat me?', width / 2, 1650);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('play at campusgeo.vercel.app', width / 2, 1720);

    const dataUrl = canvas.toDataURL('image/png');
    setImagePreviewUrl(dataUrl);
  }, [isOpen, totalScore, maxScore, rounds]);

  const handleNativeShare = async () => {
    if (!imagePreviewUrl) return;
    setIsSharing(true);

    try {
      const blob = await (await fetch(imagePreviewUrl)).blob();
      const file = new File([blob], 'campusgeo-srm-score.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Campus Geo — SRM KTR',
          text: `I scored ${totalScore.toLocaleString()} / 25,000 on Campus Geo (SRM KTR)! Can you beat me?`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Campus Geo — SRM KTR',
          text: `I scored ${totalScore.toLocaleString()} / 25,000 on Campus Geo (SRM KTR)! Can you beat me?`,
          url: window.location.origin,
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Sharing cancelled or failed:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    if (!imagePreviewUrl) return;
    const a = document.createElement('a');
    a.href = imagePreviewUrl;
    a.download = `campusgeo-srm-${totalScore}-score.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    const text = `I scored ${totalScore.toLocaleString()} / 25,000 on Campus Geo (SRM KTR)! Can you beat me? ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white tracking-wide">
              Instagram Story Card (9:16)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 9:16 Card Preview */}
        <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center bg-slate-950/50">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Campus Geo SRM KTR Story Card"
              className="w-auto max-h-[58vh] rounded-2xl shadow-2xl border border-slate-700/60 object-contain aspect-[9/16]"
            />
          ) : (
            <div className="w-48 h-80 rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-xs">
              Generating 9:16 card...
            </div>
          )}
        </div>

        {/* Share Action Buttons */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-2.5">
          <button
            onClick={handleNativeShare}
            disabled={isSharing || !imagePreviewUrl}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>SHARE TO STORY</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SAVE IMAGE</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY LINK</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
