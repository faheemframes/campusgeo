import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveGame } from '@/lib/gameSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    const game = await resolveGame(gameId);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({
      gameId: game.id,
      totalScore: game.totalScore,
      isFinished: game.isFinished,
      createdAt: game.createdAt,
      rounds: game.rounds.map((r) => ({
        roundNumber: r.roundNumber,
        score: r.score,
        distanceMeters: r.distanceMeters,
        locationName: r.score !== null ? r.location.name : null,
        locationArea: r.location.area,
        actualLatitude: r.score !== null ? r.location.latitude : null,
        actualLongitude: r.score !== null ? r.location.longitude : null,
        guessLatitude: r.guessLatitude,
        guessLongitude: r.guessLongitude,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching game summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
