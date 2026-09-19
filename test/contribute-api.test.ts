import { prisma } from '../src/lib/db';

async function runContributeTest() {
  console.log('--- Testing Contribute API & Database Injection ---');

  // Test inserting a user-contributed location directly via Prisma model
  const testSpotId = `loc_test_community_${Date.now()}`;
  const spot = await prisma.location.create({
    data: {
      id: testSpotId,
      name: 'Mechanical Workshop High Steps (Test Spot)',
      latitude: 12.822950,
      longitude: 80.043510,
      panoId: 'test_pano_mech_steps',
      imageUrl: '/images/locations/loc_academic_block_new.jpg',
      area: 'Central Campus',
      difficulty: 'medium',
      active: true,
    },
  });

  console.log(`Created test spot: ${spot.name} (${spot.id}) at [${spot.latitude}, ${spot.longitude}]`);

  // Verify it exists in database
  const retrieved = await prisma.location.findUnique({
    where: { id: testSpotId },
  });

  if (!retrieved || retrieved.name !== spot.name) {
    throw new Error('Failed to retrieve contributed location from database');
  }

  // Count active locations
  const activeCount = await prisma.location.count({ where: { active: true } });
  console.log(`Total active playable spots now in database: ${activeCount}`);

  // Clean up test spot
  await prisma.location.delete({ where: { id: testSpotId } });
  console.log('Test spot cleaned up successfully.');

  console.log('CONTRIBUTE LOCATION TEST PASSED! ✅');
}

runContributeTest()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
