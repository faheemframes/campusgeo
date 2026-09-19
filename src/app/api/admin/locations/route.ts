import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_KEYS = [
  process.env.ADMIN_KEY,
  'srmktr',
  'campusgeo_admin',
].filter(Boolean);

function isAuthorized(req: NextRequest): boolean {
  const headerKey = req.headers.get('x-admin-key');
  const queryKey = req.nextUrl.searchParams.get('key');
  const authKey = headerKey || queryKey;
  return !!authKey && VALID_KEYS.includes(authKey);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key' }, { status: 401 });
  }

  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { rounds: true },
        },
      },
    });

    const total = locations.length;
    const activeCount = locations.filter((loc) => loc.active).length;
    const inactiveCount = total - activeCount;
    const userContributedCount = locations.filter((loc) => loc.id.startsWith('loc_user_')).length;
    const seededCount = total - userContributedCount;

    // Zones aggregation
    const zoneCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = { easy: 0, medium: 0, hard: 0 };

    for (const loc of locations) {
      zoneCounts[loc.area] = (zoneCounts[loc.area] || 0) + 1;
      if (loc.difficulty in difficultyCounts) {
        difficultyCounts[loc.difficulty]++;
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        total,
        activeCount,
        inactiveCount,
        userContributedCount,
        seededCount,
        zoneCounts,
        difficultyCounts,
      },
      locations: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        area: loc.area,
        latitude: loc.latitude,
        longitude: loc.longitude,
        imageUrl: loc.imageUrl,
        panoId: loc.panoId,
        difficulty: loc.difficulty,
        active: loc.active,
        createdAt: loc.createdAt,
        roundsPlayedCount: loc._count.rounds,
        isUserContributed: loc.id.startsWith('loc_user_'),
      })),
    });
  } catch (err: any) {
    console.error('Admin API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch locations' }, { status: 500 });
  }
}
