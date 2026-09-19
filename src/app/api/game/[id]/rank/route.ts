import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculatePlayerRank } from '@/lib/ranking';
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

    const rankStats = await calculatePlayerRank(game.totalScore);
    return NextResponse.json({
      gameId: game.id,
      totalScore: game.totalScore,
      isFinished: game.isFinished,
      ...rankStats,
    });
  } catch (error: any) {
    console.error('Error fetching game rank:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
