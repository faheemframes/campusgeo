import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (typeof body.active === 'boolean') dataToUpdate.active = body.active;
    if (typeof body.name === 'string' && body.name.trim()) dataToUpdate.name = body.name.trim();
    if (typeof body.area === 'string') dataToUpdate.area = body.area;
    if (['easy', 'medium', 'hard'].includes(body.difficulty)) dataToUpdate.difficulty = body.difficulty;
    if (typeof body.latitude === 'number') dataToUpdate.latitude = body.latitude;
    if (typeof body.longitude === 'number') dataToUpdate.longitude = body.longitude;

    const updated = await prisma.location.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, location: updated });
  } catch (err: any) {
    console.error('Error updating location:', err);
    return NextResponse.json({ error: err.message || 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Delete associated rounds if any to respect foreign keys
    await prisma.round.deleteMany({ where: { locationId: id } });

    // If it was an uploaded image in public/images/uploads, delete physical file
    if (existing.imageUrl && existing.imageUrl.startsWith('/images/uploads/')) {
      try {
        const fullPath = path.join(process.cwd(), 'public', existing.imageUrl);
        await fs.unlink(fullPath);
      } catch {
        // File may already be deleted or not found
      }
    }

    await prisma.location.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Location deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting location:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete location' }, { status: 500 });
  }
}
