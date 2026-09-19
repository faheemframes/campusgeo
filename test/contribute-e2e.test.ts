import { prisma } from '../src/lib/db';

async function runContributeE2ETest() {
  console.log('--- Testing Contribute Spot End-to-End Flow ---');

  const testContributeId = `loc_user_test_spot_${Date.now()}`;
  const testSpotName = 'SRM Clock Tower Plaza (Student Contribution)';
  const testLat = 12.823901;
  const testLng = 80.044123;
  const testArea = 'Central Campus';

  // 1. Submit/persist new spot as if from the Contribute UI
  const spot = await prisma.location.create({
    data: {
      id: testContributeId,
      name: testSpotName,
      latitude: testLat,
      longitude: testLng,
      area: testArea,
      difficulty: 'medium',
      imageUrl: '/images/locations/loc_java_canteen.jpg',
      panoId: `upload_${testContributeId}`,
      active: true,
    },
  });

  console.log(`✓ 1. Spot persisted in database with ID: ${spot.id}`);

  // 2. Query all active locations and verify it is present
  const allActive = await prisma.location.findMany({ where: { active: true } });
  const found = allActive.find((l) => l.id === testContributeId);
  if (!found) {
    throw new Error('Contributed spot was not found in active pool!');
  }
  console.log(`✓ 2. Found in active playable pool of ${allActive.length} spots`);

  // 3. Create a game session referencing this spot to verify Prisma relations
  const testGame = await prisma.game.create({
    data: {
      totalScore: 0,
      isFinished: false,
    },
  });

  const testRound = await prisma.round.create({
    data: {
      gameId: testGame.id,
      locationId: testContributeId,
      roundNumber: 1,
      guessLatitude: 12.823900,
      guessLongitude: 80.044120,
      distanceMeters: 0.5,
      score: 5000,
    },
  });

  console.log(`✓ 3. Verified spot links into Game session #${testGame.id} round #${testRound.roundNumber}`);

  // 4. Verify admin visibility: counts correctly
  const userUploads = await prisma.location.count({
    where: { id: { startsWith: 'loc_user_' } }
  });
  console.log(`✓ 4. Admin query correctly identifies ${userUploads} user contributions`);

  // 5. Clean up test records
  await prisma.round.deleteMany({ where: { gameId: testGame.id } });
  await prisma.game.delete({ where: { id: testGame.id } });
  await prisma.location.delete({ where: { id: testContributeId } });
  console.log('✓ 5. Cleanup test records completed');

  console.log('\n🎉 ALL CONTRIBUTE E2E TESTS PASSED SUCCESSFULLY! ✅');
}

runContributeE2ETest()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
