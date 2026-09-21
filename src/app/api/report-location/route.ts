import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      locationId,
      locationName,
      actualLatitude,
      actualLongitude,
      guessLatitude,
      guessLongitude,
      reason = 'wrong_location',
      note = '',
    } = body;

    if (!locationId || actualLatitude === undefined || actualLongitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required location data' },
        { status: 400 }
      );
    }

    const report = await prisma.locationReport.create({
      data: {
        locationId,
        locationName: locationName || 'Unnamed Spot',
        actualLatitude: Number(actualLatitude),
        actualLongitude: Number(actualLongitude),
        guessLatitude: guessLatitude !== undefined && guessLatitude !== null ? Number(guessLatitude) : null,
        guessLongitude: guessLongitude !== undefined && guessLongitude !== null ? Number(guessLongitude) : null,
        reason: String(reason),
        note: note ? String(note).slice(0, 500) : null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully. Thank you for helping improve SRM Campus Geo!',
    });
  } catch (error: any) {
    console.error('Failed to submit location report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET reports for admin
export async function GET(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key');
    const validKey = process.env.ADMIN_SECRET_KEY || 'srm_campusgeo_admin_secret_2026';

    if (adminKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await prisma.locationReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            latitude: true,
            longitude: true,
            area: true,
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// PATCH to apply or dismiss a report
export async function PATCH(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key');
    const validKey = process.env.ADMIN_SECRET_KEY || 'srm_campusgeo_admin_secret_2026';

    if (adminKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportId, action, newLatitude, newLongitude } = body;

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Missing reportId or action' }, { status: 400 });
    }

    const report = await prisma.locationReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (action === 'apply') {
      const targetLat = newLatitude !== undefined ? Number(newLatitude) : report.guessLatitude;
      const targetLon = newLongitude !== undefined ? Number(newLongitude) : report.guessLongitude;

      if (targetLat === null || targetLon === null || isNaN(targetLat) || isNaN(targetLon)) {
        return NextResponse.json(
          { error: 'Cannot apply: no valid replacement coordinates provided' },
          { status: 400 }
        );
      }

      // Update location coordinates
      await prisma.location.update({
        where: { id: report.locationId },
        data: {
          latitude: targetLat,
          longitude: targetLon,
        },
      });

      // Mark report as applied
      const updatedReport = await prisma.locationReport.update({
        where: { id: reportId },
        data: { status: 'applied' },
      });

      return NextResponse.json({
        success: true,
        message: 'Location coordinates successfully updated!',
        report: updatedReport,
      });
    }

    if (action === 'dismiss') {
      const updatedReport = await prisma.locationReport.update({
        where: { id: reportId },
        data: { status: 'dismissed' },
      });

      return NextResponse.json({
        success: true,
        message: 'Report dismissed.',
        report: updatedReport,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update report' },
      { status: 500 }
    );
  }
}
