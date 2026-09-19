import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateHaversineDistance, calculateScore } from '@/lib/scoring';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const body = await request.json();
    const { roundNumber, guessLatitude, guessLongitude } = body;

    if (
      typeof roundNumber !== 'number' ||
      typeof guessLatitude !== 'number' ||
      typeof guessLongitude !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid payload: roundNumber, guessLatitude, and guessLongitude are required.' },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        rounds: {
          include: { location: true },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const round = game.rounds.find((r) => r.roundNumber === roundNumber);
    if (!round) {
      return NextResponse.json({ error: 'Round not found in game session' }, { status: 404 });
    }

    // Calculate server-side distance and score
    const distanceMeters = calculateHaversineDistance(
      guessLatitude,
      guessLongitude,
      round.location.latitude,
      round.location.longitude
    );

    const score = calculateScore(distanceMeters);

    // Update round with guess and score
    await prisma.round.update({
      where: { id: round.id },
      data: {
        guessLatitude,
        guessLongitude,
        distanceMeters,
        score,
      },
    });

    // Recompute total game score
    const updatedRounds = await prisma.round.findMany({
      where: { gameId },
    });

    const totalGameScore = updatedRounds.reduce((acc, r) => acc + (r.score ?? 0), 0);
    const completedRoundsCount = updatedRounds.filter((r) => r.score !== null).length;
    const isGameOver = completedRoundsCount >= 5;

    await prisma.game.update({
      where: { id: gameId },
      data: {
        totalScore: totalGameScore,
        isFinished: isGameOver,
      },
    });

    // Return reveal payload
    return NextResponse.json({
      roundNumber,
      score,
      distanceMeters,
      actualLatitude: round.location.latitude,
      actualLongitude: round.location.longitude,
      locationName: round.location.name,
      locationArea: round.location.area,
      totalGameScore,
      isGameOver,
      hasNextRound: roundNumber < 5,
    });
  } catch (error: any) {
    console.error('Error recording guess:', error);
    return NextResponse.json({ error: 'Failed to evaluate guess.' }, { status: 500 });
  }
}
