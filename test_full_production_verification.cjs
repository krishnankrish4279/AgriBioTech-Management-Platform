const https = require('https');

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request('https://agri-bio-tech-management-platform.vercel.app' + path, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('========================================================');
  console.log('🌾 PRODUCTION VALIDATION SUITE: AgriBioTech Platform');
  console.log('Target: https://agri-bio-tech-management-platform.vercel.app');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('✅ PASS:', message);
      passed++;
    } else {
      console.error('❌ FAIL:', message);
      failed++;
    }
  }

  // 1. Healthcheck
  const health = await request('/health');
  assert(health.status === 200 && health.data.healthy === true, 'GET /health returns 200 and healthy: true');

  // 2. Demonstration User Logins
  const accounts = [
    { email: 'admin@agribiotech.demo', pass: 'Admin@123', expectedRole: 'admin', name: 'Admin Director' },
    { email: 'agronomist@agribiotech.demo', pass: 'Agronomist@123', expectedRole: 'agronomist', name: 'Field Agronomist' },
    { email: 'scientist@agribiotech.demo', pass: 'Scientist@123', expectedRole: 'biotech_expert', name: 'Biotech Scientist' },
    { email: 'farmer@agribiotech.demo', pass: 'Farmer@123', expectedRole: 'farmer', name: 'Farmer' },
  ];

  const tokens = {};
  for (const acc of accounts) {
    const res = await request('/api/auth/login', 'POST', { email: acc.email, password: acc.pass });
    const ok = res.status === 200 && res.data.token && res.data.user.role === acc.expectedRole;
    assert(ok, 'POST /api/auth/login succeeds for ' + acc.name + ' (' + acc.email + ') with role: ' + acc.expectedRole);
    if (ok) tokens[acc.expectedRole] = res.data.token;
  }

  // 3. Rejection of Invalid Credentials
  const wrongPass = await request('/api/auth/login', 'POST', { email: 'admin@agribiotech.demo', password: 'WrongPassword@999' });
  assert(wrongPass.status === 401 && wrongPass.data.error, 'POST /api/auth/login rejects incorrect password with 401 JSON');

  const nonExistent = await request('/api/auth/login', 'POST', { email: 'nobody@nowhere.demo', password: 'Password@123' });
  assert(nonExistent.status === 401 && nonExistent.data.error, 'POST /api/auth/login rejects unregistered user with 401 JSON');

  // 4. Farm Plots GET /api/farms
  const farms = await request('/api/farms');
  assert(farms.status === 200 && Array.isArray(farms.data) && farms.data.length >= 6, 'GET /api/farms returns ' + (farms.data ? farms.data.length : 0) + ' real farm plots');
  const validCoordinates = farms.data.every(f => typeof f.latitude === 'number' && typeof f.longitude === 'number' && f.latitude !== 0 && f.longitude !== 0);
  assert(validCoordinates, 'All farm plots possess verified latitude and longitude coordinates');

  // 5. Crop Varieties GET /api/varieties
  const varieties = await request('/api/varieties');
  assert(varieties.status === 200 && Array.isArray(varieties.data) && varieties.data.length >= 6, 'GET /api/varieties returns ' + (varieties.data ? varieties.data.length : 0) + ' crop varieties');

  // 6. Agronomist Field Visit Observation Creation Flow
  const targetFarm = farms.data[0];
  const targetVariety = varieties.data[0];
  const obsPayload = {
    farmId: targetFarm.id,
    cropVarietyId: targetVariety.id,
    growthStage: 'VEGETATIVE',
    plantHealthScore: 8,
    soilMoisture: 'OPTIMAL',
    soilHealthNotes: 'Good organic carbon content and soil aggregation.',
    weatherCondition: 'SUNNY',
    pestSymptoms: 'No acute pest infestation.',
    notes: 'Agronomist validation inspection recorded during automated production test.'
  };

  const createObs = await request('/api/observations', 'POST', obsPayload, tokens['agronomist']);
  assert(createObs.status === 201 && (createObs.data.id || createObs.data._id), 'POST /api/observations creates new field observation linked to farm plot and crop variety');

  // 7. GIS Disease Surveillance Cases GET /api/diseases
  const diseases = await request('/api/diseases');
  assert(diseases.status === 200 && Array.isArray(diseases.data) && diseases.data.length >= 6, 'GET /api/diseases returns ' + (diseases.data ? diseases.data.length : 0) + ' disease outbreak surveillance reports');
  const validDiseaseCoordinates = diseases.data.every(d => typeof d.latitude === 'number' && typeof d.longitude === 'number' && d.latitude !== 0 && d.longitude !== 0);
  assert(validDiseaseCoordinates, 'All disease reports possess valid geographic coordinates for GIS radar mapping');

  // 8. Role-Based Access Isolation Guard
  const farmerAccessAdminUsers = await request('/api/users', 'GET', null, tokens['farmer']);
  assert(farmerAccessAdminUsers.status === 403, 'GET /api/users properly rejects unauthorized access from farmer role with 403 Forbidden');

  console.log('\n========================================================');
  console.log('FINAL RESULT: ' + passed + ' PASSED, ' + failed + ' FAILED');
  console.log('========================================================');
  process.exit(failed > 0 ? 1 : 0);
})();
