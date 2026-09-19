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

    // 2. Select 5 unique locations with escalating round difficulty
    const easy = allLocations.filter((l) => l.difficulty === 'easy').sort(() => 0.5 - Math.random());
    const medium = allLocations.filter((l) => l.difficulty === 'medium').sort(() => 0.5 - Math.random());
    const hard = allLocations.filter((l) => l.difficulty === 'hard').sort(() => 0.5 - Math.random());

    const chosen = new Set<string>();
    const pickOne = (pool: typeof allLocations): (typeof allLocations)[0] => {
      const available = pool.filter((l) => !chosen.has(l.id));
      const picked = available.length > 0 ? available[0] : allLocations.filter((l) => !chosen.has(l.id))[0];
      chosen.add(picked.id);
      return picked;
    };

    const selectedLocations = [
      pickOne(easy),           // Round 1: Easy (iconic wide view)
      pickOne([...easy, ...medium]), // Round 2: Easy-Medium
      pickOne(medium),         // Round 3: Medium (recent campus photo)
      pickOne([...medium, ...hard]), // Round 4: Medium-Hard
      pickOne(hard),           // Round 5: Hard (zoomed-in crop!)
    ];

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
        imageUrl: firstRound.location.imageUrl,
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
