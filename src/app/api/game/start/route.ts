import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encodeGameId } from '@/lib/gameSession';

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

    // 2. Select 5 geographically distant locations with escalating difficulty
    // Zones: South Campus, North Campus, Potheri / West, Central Campus, East Academic
    const zones = ['South Campus', 'North Campus', 'Potheri / West', 'Central Campus', 'East Academic']
      .sort(() => 0.5 - Math.random());

    const selectedLocations: typeof allLocations = [];
    const chosenIds = new Set<string>();

    const targetDifficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];

    for (let i = 0; i < 5; i++) {
      const targetZone = zones[i % zones.length];
      const targetDiff = targetDifficulties[i];

      // Prefer candidates matching the target zone and difficulty
      let pool = allLocations.filter(
        (l) => !chosenIds.has(l.id) && l.area === targetZone && l.difficulty === targetDiff
      );

      // Fallback 1: Any unused location in target zone
      if (pool.length === 0) {
        pool = allLocations.filter((l) => !chosenIds.has(l.id) && l.area === targetZone);
      }

      // Fallback 2: Any unused location in target difficulty that is far from previous picks
      if (pool.length === 0) {
        pool = allLocations.filter((l) => !chosenIds.has(l.id));
      }

      // Sort candidate by distance from previous picked location (maximize distance)
      if (selectedLocations.length > 0) {
        const lastLoc = selectedLocations[selectedLocations.length - 1];
        pool.sort((a, b) => {
          const distA = Math.hypot(a.latitude - lastLoc.latitude, a.longitude - lastLoc.longitude);
          const distB = Math.hypot(b.latitude - lastLoc.latitude, b.longitude - lastLoc.longitude);
          return distB - distA; // Furthest first
        });
      } else {
        pool.sort(() => 0.5 - Math.random());
      }

      const picked = pool[0];
      chosenIds.add(picked.id);
      selectedLocations.push(picked);
    }

    const gameId = encodeGameId(selectedLocations.map((loc) => loc.id));

    // 3. Create Game session
    const game = await prisma.game.create({
      data: {
        id: gameId,
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
