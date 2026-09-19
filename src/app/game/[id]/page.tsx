'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import PanoramaViewer from '@/components/PanoramaViewer';
import GuessMap from '@/components/GuessMap';
import RoundResultModal from '@/components/RoundResultModal';
import FinalResultView from '@/components/FinalResultView';

interface RoundInfo {
  roundNumber: number;
  panoId: string;
  imageUrl?: string;
  area: string;
  difficulty: string;
}

interface CompletedRound {
  roundNumber: number;
  score: number;
  distanceMeters: number;
  locationName: string;
  imageUrl?: string;
  actualLatitude: number;
  actualLongitude: number;
  guessLatitude: number;
  guessLongitude: number;
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const router = useRouter();

  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [totalRounds] = useState<number>(5);
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [isLoadingRound, setIsLoadingRound] = useState<boolean>(true);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Round result modal state
  const [activeResult, setActiveResult] = useState<CompletedRound | null>(null);

  // Completed rounds tracking
  const [completedRounds, setCompletedRounds] = useState<CompletedRound[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);

  // Mobile adaptive layout state ('split' | 'photo' | 'map')
  const [mobileMode, setMobileMode] = useState<'split' | 'photo' | 'map'>('split');
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileScreen(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch round info
  const fetchRound = async (roundNum: number) => {
    setIsLoadingRound(true);
    setError(null);
    try {
      const res = await fetch(`/api/game/${gameId}/round/${roundNum}`);
      if (!res.ok) {
        throw new Error('Failed to load round details');
      }
      const data = await res.json();
      setRoundInfo({
        roundNumber: data.roundNumber,
        panoId: data.panoId,
        imageUrl: data.imageUrl,
        area: data.area,
        difficulty: data.difficulty,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching round');
    } finally {
      setIsLoadingRound(false);
    }
  };

  useEffect(() => {
    fetchRound(currentRoundNumber);
  }, [gameId, currentRoundNumber]);

  // Handle guess submission
  const handleLockGuess = async (guessLat: number, guessLng: number) => {
    if (isSubmittingGuess || !roundInfo) return;
    setIsSubmittingGuess(true);

    try {
      const res = await fetch(`/api/game/${gameId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundNumber: currentRoundNumber,
          guessLatitude: guessLat,
          guessLongitude: guessLng,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit guess');
      }

      const data = await res.json();

      const completed: CompletedRound = {
        roundNumber: data.roundNumber,
        score: data.score,
        distanceMeters: data.distanceMeters,
        locationName: data.locationName,
        imageUrl: data.imageUrl || roundInfo?.imageUrl,
        actualLatitude: data.actualLatitude,
        actualLongitude: data.actualLongitude,
        guessLatitude: guessLat,
        guessLongitude: guessLng,
      };

      setActiveResult(completed);
      setCompletedRounds((prev) => [...prev, completed]);
      setTotalScore(data.totalGameScore);

      if (data.isGameOver || currentRoundNumber >= 5) {
        setIsGameOver(true);
      }
    } catch (err: any) {
      alert(err.message || 'Error locking guess');
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  const handleNextRound = () => {
    setActiveResult(null);
    if (isGameOver) {
      // Final result screen will render automatically
    } else {
      setCurrentRoundNumber((prev) => prev + 1);
    }
  };

  const handlePlayAgain = async () => {
    try {
      const res = await fetch('/api/game/start', { method: 'POST' });
      if (!res.ok) throw new Error('Could not start new game');
      const data = await res.json();
      router.push(`/game/${data.gameId}`);
    } catch {
      router.push('/');
    }
  };

  // If game is over and round result modal is dismissed, render Final Result View
  if (isGameOver && !activeResult) {
    return (
      <FinalResultView
        totalScore={totalScore}
        rounds={completedRounds}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
        <p className="text-red-400 font-bold mb-4">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-slate-950 flex flex-col sm:block">
      {/* Mobile Mode Switcher Toolbar (Visible on small screens) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 sm:hidden flex items-center bg-slate-900/95 border border-slate-700/80 rounded-full p-1 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setMobileMode('photo')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
            mobileMode === 'photo'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📷 Photo
        </button>
        <button
          onClick={() => setMobileMode('split')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
            mobileMode === 'split'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ↕️ Both
        </button>
        <button
          onClick={() => setMobileMode('map')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
            mobileMode === 'map'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🗺️ Map
        </button>
      </div>

      {/* Campus Photo Viewport */}
      <div
        className={`w-full transition-all duration-200 ${
          mobileMode === 'split'
            ? 'h-[50%] sm:h-full sm:w-full sm:absolute sm:inset-0'
            : mobileMode === 'photo'
            ? 'h-full sm:h-full sm:w-full sm:absolute sm:inset-0'
            : 'hidden sm:block sm:h-full sm:w-full sm:absolute sm:inset-0'
        }`}
      >
        {roundInfo && (
          <PanoramaViewer
            key={`pano-${roundInfo.panoId}`}
            panoId={roundInfo.panoId}
            imageUrl={roundInfo.imageUrl}
            areaHint={roundInfo.area}
            difficulty={roundInfo.difficulty}
            roundNumber={currentRoundNumber}
            totalRounds={totalRounds}
          />
        )}
      </div>

      {/* Satellite Guess Map */}
      <div
        className={`w-full transition-all duration-200 z-30 ${
          mobileMode === 'split'
            ? 'h-[50%] sm:h-auto sm:w-auto sm:absolute sm:bottom-4 sm:right-4'
            : mobileMode === 'map'
            ? 'h-full sm:h-auto sm:w-auto sm:absolute sm:bottom-4 sm:right-4'
            : 'hidden sm:block sm:h-auto sm:w-auto sm:absolute sm:bottom-4 sm:right-4'
        }`}
      >
        <GuessMap
          roundNumber={currentRoundNumber}
          onLockGuess={handleLockGuess}
          isSubmitting={isSubmittingGuess}
          disabled={activeResult !== null}
          isMobileMode={isMobileScreen}
        />
      </div>

      {/* Round Result Modal */}
      {activeResult && (
        <RoundResultModal
          roundNumber={activeResult.roundNumber}
          totalRounds={totalRounds}
          score={activeResult.score}
          distanceMeters={activeResult.distanceMeters}
          actualLatitude={activeResult.actualLatitude}
          actualLongitude={activeResult.actualLongitude}
          guessLatitude={activeResult.guessLatitude}
          guessLongitude={activeResult.guessLongitude}
          locationName={activeResult.locationName}
          imageUrl={activeResult.imageUrl}
          isGameOver={isGameOver}
          onNext={handleNextRound}
        />
      )}
    </main>
  );
}
