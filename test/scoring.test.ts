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
  { dist: 25, minScore: 4000, maxScore: 4200, label: '25m Near Bullseye' },
  { dist: 50, minScore: 3200, maxScore: 3400, label: '50m Excellent' },
  { dist: 100, minScore: 2100, maxScore: 2300, label: '100m Decent' },
  { dist: 200, minScore: 900, maxScore: 1000, label: '200m Off Target' },
  { dist: 350, minScore: 200, maxScore: 350, label: '350m Poor' },
  { dist: 500, minScore: 50, maxScore: 100, label: '500m Very Poor' },
  { dist: 1000, minScore: 0, maxScore: 5, label: '1km Miss' },
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
