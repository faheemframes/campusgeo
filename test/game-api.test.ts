import { prisma } from '../src/lib/db';
import { calculateHaversineDistance, calculateScore } from '../src/lib/scoring';

async function runGameLoopTest() {
  console.log('--- Testing Full 5-Round Game Lifecycle ---');

  // 1. Fetch active locations
  const activeLocations = await prisma.location.findMany({ where: { active: true } });
  console.log(`Available active locations in DB: ${activeLocations.length}`);
  if (activeLocations.length < 5) throw new Error('Need at least 5 locations');

  // 2. Create game session
  const shuffled = [...activeLocations].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);

  const game = await prisma.game.create({
    data: {
      totalScore: 0,
      isFinished: false,
      rounds: {
        create: selected.map((loc, idx) => ({
          roundNumber: idx + 1,
          locationId: loc.id,
        })),
      },
    },
    include: {
      rounds: {
        include: { location: true },
        orderBy: { roundNumber: 'asc' },
      },
    },
  });

  console.log(`Created Game ID: ${game.id} with ${game.rounds.length} rounds.`);

  // 3. Play 5 rounds
  let runningTotalScore = 0;
  for (let r = 1; r <= 5; r++) {
    const round = game.rounds[r - 1];
    
    // Simulate player guess within 20-80 meters of the actual coordinate
    const offsetLat = (Math.random() - 0.5) * 0.0005;
    const offsetLng = (Math.random() - 0.5) * 0.0005;
    const guessLat = round.location.latitude + offsetLat;
    const guessLng = round.location.longitude + offsetLng;

    const distMeters = calculateHaversineDistance(
      guessLat,
      guessLng,
      round.location.latitude,
      round.location.longitude
    );
    const score = calculateScore(distMeters);
    runningTotalScore += score;

    await prisma.round.update({
      where: { id: round.id },
      data: {
        guessLatitude: guessLat,
        guessLongitude: guessLng,
        distanceMeters: distMeters,
        score: score,
      },
    });

    console.log(
      `Round ${r}: ${round.location.name} -> Guess off by ${distMeters}m | Score: ${score}/5000`
    );
  }

  // 4. Mark game finished
  await prisma.game.update({
    where: { id: game.id },
    data: {
      totalScore: runningTotalScore,
      isFinished: true,
    },
  });

  // 5. Verify final game state in DB
  const finalGame = await prisma.game.findUnique({
    where: { id: game.id },
    include: { rounds: { include: { location: true } } },
  });

  if (!finalGame) throw new Error('Game not found');
  console.log(`\nFinal Game Result:`);
  console.log(`Total Score: ${finalGame.totalScore} / 25,000`);
  console.log(`Is Finished: ${finalGame.isFinished}`);
  console.log(`Rounds completed: ${finalGame.rounds.filter(r => r.score !== null).length}/5`);

  if (finalGame.totalScore !== runningTotalScore) throw new Error('Score mismatch');
  if (!finalGame.isFinished) throw new Error('Game should be finished');

  console.log('\nFULL GAME LIFECYCLE TEST PASSED SUCCESSFULLY! ✅');
}

runGameLoopTest()
  .catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
