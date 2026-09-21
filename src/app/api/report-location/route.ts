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

    const autoUpdate = body.autoUpdate !== false; // Default to true unless explicitly disabled

    const hasNewCoords =
      guessLatitude !== undefined &&
      guessLatitude !== null &&
      guessLongitude !== undefined &&
      guessLongitude !== null &&
      !isNaN(Number(guessLatitude)) &&
      !isNaN(Number(guessLongitude));

    let updatedLocation = null;
    let autoApplied = false;

    // Direct Crowdsourced Correction:
    // If the user provided coordinates and requested the update, apply it directly to the Location!
    // Safety check: ensure coordinates are within the broader KTR / Potheri geographic bounds (12.75 - 12.90 N, 79.95 - 80.15 E)
    if (autoUpdate && hasNewCoords) {
      const lat = Number(guessLatitude);
      const lon = Number(guessLongitude);

      const isWithinBounds =
        lat >= 12.75 && lat <= 12.90 && lon >= 79.95 && lon <= 80.15;

      if (isWithinBounds) {
        updatedLocation = await prisma.location.update({
          where: { id: locationId },
          data: {
            latitude: lat,
            longitude: lon,
          },
        }).catch((err) => {
          console.error('Failed to auto-update location coordinates:', err);
          return null;
        });

        if (updatedLocation) {
          autoApplied = true;
        }
      }
    }

    const report = await prisma.locationReport.create({
      data: {
        locationId,
        locationName: locationName || 'Unnamed Spot',
        actualLatitude: Number(actualLatitude),
        actualLongitude: Number(actualLongitude),
        guessLatitude: hasNewCoords ? Number(guessLatitude) : null,
        guessLongitude: hasNewCoords ? Number(guessLongitude) : null,
        reason: String(reason),
        note: note ? String(note).slice(0, 500) : null,
        status: autoApplied ? 'applied' : 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      autoApplied,
      updatedCoordinates: autoApplied
        ? {
            latitude: Number(guessLatitude),
            longitude: Number(guessLongitude),
          }
        : null,
      message: autoApplied
        ? 'Location coordinates have been updated instantly! Thank you for improving the map.'
        : 'Report submitted successfully. Thank you for helping improve SRM Campus Geo!',
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
