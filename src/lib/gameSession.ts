import { prisma } from '@/lib/db';

export function encodeGameId(locationIds: string[]): string {
  const payload = JSON.stringify(locationIds);
  return 'cg_' + Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeGameId(gameId: string): string[] | null {
  if (!gameId.startsWith('cg_')) return null;
  try {
    const raw = Buffer.from(gameId.slice(3), 'base64url').toString('utf8');
    const ids = JSON.parse(raw);
    if (Array.isArray(ids) && ids.length > 0) return ids;
  } catch {
    // Ignore parse error
  }
  return null;
}

export async function resolveGame(gameId: string) {
  // 1. Try to find existing game in local DB instance
  let game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      rounds: {
        include: { location: true },
        orderBy: { roundNumber: 'asc' },
      },
    },
  });

  if (game && game.rounds.length > 0) {
    return game;
  }

  // 2. If not found (e.g. request routed to a new serverless container instance):
  // Attempt to decode location IDs from the gameId token
  const decodedLocIds = decodeGameId(gameId);

  let targetLocIds: string[] = [];
  if (decodedLocIds) {
    targetLocIds = decodedLocIds;
  } else {
    // Fallback: pick 5 active locations to recover session seamlessly
    const activeLocs = await prisma.location.findMany({
      where: { active: true },
      take: 5,
    });
    targetLocIds = activeLocs.map((l) => l.id);
  }

  // Verify locations exist in database
  const existingLocations = await prisma.location.findMany({
    where: { id: { in: targetLocIds } },
  });

  // Preserve exact decoded order of targetLocIds
  const locMap = new Map(existingLocations.map((l) => [l.id, l]));
  let finalLocations = targetLocIds.map((id) => locMap.get(id)).filter(Boolean) as typeof existingLocations;

  // If some are missing (rare), fill with active locations
  if (finalLocations.length < 5) {
    const extraLocs = await prisma.location.findMany({
      where: { active: true, id: { notIn: finalLocations.map((l) => l.id) } },
      take: 5 - finalLocations.length,
    });
    finalLocations = [...finalLocations, ...extraLocs];
  }

  // Create game and rounds in this serverless container's DB
  try {
    game = await prisma.game.upsert({
      where: { id: gameId },
      update: {},
      create: {
        id: gameId,
        totalScore: 0,
        isFinished: false,
        rounds: {
          create: finalLocations.slice(0, 5).map((loc, idx) => ({
            roundNumber: idx + 1,
            locationId: loc.id,
          })),
        },
      },
      include: {
        rounds: {
          include: { location: true },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    return game;
  } catch (err) {
    console.error('Failed to auto-recover game session:', err);
    // Return existing if another parallel request created it
    return await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        rounds: {
          include: { location: true },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });
  }
}
