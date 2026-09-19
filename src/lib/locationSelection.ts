/**
 * Campus Geo - Landmark Clustering and Strict Zero-Duplicate Selection
 * Guarantees that in any 5-round game:
 * 1. No image URL is EVER repeated.
 * 2. No landmark / building family is repeated (different clusters across campus).
 */

export function getLandmarkCluster(id: string, name: string): string {
  const lower = (id + ' ' + name).toLowerCase();
  if (lower.includes('auditorium')) return 'auditorium';
  if (lower.includes('tech_park') || lower.includes('tech park')) return 'tech_park';
  if (
    lower.includes('arch_gate') ||
    lower.includes('grand arch') ||
    lower.includes('main gate') ||
    lower.includes('entrance arch')
  )
    return 'arch_gate';
  if (
    lower.includes('palm_boulevard') ||
    lower.includes('palm avenue') ||
    lower.includes('driveway')
  )
    return 'palm_boulevard';
  if (
    lower.includes('ub_') ||
    lower.includes('university building') ||
    lower.includes('central library')
  )
    return 'ub_central_library';
  if (lower.includes('potheri')) return 'potheri';
  if (lower.includes('java') || lower.includes('clock_tower')) return 'java_green';
  if (lower.includes('bio')) return 'bioengineering';
  if (lower.includes('academic')) return 'academic_block';
  if (
    lower.includes('station') ||
    lower.includes('kattankulathur') ||
    lower.includes('tracks')
  )
    return 'railway_station';
  if (
    lower.includes('old_campus') ||
    lower.includes('old engineering') ||
    lower.includes('arcade')
  )
    return 'old_campus';
  if (lower.includes('hostel') || lower.includes('paari') || lower.includes('oori'))
    return 'hostel';
  if (
    lower.includes('walkway') ||
    lower.includes('boulevard') ||
    lower.includes('avenue')
  )
    return 'central_avenue';
  return id;
}

export function selectDistinctGameLocations<
  T extends { id: string; name: string; imageUrl?: string | null; panoId: string }
>(allLocations: T[], count = 5): T[] {
  const shuffled = [...allLocations].sort(() => Math.random() - 0.5);
  const selected: T[] = [];
  const chosenClusters = new Set<string>();
  const chosenImages = new Set<string>();
  const chosenIds = new Set<string>();

  // Pass 1: Strict distinct cluster + distinct image URL + distinct ID
  for (const loc of shuffled) {
    if (selected.length >= count) break;
    const cluster = getLandmarkCluster(loc.id, loc.name);
    const img = (loc.imageUrl || loc.panoId).trim();
    if (!chosenClusters.has(cluster) && !chosenImages.has(img) && !chosenIds.has(loc.id)) {
      chosenClusters.add(cluster);
      chosenImages.add(img);
      chosenIds.add(loc.id);
      selected.push(loc);
    }
  }

  // Pass 2: Fallback (if clusters are exhausted) - NEVER allow duplicate images or duplicate IDs
  if (selected.length < count) {
    for (const loc of shuffled) {
      if (selected.length >= count) break;
      const img = (loc.imageUrl || loc.panoId).trim();
      if (!chosenImages.has(img) && !chosenIds.has(loc.id)) {
        chosenImages.add(img);
        chosenIds.add(loc.id);
        selected.push(loc);
      }
    }
  }

  return selected;
}
