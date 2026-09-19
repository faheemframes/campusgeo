/**
 * Lightweight Client-Side EXIF GPS Parser
 * Extracts GPS latitude and longitude from JPEG photos taken by smartphones (iPhone/Android).
 */

export interface ExifGpsResult {
  latitude: number;
  longitude: number;
}

export async function extractGpsFromImage(file: File): Promise<ExifGpsResult | null> {
  try {
    const buffer = await file.slice(0, 131072).arrayBuffer(); // Read first 128KB which contains EXIF
    const view = new DataView(buffer);

    // Verify JPEG SOI (0xFFD8)
    if (view.getUint16(0, false) !== 0xffd8) {
      return null;
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length - 4) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      // APP1 Marker (EXIF)
      if (marker === 0xffe1) {
        const app1Length = view.getUint16(offset, false);
        const exifStart = offset + 2;

        // Check for "Exif\0\0" (0x45786966 0x0000)
        if (
          view.getUint32(exifStart, false) === 0x45786966 &&
          view.getUint16(exifStart + 4, false) === 0x0000
        ) {
          const tiffStart = exifStart + 6;
          return parseTiffGps(view, tiffStart);
        }
        offset += app1Length;
      } else if ((marker & 0xff00) === 0xff00) {
        // Other JPEG marker - skip payload
        const markerLength = view.getUint16(offset, false);
        offset += markerLength;
      } else {
        break;
      }
    }

    return null;
  } catch (err) {
    console.warn('Could not parse EXIF GPS:', err);
    return null;
  }
}

function parseTiffGps(view: DataView, tiffStart: number): ExifGpsResult | null {
  // Byte order: 0x4949 = II (Little Endian), 0x4D4D = MM (Big Endian)
  const byteOrder = view.getUint16(tiffStart, false);
  const littleEndian = byteOrder === 0x4949;

  if (!littleEndian && byteOrder !== 0x4d4d) return null;

  // Offset to 0th IFD
  const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
  if (firstIfdOffset < 8) return null;

  const ifd0Start = tiffStart + firstIfdOffset;
  const numEntries = view.getUint16(ifd0Start, littleEndian);

  let gpsIfdOffset = 0;

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifd0Start + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    // GPSInfo tag is 0x8825 (34853)
    if (tag === 0x8825) {
      gpsIfdOffset = view.getUint32(entryOffset + 8, littleEndian);
      break;
    }
  }

  if (!gpsIfdOffset) return null;

  const gpsStart = tiffStart + gpsIfdOffset;
  if (gpsStart + 2 > view.byteLength) return null;

  const gpsEntries = view.getUint16(gpsStart, littleEndian);

  let latRef = 'N';
  let lonRef = 'E';
  let latCoords: number[] | null = null;
  let lonCoords: number[] | null = null;

  for (let i = 0; i < gpsEntries; i++) {
    const entryOffset = gpsStart + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag === 1) {
      // GPSLatitudeRef
      latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 2) {
      // GPSLatitude (3 rational numbers)
      const valueOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      latCoords = readRationals(view, valueOffset, 3, littleEndian);
    } else if (tag === 3) {
      // GPSLongitudeRef
      lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 4) {
      // GPSLongitude (3 rational numbers)
      const valueOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      lonCoords = readRationals(view, valueOffset, 3, littleEndian);
    }
  }

  if (latCoords && lonCoords && latCoords.length === 3 && lonCoords.length === 3) {
    let lat = latCoords[0] + latCoords[1] / 60 + latCoords[2] / 3600;
    let lon = lonCoords[0] + lonCoords[1] / 60 + lonCoords[2] / 3600;

    if (latRef === 'S') lat = -lat;
    if (lonRef === 'W') lon = -lon;

    if (!isNaN(lat) && !isNaN(lon)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lon.toFixed(6)) };
    }
  }

  return null;
}

function readRationals(view: DataView, offset: number, count: number, littleEndian: boolean): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const numOffset = offset + i * 8;
    if (numOffset + 8 > view.byteLength) break;
    const numerator = view.getUint32(numOffset, littleEndian);
    const denominator = view.getUint32(numOffset + 4, littleEndian);
    result.push(denominator === 0 ? 0 : numerator / denominator);
  }
  return result;
}
