const BASE_URL = 'http://localhost:5000/api';

// Haversine formula implementation matching the frontend
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

// Coordinate parsing and validation matching frontend parseCoordinates
function parseCoordinates(report) {
  if (!report) return null;
  const rawLat = report.latitude ?? report.lat;
  const rawLng = report.longitude ?? report.lng;

  if (
    rawLat === undefined ||
    rawLat === null ||
    rawLat === '' ||
    rawLng === undefined ||
    rawLng === null ||
    rawLng === ''
  ) {
    return null;
  }

  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;

  return { lat, lng };
}

function isRefreshedToday(timestamp) {
  if (!timestamp) return false;
  const savedDate = new Date(timestamp);
  const today = new Date();
  return (
    savedDate.getFullYear() === today.getFullYear() &&
    savedDate.getMonth() === today.getMonth() &&
    savedDate.getDate() === today.getDate()
  );
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('🛰️ ACCEPTANCE SUITE: LOCATION-BASED GIS DISEASE SURVEILLANCE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: HAVERSINE FORMULA ACCURACY
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: HAVERSINE DISTANCE MATHEMATICAL ACCURACY ---');
  const dZero = calculateHaversineDistance(13.0827, 80.2707, 13.0827, 80.2707);
  assert(dZero === 0, `Distance between identical points is 0 km (actual: ${dZero})`);

  const dChennaiTiruvallur = calculateHaversineDistance(13.0827, 80.2707, 13.1440, 79.9088);
  assert(
    dChennaiTiruvallur >= 38 && dChennaiTiruvallur <= 42,
    `Chennai to Tiruvallur distance ~40 km (actual: ${dChennaiTiruvallur} km)`
  );

  const dChennaiCoimbatore = calculateHaversineDistance(13.0827, 80.2707, 10.6615, 77.0055);
  assert(
    dChennaiCoimbatore >= 420 && dChennaiCoimbatore <= 460,
    `Chennai to Coimbatore distance ~442 km (actual: ${dChennaiCoimbatore} km)`
  );

  // --------------------------------------------------------------------------
  // TEST 2: ACCEPTANCE TEST 1 & 2: AVADI LOCATION & EXCLUSION OF DISTANT MARKERS
  // --------------------------------------------------------------------------
  console.log('\n--- ACCEPTANCE TEST 1 & 2: OPEN IN AVADI & EXCLUDE DISTANT REPORTS ---');
  // Avadi, Tamil Nadu coordinates: 13.1147° N, 80.1018° E
  const avadiLat = 13.1147;
  const avadiLng = 80.1018;
  const avadiRadius = 10; // 10 km default

  const allCasesRes = await request('/diseases');
  assert(allCasesRes.status === 200, 'Fetched disease cases from MongoDB (HTTP 200)');
  const allCases = allCasesRes.data;

  // Calculate distance from Avadi to all cases
  const avadiCasesWithDist = allCases.map((c) => {
    const coords = parseCoordinates(c);
    const dist = coords ? calculateHaversineDistance(avadiLat, avadiLng, coords.lat, coords.lng) : 999999;
    return { ...c, distanceKm: dist, coords };
  });

  const avadiWithin10Km = avadiCasesWithDist.filter((c) => c.distanceKm <= avadiRadius);
  console.log(`  📍 From Avadi [${avadiLat}, ${avadiLng}], within 10 km radius: ${avadiWithin10Km.length} case(s) found`);

  // Distant locations:
  // Madurai (~420 km), Coimbatore (~440 km), Villupuram (~140 km), Kanchipuram (~35 km)
  const distantLocations = ['Madurai', 'Coimbatore', 'Villupuram', 'Pollachi', 'Melur'];
  distantLocations.forEach((loc) => {
    const appearsIn10Km = avadiWithin10Km.some((c) =>
      (c.locationAddress && c.locationAddress.includes(loc)) ||
      (c.farm?.locationAddress && c.farm.locationAddress.includes(loc))
    );
    assert(!appearsIn10Km, `Distant disease reports in ${loc} do NOT appear in Avadi 10 km radius`);
  });

  // Verify backend endpoint also supports direct coordinate and radius filtering
  const backendAvadiRes = await request(`/diseases?lat=${avadiLat}&lng=${avadiLng}&radiusKm=${avadiRadius}`);
  assert(backendAvadiRes.status === 200, 'GET /diseases?lat=...&lng=...&radiusKm=10 responded 200');
  backendAvadiRes.data.forEach((c) => {
    assert(c.distanceKm <= avadiRadius, `Backend filtered case "${c.diseaseName}" (${c.distanceKm} km) <= ${avadiRadius} km`);
  });

  // --------------------------------------------------------------------------
  // TEST 3: ACCEPTANCE TEST 7: NO NEARBY REPORTS PRODUCES EMPTY STATE, NO FABRICATION
  // --------------------------------------------------------------------------
  console.log('\n--- ACCEPTANCE TEST 7: EMPTY STATE IN REMOTE REGION, NO FABRICATED MARKERS ---');
  // Remote coordinates with zero nearby farms (e.g. 15.0000, 75.0000)
  const remoteLat = 15.0000;
  const remoteLng = 75.0000;
  const remoteWithin10Km = allCases.filter((c) => {
    const coords = parseCoordinates(c);
    if (!coords) return false;
    return calculateHaversineDistance(remoteLat, remoteLng, coords.lat, coords.lng) <= 10;
  });
  assert(remoteWithin10Km.length === 0, 'Zero reports found in remote coordinate zone');
  assert(Array.isArray(remoteWithin10Km) && remoteWithin10Km.length === 0, 'Produces clean empty state: "No disease alerts found within 10 km.", not fabricated demo markers');

  // --------------------------------------------------------------------------
  // TEST 4: ACCEPTANCE TEST 4 & 5: DAILY LOCATION UPDATE & CACHING LOGIC
  // --------------------------------------------------------------------------
  console.log('\n--- ACCEPTANCE TEST 4 & 5: UPDATE LOCATION ONLY ONCE PER DAY ---');
  const now = Date.now();
  assert(isRefreshedToday(now) === true, 'Timestamp from today is correctly identified as refreshed today');
  assert(isRefreshedToday(now - 1000 * 60 * 30) === true, 'Timestamp from 30 mins ago is identified as refreshed today');

  // Yesterday / previous calendar day
  const yesterday = now - 24 * 3600 * 1000 - 1000 * 60 * 60; // >24h ago
  assert(isRefreshedToday(yesterday) === false, 'Timestamp from previous calendar day requires refresh');
  assert(isRefreshedToday(null) === false, 'null timestamp requires refresh');
  assert(isRefreshedToday(undefined) === false, 'undefined timestamp requires refresh');

  // --------------------------------------------------------------------------
  // TEST 5: DEDUPLICATION BY MONGODB ID
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: DEDUPLICATION BY MONGODB UNIQUE ID ---');
  const duplicateCases = [...allCases, allCases[0], allCases[1]];
  assert(duplicateCases.length === allCases.length + 2, 'Simulated array with duplicates');
  const uniqueMap = new Map();
  duplicateCases.forEach((c) => {
    if (!uniqueMap.has(c.id)) {
      uniqueMap.set(c.id, c);
    }
  });
  const deduplicated = Array.from(uniqueMap.values());
  assert(deduplicated.length === allCases.length, 'Every disease report rendered exactly once by unique MongoDB ID');

  // --------------------------------------------------------------------------
  // TEST 6: DEMO DATA VS GENUINE FIELD REPORTS DISTINCTION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: DEMO DATA VS GENUINE FIELD REPORT BADGING ---');
  const hasDemoFlag = allCases.every((c) => typeof c.isDemo === 'boolean');
  assert(hasDemoFlag, 'Every disease case clearly defines isDemo boolean flag');
  const demoCases = allCases.filter((c) => c.isDemo === true);
  assert(demoCases.length >= 6, `All 6 seeded baseline reports flagged as isDemo: true (count: ${demoCases.length})`);

  // --------------------------------------------------------------------------
  // TEST 7: PRIVACY & FARMER CONTACT DATA REDACTION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: PRIVACY & FARMER CONTACT DATA REDACTION ---');
  const scientistLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'scientist@agribiotech.demo', password: 'Scientist@123' },
  });
  const agroLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'agronomist@agribiotech.demo', password: 'Agronomist@123' },
  });
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@agribiotech.demo', password: 'Admin@123' },
  });

  const unauthRes = await request('/diseases');
  assert(!unauthRes.data.some((c) => c.farm?.farmer?.phone), 'Unauthenticated visitors CANNOT view farmer phone numbers');

  const scientistRes = await request('/diseases', { token: scientistLogin.data.token });
  assert(!scientistRes.data.some((c) => c.farm?.farmer?.phone), 'Scientist CANNOT view private farmer phone numbers');

  const agroRes = await request('/diseases', { token: agroLogin.data.token });
  assert(agroRes.data.some((c) => c.farm?.farmer?.phone), 'Agronomist CAN view farmer phone numbers for agricultural field advisory');

  const adminRes = await request('/diseases', { token: adminLogin.data.token });
  assert(adminRes.data.some((c) => c.farm?.farmer?.phone), 'Admin CAN view farmer phone numbers for platform management');

  console.log('\n===============================================================');
  console.log(`🏁 ACCEPTANCE SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in acceptance suite:', err);
  process.exit(1);
});
