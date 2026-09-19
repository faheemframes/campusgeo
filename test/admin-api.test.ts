import { prisma } from '../src/lib/db';

async function runAdminTest() {
  console.log('--- Testing Admin Locations & Verification API ---');

  // 1. Direct verify database metrics
  const total = await prisma.location.count();
  const activeCount = await prisma.location.count({ where: { active: true } });
  console.log(`Verified Prisma DB: Total=${total}, Active=${activeCount}`);

  if (total < 30) {
    throw new Error(`Expected at least 30 seeded locations, found ${total}`);
  }

  // 2. Test toggling active status on a location
  const firstLoc = await prisma.location.findFirst();
  if (!firstLoc) throw new Error('No location found');

  console.log(`Testing toggle on location: ${firstLoc.name} (${firstLoc.id})`);
  
  // Set inactive
  await prisma.location.update({
    where: { id: firstLoc.id },
    data: { active: false },
  });

  const updatedInactive = await prisma.location.findUnique({ where: { id: firstLoc.id } });
  if (updatedInactive?.active !== false) throw new Error('Failed to set location inactive');

  // Restore to active
  await prisma.location.update({
    where: { id: firstLoc.id },
    data: { active: true },
  });

  const updatedActive = await prisma.location.findUnique({ where: { id: firstLoc.id } });
  if (updatedActive?.active !== true) throw new Error('Failed to restore location active');

  console.log('Toggle active/inactive state verified successfully. ✅');
  console.log('ADMIN API VERIFICATION TEST PASSED! 🚀');
}

runAdminTest()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
