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
  area: string;
  difficulty: string;
}

interface CompletedRound {
  roundNumber: number;
  score: number;
  distanceMeters: number;
  locationName: string;
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
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 360 Panorama Viewport */}
      {roundInfo && (
        <PanoramaViewer
          key={`pano-${roundInfo.panoId}`}
          panoId={roundInfo.panoId}
          areaHint={roundInfo.area}
          roundNumber={currentRoundNumber}
          totalRounds={totalRounds}
        />
      )}

      {/* Floating Guess Map (Bottom Right / Mobile Bottom Sheet) */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
        <GuessMap
          onLockGuess={handleLockGuess}
          isSubmitting={isSubmittingGuess}
          disabled={activeResult !== null}
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
          isGameOver={isGameOver}
          onNext={handleNextRound}
        />
      )}
    </main>
  );
}
