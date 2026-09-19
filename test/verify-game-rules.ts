import { PrismaClient } from '@prisma/client';
import { selectDistinctGameLocations, getLandmarkCluster } from '../src/lib/locationSelection';
import { calculatePlayerRank } from '../src/lib/ranking';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Campus Geo Verification Tests...\n');

  // Test 1: Fetch all active locations from DB
  const allLocations = await prisma.location.findMany({ where: { active: true } });
  console.log(`✅ Total active locations in database: ${allLocations.length}`);
  if (allLocations.length < 15) {
    throw new Error('Expected at least 15 active locations');
  }

  // Test 2: Check distinct clusters represented
  const clusters = new Set(allLocations.map((l) => getLandmarkCluster(l.id, l.name)));
  console.log(`✅ Total distinct landmark clusters: ${clusters.size} clusters found:`, Array.from(clusters));
  if (clusters.size < 5) {
    throw new Error('Not enough landmark clusters to create diverse 5-round games');
  }

  // Test 3: Run 1,000 game generation simulations
  console.log('\n🎲 Simulating 1,000 consecutive 5-round games...');
  let totalGamesSimulated = 1000;
  let duplicateImageViolations = 0;
  let duplicateClusterViolations = 0;

  for (let i = 0; i < totalGamesSimulated; i++) {
    const gameLocations = selectDistinctGameLocations(allLocations, 5);

    if (gameLocations.length !== 5) {
      throw new Error(`Game ${i} did not select 5 locations (got ${gameLocations.length})`);
    }

    // Check duplicate images
    const images = new Set<string>();
    for (const loc of gameLocations) {
      const img = (loc.imageUrl || loc.panoId).trim();
      if (images.has(img)) {
        duplicateImageViolations++;
        console.error(`❌ Duplicate image found in game ${i}: ${img}`);
      }
      images.add(img);
    }

    // Check duplicate clusters
    const gameClusters = new Set<string>();
    for (const loc of gameLocations) {
      const cluster = getLandmarkCluster(loc.id, loc.name);
      if (gameClusters.has(cluster)) {
        duplicateClusterViolations++;
      }
      gameClusters.add(cluster);
    }
  }

  console.log(`✅ 1,000 Games Simulated:`);
  console.log(`   - Duplicate Image Violations: ${duplicateImageViolations} (Must be 0)`);
  console.log(`   - Duplicate Cluster Violations: ${duplicateClusterViolations} (Must be 0)`);

  if (duplicateImageViolations > 0) {
    throw new Error(`Failed: Found ${duplicateImageViolations} duplicate images in games!`);
  }
  if (duplicateClusterViolations > 0) {
    throw new Error(`Failed: Found ${duplicateClusterViolations} duplicate clusters in games!`);
  }

  // Test 4: Verify Rank & Percentile calculations
  console.log('\n🏆 Verifying End-of-Game Leaderboard Rank & Percentile...');
  const testScores = [24500, 21000, 16500, 12000, 4500];
  for (const score of testScores) {
    const stats = await calculatePlayerRank(score);
    console.log(
      `   Score: ${score.toLocaleString().padStart(6)} pts -> Rank #${stats.rank} of ${stats.totalPlayers} Players (Top ${stats.topPercentage}%) | Tier: ${stats.tierName}`
    );
    if (stats.rank < 1 || stats.topPercentage < 1 || stats.topPercentage > 100) {
      throw new Error(`Invalid rank stats for score ${score}: ${JSON.stringify(stats)}`);
    }
  }

  console.log('\n🎉 ALL TESTS PASSED WITH 100% SUCCESS!\n');
  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
