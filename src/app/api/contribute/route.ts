import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const latitudeRaw = formData.get('latitude') as string | null;
    const longitudeRaw = formData.get('longitude') as string | null;
    const area = formData.get('area') as string | null;
    const difficulty = (formData.get('difficulty') as string) || 'medium';

    if (!file) {
      return NextResponse.json({ error: 'Photo file is required' }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Spot name is required' }, { status: 400 });
    }

    const latitude = parseFloat(latitudeRaw || '');
    const longitude = parseFloat(longitudeRaw || '');

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Valid latitude and longitude are required' }, { status: 400 });
    }

    // Validate bounds covering SRM KTR campus, Abode Valley, Estancia, Potheri & GST Road surrounds
    if (latitude < 12.790 || latitude > 12.860 || longitude < 80.010 || longitude > 80.075) {
      return NextResponse.json(
        { error: 'Coordinates are outside the SRM KTR & surrounding student area (Lat: 12.790–12.860, Lng: 80.010–80.075)' },
        { status: 400 }
      );
    }

    const chosenArea = (area && area.trim().length > 0) ? area.trim() : 'SRM & Surrounds';


    const safeId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';
    let imageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // If running with writable local disk, also write to public/images/uploads/
    if (!process.env.VERCEL) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        const extension = file.type === 'image/png' ? 'png' : 'jpg';
        const filename = `loc_${safeId}.${extension}`;
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, buffer);
        imageUrl = `/images/uploads/${filename}`;
      } catch {
        // Safe fallback to data URL on read-only environments
      }
    }


    // Create location record in database
    const location = await prisma.location.create({
      data: {
        id: `loc_${safeId}`,
        name: name.trim(),
        latitude,
        longitude,
        area: chosenArea,
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
        imageUrl,
        panoId: `upload_${safeId}`,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Campus spot added successfully!',
      location: {
        id: location.id,
        name: location.name,
        area: location.area,
        difficulty: location.difficulty,
        imageUrl: location.imageUrl,
      },
    });
  } catch (err: any) {
    console.error('Error contributing spot:', err);
    return NextResponse.json({ error: err.message || 'Failed to save campus spot' }, { status: 500 });
  }
}
