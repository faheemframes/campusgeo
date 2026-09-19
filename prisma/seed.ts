import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const locations = [
  // ROUND 1 - EASY (Iconic Wide Angle)
  {
    id: 'loc_tp_ganesan_auditorium',
    name: 'Dr. T.P. Ganesan Auditorium',
    latitude: 12.821340,
    longitude: 80.038410,
    panoId: 'tp_auditorium_wide',
    imageUrl: '/images/locations/loc_tp_ganesan_auditorium.jpg',
    area: 'South Campus',
    difficulty: 'easy',
    active: true,
  },
  {
    id: 'loc_tech_park',
    name: 'Tech Park (TP) IT Tower',
    latitude: 12.824705,
    longitude: 80.045230,
    panoId: 'tech_park_wide',
    imageUrl: '/images/locations/loc_tech_park.jpg',
    area: 'Main Campus',
    difficulty: 'easy',
    active: true,
  },

  // ROUND 2 & 3 - MEDIUM (Campus Blocks & Recent 2024-2026 Photos)
  {
    id: 'loc_academic_block_new',
    name: 'SRM Academic Block (2026 View)',
    latitude: 12.823612,
    longitude: 80.044521,
    panoId: 'academic_block_2026',
    imageUrl: '/images/locations/loc_academic_block_new.jpg',
    area: 'Main Campus',
    difficulty: 'medium',
    active: true,
  },
  {
    id: 'loc_old_campus',
    name: 'Old Engineering Campus Wing (Aug 2024)',
    latitude: 12.823850,
    longitude: 80.042810,
    panoId: 'old_campus_aug2024',
    imageUrl: '/images/locations/loc_old_campus.jpg',
    area: 'Main Campus',
    difficulty: 'medium',
    active: true,
  },
  {
    id: 'loc_java_green_clock_tower',
    name: 'Java Green & Clock Tower',
    latitude: 12.823120,
    longitude: 80.043810,
    panoId: 'clock_tower_java',
    imageUrl: '/images/locations/loc_java_green_clock_tower.jpg',
    area: 'Main Campus',
    difficulty: 'medium',
    active: true,
  },
  {
    id: 'loc_campus_walkway',
    name: 'SRM Central Avenue Walkway',
    latitude: 12.824120,
    longitude: 80.044120,
    panoId: 'campus_walkway_avenue',
    imageUrl: '/images/locations/loc_campus_walkway.jpg',
    area: 'Main Campus',
    difficulty: 'medium',
    active: true,
  },

  // ROUND 4 & 5 - HARD (Zoomed-in Detail / Architectural Clues)
  {
    id: 'loc_bio_engineering_block',
    name: 'School of Bioengineering Entrance',
    latitude: 12.822530,
    longitude: 80.045120,
    panoId: 'bio_engineering_block',
    imageUrl: '/images/locations/loc_bio_engineering_block.jpg',
    area: 'Main Campus',
    difficulty: 'hard',
    active: true,
  },
  {
    id: 'loc_potheri_zoom',
    name: 'Potheri Station Overpass (Zoomed Detail)',
    latitude: 12.825634,
    longitude: 80.039845,
    panoId: 'potheri_zoom',
    imageUrl: '/images/locations/loc_potheri_zoom.jpg',
    area: 'Potheri',
    difficulty: 'hard',
    active: true,
  },
  {
    id: 'loc_tech_park_zoom',
    name: 'Tech Park Entrance Pillars (Zoomed Detail)',
    latitude: 12.824705,
    longitude: 80.045230,
    panoId: 'tech_park_zoom',
    imageUrl: '/images/locations/loc_tech_park_zoom.jpg',
    area: 'Main Campus',
    difficulty: 'hard',
    active: true,
  },
  {
    id: 'loc_auditorium_dome_zoom',
    name: 'Auditorium Curved Dome Facade (Zoomed Detail)',
    latitude: 12.821340,
    longitude: 80.038410,
    panoId: 'auditorium_dome_zoom',
    imageUrl: '/images/locations/loc_auditorium_dome_zoom.jpg',
    area: 'South Campus',
    difficulty: 'hard',
    active: true,
  }
];

async function main() {
  console.log('Seeding progressive difficulty locations with real photos...');
  // Clear non-current locations so only verified real photos are active
  await prisma.location.updateMany({ data: { active: false } });

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: loc,
      create: loc,
    });
  }
  const count = await prisma.location.count({ where: { active: true } });
  console.log(`Successfully seeded ${count} active locations across Easy, Medium, and Hard difficulty!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
