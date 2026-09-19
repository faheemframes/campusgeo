/**
 * Campus Geo Scoring & Distance Engine
 * 
 * Calibrated specifically for SRM Institute of Science and Technology (SRM KTR).
 * The campus is approximately 1.5 - 2.0 km in span.
 */

const MAX_ROUND_SCORE = 5000;
const MAX_GAME_SCORE = 25000;
const SCORING_SCALE_KM = 0.075; // Ultra-strict campus scale: 50m loses ~2400 pts, 150m loses ~4300 pts

/**
 * Calculates great-circle distance between two points using the Haversine formula.
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates the score for a round given the distance in meters.
 * Closer guesses receive exponentially higher scores.
 * 
 * Formula: score = 5000 * exp(-distanceKm / scale)
 * 
 * @param distanceMeters Distance in meters from actual location
 * @returns Integer score clamped between 0 and 5000
 */
export function calculateScore(distanceMeters: number): number {
  if (distanceMeters <= 5) {
    return MAX_ROUND_SCORE; // Bullseye threshold
  }

  const distanceKm = distanceMeters / 1000;
  const rawScore = MAX_ROUND_SCORE * Math.exp(-distanceKm / SCORING_SCALE_KM);

  const score = Math.round(rawScore);
  return Math.max(0, Math.min(MAX_ROUND_SCORE, score));
}

/**
 * Formats distance in meters into a human-readable string.
 * Example: 183 -> "183 m", 1420 -> "1.4 km"
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export { MAX_ROUND_SCORE, MAX_GAME_SCORE };
