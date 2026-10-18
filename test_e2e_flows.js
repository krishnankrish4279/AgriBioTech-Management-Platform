const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
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
  } catch (e) {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E PLATFORM & API VALIDATION');
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
  // TEST 1: AUTHENTICATION FOR ALL 4 ROLES
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: AUTHENTICATION FOR ALL 4 ROLES ---');

  const demoAccounts = [
    { email: 'admin@agribiotech.demo', password: 'Admin@123', expectedRole: 'admin', name: 'Admin' },
    { email: 'agronomist@agribiotech.demo', password: 'Agronomist@123', expectedRole: 'agronomist', name: 'Agronomist' },
    { email: 'scientist@agribiotech.demo', password: 'Scientist@123', expectedRole: 'biotech_expert', name: 'Scientist' },
    { email: 'farmer@agribiotech.demo', password: 'Farmer@123', expectedRole: 'farmer', name: 'Farmer' },
  ];

  const tokens = {};
  const userDocs = {};

  for (const acc of demoAccounts) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: acc.email, password: acc.password },
    });

    assert(res.status === 200, `Login for ${acc.name} (${acc.email}) HTTP status 200`);
    assert(res.data.token && typeof res.data.token === 'string', `${acc.name} received valid JWT token`);
    assert(res.data.user && res.data.user.role === acc.expectedRole, `${acc.name} user role matches "${acc.expectedRole}"`);

    tokens[acc.expectedRole] = res.data.token;
    userDocs[acc.expectedRole] = res.data.user;
  }

  // Test invalid credentials
  const badLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@agribiotech.demo', password: 'WrongPassword@999' },
  });
  assert(badLogin.status === 401, 'Invalid credentials rejected with HTTP 401');

  // --------------------------------------------------------------------------
  // TEST 2: ADMIN FLOW (DASHBOARD, USERS CRUD, KPIS)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: ADMIN FLOW & DASHBOARD KPIS ---');

  const kpis = await request('/analytics/kpis', { token: tokens.admin });
  assert(kpis.status === 200, 'KPIs endpoint responds 200');
  assert(typeof kpis.data.totalUsers === 'number' && kpis.data.totalUsers >= 4, `totalUsers KPI is present: ${kpis.data.totalUsers}`);
  assert(kpis.data.totalFarmers >= 4, `totalFarmers KPI is present: ${kpis.data.totalFarmers}`);
  assert(kpis.data.totalFarms >= 6, `totalFarms KPI is present: ${kpis.data.totalFarms}`);
  assert(kpis.data.totalVarieties >= 6, `totalVarieties KPI is present: ${kpis.data.totalVarieties}`);
  assert(kpis.data.totalDiseaseCases >= 6, `totalDiseaseCases KPI is present: ${kpis.data.totalDiseaseCases}`);

  // Admin User Management CRUD
  console.log('Testing User Management CRUD (Admin):');
  const allUsers = await request('/users', { token: tokens.admin });
  assert(allUsers.status === 200 && Array.isArray(allUsers.data), `Admin can list users (count: ${allUsers.data.length})`);

  // Create temporary user
  const tempEmail = `testuser_${Date.now()}@agribiotech.demo`;
  const createUserRes = await request('/users', {
    method: 'POST',
    token: tokens.admin,
    body: {
      name: 'Test Agro Officer',
      email: tempEmail,
      password: 'TempPassword@123',
      role: 'agronomist',
      phone: '+91-9988776655',
    },
  });
  assert(createUserRes.status === 201, 'Admin can create a new user');
  const createdUserId = createUserRes.data?.id;

  // Edit the created user
  if (createdUserId) {
    const updateUserRes = await request(`/users/${createdUserId}`, {
      method: 'PUT',
      token: tokens.admin,
      body: { name: 'Updated Agro Officer' },
    });
    assert(updateUserRes.status === 200 && updateUserRes.data.name === 'Updated Agro Officer', 'Admin can update user');

    // Delete the created user
    const deleteUserRes = await request(`/users/${createdUserId}`, {
      method: 'DELETE',
      token: tokens.admin,
    });
    assert(deleteUserRes.status === 200, 'Admin can delete user');
  }

  // --------------------------------------------------------------------------
  // TEST 3: CROP VARIETIES MANAGEMENT (NO "No Crop Varieties Found")
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: CROP VARIETY CRUD & QUERY SANITIZATION ---');

  // Verify default GET (with undefined parameter behavior avoided)
  const varietiesRes = await request('/varieties');
  assert(varietiesRes.status === 200, 'GET /varieties status 200');
  assert(Array.isArray(varietiesRes.data) && varietiesRes.data.length > 0, `Varieties returned count: ${varietiesRes.data.length} (NOT empty)`);

  // Verify with query filters
  const riceVarieties = await request('/varieties?cropType=Cereal');
  assert(riceVarieties.status === 200 && riceVarieties.data.length > 0, 'Filter /varieties?cropType=Cereal returns results');

  // Test Scientist / Admin creating a new variety and verifying immediate appearance
  const newVarietyData = {
    cropName: 'Finger Millet',
    varietyName: 'Ragi Bio-Nutri Plus',
    cropType: 'Millets',
    growingSeason: 'Kharif',
    soilRequirements: 'Red loamy, well-drained soil',
    expectedYieldMin: 18,
    expectedYieldMax: 26,
    yieldUnit: 'Quintals/Acre',
    diseaseResistanceTraits: 'Blast and drought resistant',
    biotechTraits: 'Zinc and iron biofortified, drought tolerant marker assisted',
    recommendedRegions: 'Tamil Nadu, Karnataka, Andhra Pradesh',
    description: 'High calcium and mineral rich cultivar developed for rainfed zones.',
    maturityDays: 110,
  };

  const createVarietyRes = await request('/varieties', {
    method: 'POST',
    token: tokens.biotech_expert,
    body: newVarietyData,
  });
  assert(createVarietyRes.status === 201, 'Biotech Scientist can create a new crop variety');
  const createdVarId = createVarietyRes.data?.id;

  // Verify it appears immediately in the variety list
  const verifyList = await request('/varieties');
  const foundVariety = verifyList.data.find(v => v.id === createdVarId || v.varietyName === 'Ragi Bio-Nutri Plus');
  assert(!!foundVariety, 'Newly created variety appears immediately in crop varieties list');

  // Clean up created variety
  if (createdVarId) {
    const delVar = await request(`/varieties/${createdVarId}`, {
      method: 'DELETE',
      token: tokens.biotech_expert,
    });
    assert(delVar.status === 200, 'Biotech Scientist / Admin can delete crop variety');
  }

  // --------------------------------------------------------------------------
  // TEST 4: DISEASE SURVEILLANCE & GIS MAP COORDINATES
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: DISEASE SURVEILLANCE & GIS RADAR COORDINATES ---');

  const diseasesRes = await request('/diseases');
  assert(diseasesRes.status === 200, 'GET /diseases status 200');
  assert(Array.isArray(diseasesRes.data) && diseasesRes.data.length > 0, `Disease cases returned count: ${diseasesRes.data.length}`);

  // Verify coordinates format and Tamil Nadu locations
  let allCoordsValid = true;
  for (const c of diseasesRes.data) {
    if (c.latitude !== undefined || c.longitude !== undefined) {
      // In Tamil Nadu / South India, latitude is around 8-15 N, longitude is around 76-81 E
      if (c.latitude < 8 || c.latitude > 20 || c.longitude < 76 || c.longitude > 85) {
        console.warn(`    ⚠️ Unexpected coordinates for ${c.diseaseName}: [${c.latitude}, ${c.longitude}]`);
        allCoordsValid = false;
      }
    }
  }
  assert(allCoordsValid, 'All disease markers have valid [latitude, longitude] in realistic Tamil Nadu/South India coordinates');

  // Verify Disease Catalog endpoint
  const catalogRes = await request('/diseases/catalog');
  assert(catalogRes.status === 200 && Array.isArray(catalogRes.data) && catalogRes.data.length > 0, `Disease catalog returns ${catalogRes.data.length} pathogen entries`);

  // --------------------------------------------------------------------------
  // TEST 5: BIOTECHNOLOGY RECOMMENDATIONS (NO "No Recommendations Found")
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: BIOTECHNOLOGY RECOMMENDATIONS ---');

  const recsRes = await request('/recommendations');
  assert(recsRes.status === 200, 'GET /recommendations status 200');
  assert(Array.isArray(recsRes.data) && recsRes.data.length > 0, `Recommendations returned count: ${recsRes.data.length} (NOT empty)`);

  const sampleRec = recsRes.data[0];
  assert(sampleRec.title && sampleRec.productName && sampleRec.recommendationType, 'Recommendation contains title, product name, and category');
  assert(typeof sampleRec.isAutomatedSuggestion === 'boolean', 'Distinguishes expert vs automated recommendation');

  // --------------------------------------------------------------------------
  // TEST 6: FARMER PORTAL & ROLE-BASED ACCESS CONTROL
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: FARMER PORTAL & ROLE-BASED ACCESS CONTROL ---');

  // Farmer's advisories
  const farmerAdvisories = await request('/advisories', { token: tokens.farmer });
  assert(farmerAdvisories.status === 200, 'Farmer can fetch their own advisories');
  assert(Array.isArray(farmerAdvisories.data) && farmerAdvisories.data.length > 0, `Farmer sees personalized advisories (count: ${farmerAdvisories.data.length})`);

  // RBAC test: Farmer should NOT be allowed to create users or delete crop varieties
  const farmerCreateUser = await request('/users', {
    method: 'POST',
    token: tokens.farmer,
    body: { name: 'Hacker', email: 'hacker@demo.com', password: '123', role: 'admin' },
  });
  assert(farmerCreateUser.status === 403, 'RBAC: Farmer cannot create users (HTTP 403 Forbidden)');

  const farmerAccessUsersList = await request('/users', { token: tokens.farmer });
  assert(farmerAccessUsersList.status === 403, 'RBAC: Farmer cannot list users (HTTP 403 Forbidden)');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
