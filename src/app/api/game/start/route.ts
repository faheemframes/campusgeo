import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // 1. Fetch active locations from DB
    const allLocations = await prisma.location.findMany({
      where: { active: true },
    });

    if (allLocations.length < 5) {
      return NextResponse.json(
        { error: 'Not enough active locations available to start a game.' },
        { status: 500 }
      );
    }

    // 2. Fisher-Yates shuffle to pick 5 unique locations
    const shuffled = [...allLocations].sort(() => 0.5 - Math.random());
    const selectedLocations = shuffled.slice(0, 5);

    // 3. Create Game session
    const game = await prisma.game.create({
      data: {
        totalScore: 0,
        isFinished: false,
        rounds: {
          create: selectedLocations.map((loc, index) => ({
            roundNumber: index + 1,
            locationId: loc.id,
          })),
        },
      },
      include: {
        rounds: {
          include: {
            location: true,
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    const firstRound = game.rounds[0];

    // Anti-cheat: NEVER reveal coordinates or location name before guess
    return NextResponse.json({
      gameId: game.id,
      totalRounds: 5,
      currentRound: 1,
      roundInfo: {
        roundNumber: 1,
        panoId: firstRound.location.panoId,
        area: firstRound.location.area,
        difficulty: firstRound.location.difficulty,
      },
    });
  } catch (error: any) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Failed to start game session.' },
      { status: 500 }
    );
  }
}
