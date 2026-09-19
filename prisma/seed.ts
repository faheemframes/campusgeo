import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const locations = [
  {
    id: 'loc_tp_ganesan_auditorium',
    name: 'Dr. T.P. Ganesan Auditorium',
    latitude: 12.821340,
    longitude: 80.038410,
    panoId: 'CAoSLEFGMVFpcE9hREp1TXk4Q1E0ektrTG1xYmV5X2w4Q0J4Y2xicFZZVUR0TVZF',
    imageUrl: '/images/locations/loc_tp_ganesan_auditorium.jpg',
    area: 'South Campus',
    difficulty: 'easy',
    active: true,
  },
  {
    id: 'loc_tech_park',
    name: 'Tech Park (TP) IT & CSE Block',
    latitude: 12.824705,
    longitude: 80.045230,
    panoId: 'CAoSLEFGMVFpcE5yNVp3enU2dWlzM1h4SGcxNmY3VkhocW1pZVRfNmV5R01yZ0FF',
    imageUrl: '/images/locations/loc_tech_park.jpg',
    area: 'Main Campus',
    difficulty: 'easy',
    active: true,
  },
  {
    id: 'loc_java_green_clock_tower',
    name: 'Java Green & Clock Tower',
    latitude: 12.823120,
    longitude: 80.043810,
    panoId: 'CAoSLEFGMVFpcE1hclBvWWlfRFoxTGh6WkRFT3B0aE51UW80UGR2dWd2N2k0TGxI',
    imageUrl: '/images/locations/loc_java_green_clock_tower.jpg',
    area: 'Main Campus',
    difficulty: 'easy',
    active: true,
  },
  {
    id: 'loc_potheri_railway_bridge',
    name: 'Potheri Railway Station Footbridge',
    latitude: 12.825634,
    longitude: 80.039845,
    panoId: 'CAoSLEFGMVFpcE5FTmR3NkptYy1aTGtDOW0ycnhnTXFjRGF3VWxQZzFYWjBvaW9r',
    imageUrl: '/images/locations/loc_potheri_railway_bridge.jpg',
    area: 'Potheri',
    difficulty: 'medium',
    active: true,
  },
  {
    id: 'loc_bio_engineering_block',
    name: 'School of Bioengineering Block',
    latitude: 12.822530,
    longitude: 80.045120,
    panoId: 'CAoSLEFGMVFpcE1rMGVfTFpVTzZkcnFPT29oUW5nU0FqV0FscV9vUktlcVl4N2s4',
    imageUrl: '/images/locations/loc_bio_engineering_block.jpg',
    area: 'Main Campus',
    difficulty: 'medium',
    active: true,
  },
  {
    id: 'loc_old_campus',
    name: 'Old Engineering Campus Block',
    latitude: 12.823850,
    longitude: 80.042810,
    panoId: 'CAoSLEFGMVFpcE1KRHZqQWJpblhZTk5jYkJlQkxvd3lFTFcxY0p1ekNuQ3hGOW80',
    imageUrl: '/images/locations/loc_old_campus.jpg',
    area: 'Main Campus',
    difficulty: 'easy',
    active: true,
  },
  {
    id: 'loc_campus_walkway',
    name: 'SRM Central Avenue Walkway',
    latitude: 12.824120,
    longitude: 80.044120,
    panoId: 'CAoSLEFGMVFpcE1hV3B6TzQ0X3J4cTRvRUR3Wl90U1F1MjhjZ2V5TjJ1QzFEV1dJ',
    imageUrl: '/images/locations/loc_campus_walkway.jpg',
    area: 'Main Campus',
    difficulty: 'medium',
    active: true,
  },
  {
    id: 'loc_ub_front',
    name: 'University Building (UB) Front',
    latitude: 12.823612,
    longitude: 80.044521,
    panoId: 'CAoSLEFGMVFpcE1sOGF0WHd0eW0yS1pqSGt0VG13WldGWWZwVWRjVGZqS2d2U0lo',
    imageUrl: '/images/locations/loc_ub_front.jpg',
    area: 'Main Campus',
    difficulty: 'easy',
    active: true,
  },
];

async function main() {
  console.log('Seeding real SRM KTR campus photos into database...');
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: loc,
      create: loc,
    });
  }
  const count = await prisma.location.count();
  console.log(`Successfully seeded ${count} locations with real SRM photos!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
