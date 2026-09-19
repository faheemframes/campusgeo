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

    // 2. Select 5 diverse, non-repeating landmarks across campus
    // Helper to get landmark cluster key so we never pick two angles of the same building in one game
    const getLandmarkCluster = (id: string, name: string) => {
      const lower = (id + ' ' + name).toLowerCase();
      if (lower.includes('auditorium')) return 'auditorium';
      if (lower.includes('tech_park') || lower.includes('tech park')) return 'tech_park';
      if (lower.includes('potheri')) return 'potheri';
      if (lower.includes('java') || lower.includes('clock_tower')) return 'java';
      if (lower.includes('bio')) return 'bioengineering';
      if (lower.includes('academic')) return 'academic_block';
      if (lower.includes('kattankulathur') || lower.includes('station')) return 'station';
      if (lower.includes('hostel') || lower.includes('paari') || lower.includes('oori')) return 'hostel';
      return id;
    };

    const shuffled = [...allLocations].sort(() => Math.random() - 0.5);
    const selectedLocations: typeof allLocations = [];
    const chosenClusters = new Set<string>();
    const chosenImages = new Set<string>();

    for (const loc of shuffled) {
      if (selectedLocations.length >= 5) break;
      const cluster = getLandmarkCluster(loc.id, loc.name);
      const img = loc.imageUrl || loc.panoId;

      if (!chosenClusters.has(cluster) && !chosenImages.has(img)) {
        chosenClusters.add(cluster);
        chosenImages.add(img);
        selectedLocations.push(loc);
      }
    }

    // Fallback: fill up to 5 if needed
    if (selectedLocations.length < 5) {
      for (const loc of shuffled) {
        if (selectedLocations.length >= 5) break;
        if (!selectedLocations.some((s) => s.id === loc.id)) {
          selectedLocations.push(loc);
        }
      }
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
