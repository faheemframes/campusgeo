import { prisma } from '@/lib/db';
import { selectDistinctGameLocations } from '@/lib/locationSelection';

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
  // Fetch active locations
  const allActiveLocs = await prisma.location.findMany({
    where: { active: true },
  });

  // Attempt to decode location IDs from the gameId token
  const decodedLocIds = decodeGameId(gameId);
  const locMap = new Map(allActiveLocs.map((l) => [l.id, l]));

  let candidateLocs = (decodedLocIds || [])
    .map((id) => locMap.get(id))
    .filter(Boolean) as typeof allActiveLocs;

  // Strict deduplication by Image URL and Location ID
  const chosenImages = new Set<string>();
  const chosenIds = new Set<string>();
  const uniqueLocs: typeof allActiveLocs = [];

  for (const loc of candidateLocs) {
    const img = (loc.imageUrl || loc.panoId).trim();
    if (!chosenImages.has(img) && !chosenIds.has(loc.id)) {
      chosenImages.add(img);
      chosenIds.add(loc.id);
      uniqueLocs.push(loc);
    }
  }

  // If fewer than 5 unique locations, fill with distinct active locations
  let finalLocations = uniqueLocs;
  if (finalLocations.length < 5) {
    const pool = allActiveLocs.filter(
      (l) => !chosenImages.has((l.imageUrl || l.panoId).trim()) && !chosenIds.has(l.id)
    );
    const fillers = selectDistinctGameLocations(pool, 5 - finalLocations.length);
    finalLocations = [...finalLocations, ...fillers];
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
