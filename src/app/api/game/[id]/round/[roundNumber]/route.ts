import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveGame } from '@/lib/gameSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roundNumber: string }> }
) {
  try {
    const { id: gameId, roundNumber: roundStr } = await params;
    const roundNumber = parseInt(roundStr, 10);

    if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 5) {
      return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
    }

    const game = await resolveGame(gameId);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const round = game.rounds.find((r) => r.roundNumber === roundNumber);

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }


    // Anti-cheat: NEVER reveal coordinates or location name before guess
    return NextResponse.json({
      gameId,
      roundNumber,
      totalRounds: 5,
      panoId: round.location.panoId,
      imageUrl: round.location.imageUrl,
      area: round.location.area,
      difficulty: round.location.difficulty,
      alreadyGuessed: round.guessLatitude !== null,
    });
  } catch (error: any) {
    console.error('Error fetching round:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
