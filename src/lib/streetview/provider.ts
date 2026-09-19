import { GoogleStreetViewProvider } from './googleProvider';
import { Fallback360Provider } from './fallbackProvider';
import { StreetViewProvider } from './types';

export function createStreetViewProvider(): StreetViewProvider {
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey && googleApiKey.trim().length > 0) {
    return new GoogleStreetViewProvider(googleApiKey.trim());
  }

  // Fallback 360 viewer (works offline, zero credentials needed)
  return new Fallback360Provider();
}

export * from './types';
