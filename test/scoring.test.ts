import { calculateHaversineDistance, calculateScore, formatDistance } from '../src/lib/scoring';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Testing Haversine Distance ---');
// UB entrance to Tech Park IT block is ~144m
const ubLat = 12.823612, ubLng = 80.044521;
const tpLat = 12.824705, tpLng = 80.045230;
const dist = calculateHaversineDistance(ubLat, ubLng, tpLat, tpLng);
console.log(`UB to Tech Park distance: ${dist}m (Formatted: ${formatDistance(dist)})`);
assert(dist > 130 && dist < 160, `Distance should be ~144m, got ${dist}m`);

console.log('\n--- Testing Scoring Calibration ---');
const tests = [
  { dist: 0, minScore: 5000, maxScore: 5000, label: '0m Bullseye' },
  { dist: 20, minScore: 4700, maxScore: 4800, label: '20m Near Bullseye' },
  { dist: 50, minScore: 4300, maxScore: 4500, label: '50m Excellent' },
  { dist: 150, minScore: 3300, maxScore: 3600, label: '150m Good' },
  { dist: 200, minScore: 2900, maxScore: 3200, label: '200m Decent' },
  { dist: 500, minScore: 1300, maxScore: 1600, label: '500m Moderate' },
  { dist: 1000, minScore: 350, maxScore: 450, label: '1km Low' },
  { dist: 2500, minScore: 0, maxScore: 50, label: '2.5km Very Low' },
];

for (const t of tests) {
  const score = calculateScore(t.dist);
  console.log(`${t.label}: ${t.dist}m -> ${score} pts`);
  assert(
    score >= t.minScore && score <= t.maxScore,
    `${t.label} score ${score} not in range [${t.minScore}, ${t.maxScore}]`
  );
  assert(Number.isInteger(score), 'Score must be an integer');
  assert(score >= 0 && score <= 5000, 'Score must be clamped between 0 and 5000');
}

console.log('\n--- Testing Distance Formatting ---');
assert(formatDistance(50) === '50 m', 'Format 50m');
assert(formatDistance(183) === '183 m', 'Format 183m');
assert(formatDistance(1420) === '1.4 km', 'Format 1420m');

console.log('\nALL SCORING & DISTANCE TESTS PASSED SUCCESSFULLY! ✅');
