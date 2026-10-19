const mongoose = require('./backend/node_modules/mongoose');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

const BASE_URL = 'http://localhost:5000/api';

// Frontend parseCoordinates logic under test
function parseCoordinates(report) {
  if (!report) return null;
  let rawLat = report.latitude ?? report.lat ?? report.farm?.latitude ?? report.farm?.lat;
  let rawLng = report.longitude ?? report.lng ?? report.farm?.longitude ?? report.farm?.lng;

  if ((rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) &&
      report.location?.coordinates && Array.isArray(report.location.coordinates) &&
      report.location.coordinates.length >= 2) {
    rawLng = report.location.coordinates[0];
    rawLat = report.location.coordinates[1];
  }

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

async function runCoordinateSuite() {
  console.log('===============================================================');
  console.log('🛰️ GIS MODULE & COORDINATE SYNCHRONIZATION TEST SUITE');
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

  // 1. Auth login
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'agronomist@agribiotech.demo', password: 'Agronomist@123' },
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Agronomist logged in successfully');
  const token = loginRes.data.token;

  // 2. Fetch farms
  const farmsRes = await request('/farms');
  assert(farmsRes.status === 200 && farmsRes.data.length > 0, `Fetched ${farmsRes.data.length} farms with verified coordinates`);
  const targetFarm = farmsRes.data[0];
  assert(targetFarm.latitude && targetFarm.longitude, `Farm "${targetFarm.farmName}" has verified GPS [${targetFarm.latitude}, ${targetFarm.longitude}]`);

  // 3. Test parseCoordinates function unit validations
  console.log('\n--- UNIT TEST: parseCoordinates() EDGE CASES ---');
  assert(parseCoordinates({ latitude: 13.0827, longitude: 80.2707 }) !== null, 'Valid decimal lat/lng parsed');
  assert(parseCoordinates({ lat: 13.0827, lng: 80.2707 }) !== null, 'Valid lat/lng short names parsed');
  assert(parseCoordinates({ farm: { latitude: 13.0827, longitude: 80.2707 } }) !== null, 'Nested farm coordinates parsed');
  assert(parseCoordinates({ location: { coordinates: [80.2707, 13.0827] } }) !== null, 'GeoJSON [lng, lat] format parsed');
  assert(parseCoordinates({ latitude: 0, longitude: 0 }) === null, 'Rejects uninitialized (0, 0)');
  assert(parseCoordinates({ latitude: 95, longitude: 80 }) === null, 'Rejects out-of-range latitude > 90');
  assert(parseCoordinates({ latitude: 13, longitude: 200 }) === null, 'Rejects out-of-range longitude > 180');
  assert(parseCoordinates({ latitude: 'NaN', longitude: '80' }) === null, 'Rejects NaN latitude');
  assert(parseCoordinates({ latitude: null, longitude: null }) === null, 'Rejects null coordinates');
  assert(parseCoordinates({}) === null, 'Rejects empty object');

  // 4. Test creating a new disease report with explicit coordinates
  console.log('\n--- TEST: CREATE DISEASE REPORT WITH EXPLICIT COORDINATES ---');
  const explicitLat = 13.0900;
  const explicitLng = 80.2800;
  const createExplicitRes = await request('/diseases', {
    method: 'POST',
    token,
    body: {
      farmId: targetFarm.id,
      diseaseName: 'Test Explicit Leaf Rust',
      severity: 'HIGH',
      status: 'ACTIVE',
      symptoms: 'Distinct orange-red sporulating pustules on flag leaf blade',
      latitude: explicitLat,
      longitude: explicitLng,
    },
  });
  assert(createExplicitRes.status === 201, 'Created disease report with explicit coordinates (HTTP 201)');
  const explicitReportId = createExplicitRes.data.id;
  assert(createExplicitRes.data.latitude === explicitLat, `Explicit latitude correctly saved: ${createExplicitRes.data.latitude}`);
  assert(createExplicitRes.data.longitude === explicitLng, `Explicit longitude correctly saved: ${createExplicitRes.data.longitude}`);

  // Verify it appears in GET /diseases and is parseable by GIS map
  const getCasesRes1 = await request('/diseases');
  const foundExplicit = getCasesRes1.data.find(c => c.id === explicitReportId);
  assert(foundExplicit !== undefined, 'Explicitly geolocated case appears in GET /diseases');
  assert(foundExplicit?.latitude === explicitLat, 'GET /diseases maintains accurate explicit latitude');
  assert(parseCoordinates(foundExplicit) !== null, 'parseCoordinates validates newly created report as mappable');

  // 5. Test creating a disease report WITHOUT coordinates (auto-inherits farm coordinates)
  console.log('\n--- TEST: CREATE REPORT WITHOUT COORDINATES (AUTO-INHERITS FARM GPS) ---');
  const createAutoRes = await request('/diseases', {
    method: 'POST',
    token,
    body: {
      farmId: targetFarm.id,
      diseaseName: 'Test Auto Farm GPS Blight',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      symptoms: 'Water-soaked translucent lesions along vascular margins',
    },
  });
  assert(createAutoRes.status === 201, 'Created disease report without explicit coordinates (HTTP 201)');
  const autoReportId = createAutoRes.data.id;
  assert(createAutoRes.data.latitude === targetFarm.latitude, `Auto-inherited farm latitude: ${createAutoRes.data.latitude}`);
  assert(createAutoRes.data.longitude === targetFarm.longitude, `Auto-inherited farm longitude: ${createAutoRes.data.longitude}`);

  // 6. Test simulating an existing report in MongoDB lacking coordinates
  console.log('\n--- TEST: EXISTING UNMAPPED REPORT & SAFE COORDINATE SYNC ---');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agribiotech';
  await mongoose.connect(mongoUri);

  const testUnmappedDoc = await mongoose.connection.db.collection('diseasereports').insertOne({
    farmId: new mongoose.Types.ObjectId(targetFarm.id),
    diseaseName: 'Legacy Unmapped Root Rot',
    symptoms: 'Stunted growth and crown rot without recorded field coordinates',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    dateObserved: new Date(),
    isDemo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Intentionally NO latitude or longitude fields!
  });
  const unmappedId = testUnmappedDoc.insertedId.toString();

  // Test GET /diseases safely resolves farm coordinates even if document lacks them
  const getCasesRes2 = await request('/diseases');
  const resolvedUnmapped = getCasesRes2.data.find(c => c.id === unmappedId);
  assert(resolvedUnmapped !== undefined, 'Legacy report without coordinates is returned by GET /diseases');
  assert(resolvedUnmapped?.latitude === targetFarm.latitude, `Safely resolved latitude from linked farm: ${resolvedUnmapped?.latitude}`);
  assert(resolvedUnmapped?.longitude === targetFarm.longitude, `Safely resolved longitude from linked farm: ${resolvedUnmapped?.longitude}`);
  assert(parseCoordinates(resolvedUnmapped) !== null, 'Legacy report is now successfully mappable by GIS module');

  // Test POST /diseases/sync-coordinates safely updates MongoDB records permanently
  const syncRes = await request('/diseases/sync-coordinates', { method: 'POST' });
  assert(syncRes.status === 200, 'POST /diseases/sync-coordinates responded HTTP 200');
  assert(syncRes.data.updatedCount >= 1, `Synchronized ${syncRes.data.updatedCount} unmapped report(s)`);

  const updatedDocInDb = await mongoose.connection.db.collection('diseasereports').findOne({ _id: new mongoose.Types.ObjectId(unmappedId) });
  assert(updatedDocInDb.latitude === targetFarm.latitude, `MongoDB document now permanently has farm latitude: ${updatedDocInDb.latitude}`);
  assert(updatedDocInDb.longitude === targetFarm.longitude, `MongoDB document now permanently has farm longitude: ${updatedDocInDb.longitude}`);

  // 7. Verify invented coordinates are NEVER assigned
  console.log('\n--- TEST: NEVER ASSIGN INVENTED COORDINATES ---');
  // Create a dummy farm with NO coordinates
  const noCoordFarmDoc = await mongoose.connection.db.collection('farms').insertOne({
    farmerId: new mongoose.Types.ObjectId(targetFarm.farmerId),
    farmName: 'Isolated Plot Without GPS',
    locationAddress: 'Unsurveyed Hill Region',
    totalAreaAcres: 5,
    soilType: 'Loam',
    irrigationType: 'Rainfed',
    // NO latitude or longitude!
  });
  const noCoordReportDoc = await mongoose.connection.db.collection('diseasereports').insertOne({
    farmId: noCoordFarmDoc.insertedId,
    diseaseName: 'Isolated Mystery Fungus',
    symptoms: 'Unsurveyed patch infection',
    severity: 'LOW',
    status: 'ACTIVE',
    dateObserved: new Date(),
    isDemo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const syncRes2 = await request('/diseases/sync-coordinates', { method: 'POST' });
  assert(syncRes2.status === 200, 'Sync endpoint handled unsurveyed farm safely');
  const noCoordDocCheck = await mongoose.connection.db.collection('diseasereports').findOne({ _id: noCoordReportDoc.insertedId });
  assert(noCoordDocCheck.latitude === undefined || noCoordDocCheck.latitude === null, 'Did NOT invent coordinates for report with unsurveyed farm');
  assert(syncRes2.data.unresolvable.length >= 1, 'Correctly flagged report in unresolvable list due to lack of verified coordinates');

  // 8. Test Active vs Resolved distinction
  console.log('\n--- TEST: ACTIVE VS RESOLVED STATUS DISTINCTION ---');
  const updateResolveRes = await request(`/diseases/${explicitReportId}`, {
    method: 'PUT',
    token,
    body: { status: 'RESOLVED', recommendedTreatment: 'Deployed Trichoderma viride bio-spray; crop recovered' },
  });
  assert(updateResolveRes.status === 200, 'Updated disease report to RESOLVED status');
  const resolvedCaseCheck = await request(`/diseases/${explicitReportId}`);
  assert(resolvedCaseCheck.data.status === 'RESOLVED', `Database case status is RESOLVED: ${resolvedCaseCheck.data.status}`);
  assert(resolvedCaseCheck.data.latitude === explicitLat, 'Resolved case retains real database coordinates');

  // 9. Cleanup test cases
  console.log('\n--- CLEANUP TEMPORARY TEST DATA ---');
  await mongoose.connection.db.collection('diseasereports').deleteMany({
    _id: {
      $in: [
        new mongoose.Types.ObjectId(explicitReportId),
        new mongoose.Types.ObjectId(autoReportId),
        new mongoose.Types.ObjectId(unmappedId),
        noCoordReportDoc.insertedId,
      ]
    }
  });
  await mongoose.connection.db.collection('farms').deleteOne({ _id: noCoordFarmDoc.insertedId });
  await mongoose.disconnect();
  console.log('  Cleaned up temporary test cases.');

  console.log('\n===============================================================');
  console.log(`🏁 GIS SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCoordinateSuite().catch((err) => {
  console.error('Fatal error in GIS test suite:', err);
  process.exit(1);
});
