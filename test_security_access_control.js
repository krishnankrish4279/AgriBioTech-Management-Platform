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
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runSecurityTests() {
  console.log('===============================================================');
  console.log('🔒 RUNNING COMPREHENSIVE LOGIN, AUTHENTICATION & ACCESS CONTROL TESTS');
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
  // TEST 1: DIRECT DEMO LOGIN DISABLED (HTTP 403)
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: DIRECT DEMO LOGIN DISABLED (MUST USE CREDENTIALS) ---');
  const demoLoginAttempt = await request('/auth/demo-login', {
    method: 'POST',
    body: { role: 'admin' },
  });
  assert(demoLoginAttempt.status === 403, 'Direct demo login without credentials is rejected with HTTP 403 Forbidden');
  assert(demoLoginAttempt.data.error.includes('disabled'), 'Direct demo login error specifies credentials requirement');

  // --------------------------------------------------------------------------
  // TEST 2: VALID CREDENTIALS LOGIN FOR ALL 4 ROLES
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: VALID CREDENTIALS LOGIN FOR ALL 4 ROLES ---');
  const accounts = [
    { email: 'admin@agribiotech.demo', password: 'Admin@123', role: 'admin', name: 'Admin (Arjun Mehta)' },
    { email: 'agronomist@agribiotech.demo', password: 'Agronomist@123', role: 'agronomist', name: 'Agronomist (Priya Sharma)' },
    { email: 'scientist@agribiotech.demo', password: 'Scientist@123', role: 'biotech_expert', name: 'Scientist (Dr. Rahul Verma)' },
    { email: 'farmer@agribiotech.demo', password: 'Farmer@123', role: 'farmer', name: 'Farmer (Ramesh Kumar)' },
  ];

  const tokens = {};
  const userDocs = {};

  for (const acc of accounts) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: acc.email, password: acc.password }
    });
    assert(res.status === 200, `Login for ${acc.name} HTTP 200 OK`);
    assert(res.data.token && typeof res.data.token === 'string', `${acc.name} received cryptographically signed JWT token`);
    assert(res.data.user && res.data.user.role === acc.role, `${acc.name} backend-authenticated role verified as "${acc.role}"`);
    tokens[acc.role] = res.data.token;
    userDocs[acc.role] = res.data.user;
  }

  // --------------------------------------------------------------------------
  // TEST 3: INVALID CREDENTIALS REJECTION FOR ALL 4 ROLES
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: INVALID CREDENTIALS REJECTED (HTTP 401 & HTTP 400) ---');
  for (const acc of accounts) {
    const badPass = await request('/auth/login', {
      method: 'POST',
      body: { email: acc.email, password: 'WrongPassword@999' }
    });
    assert(badPass.status === 401, `Wrong password for ${acc.name} rejected with HTTP 401`);
  }

  const nonexistentUser = await request('/auth/login', {
    method: 'POST',
    body: { email: 'nonexistent@agribiotech.demo', password: 'AnyPassword@123' }
  });
  assert(nonexistentUser.status === 401, 'Nonexistent email rejected with HTTP 401');

  const missingCreds = await request('/auth/login', {
    method: 'POST',
    body: { email: '', password: '' }
  });
  assert(missingCreds.status === 400, 'Missing email/password rejected with HTTP 400');

  // --------------------------------------------------------------------------
  // TEST 4: UNAUTHENTICATED REQUESTS BLOCKED (HTTP 401)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: UNAUTHENTICATED REQUESTS BLOCKED (HTTP 401) ---');
  const unauthMe = await request('/auth/me');
  assert(unauthMe.status === 401, 'GET /auth/me without token returns HTTP 401');

  const unauthDashAdmin = await request('/dashboard/admin');
  assert(unauthDashAdmin.status === 401, 'GET /dashboard/admin without token returns HTTP 401');

  const unauthFarmers = await request('/farmers');
  assert(unauthFarmers.status === 401, 'GET /farmers without token returns HTTP 401');

  // --------------------------------------------------------------------------
  // TEST 5: ROLE-BASED DASHBOARD ISOLATION (HTTP 200 vs HTTP 403)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: ROLE-BASED DASHBOARD ISOLATION (HTTP 200 vs HTTP 403) ---');
  // Admin accessing Admin Dashboard -> OK
  const adminDash = await request('/dashboard/admin', { token: tokens.admin });
  assert(adminDash.status === 200, 'Admin can access Admin Dashboard (/dashboard/admin)');

  // Admin attempting to access Agronomist Dashboard -> FORBIDDEN 403!
  const adminAccessAgro = await request('/dashboard/agronomist', { token: tokens.admin });
  assert(adminAccessAgro.status === 403, 'Admin CANNOT access Agronomist Dashboard (/dashboard/agronomist) -> HTTP 403 Forbidden');

  // Agronomist accessing Agronomist Dashboard -> OK
  const agroDash = await request('/dashboard/agronomist', { token: tokens.agronomist });
  assert(agroDash.status === 200, 'Agronomist can access Agronomist Dashboard (/dashboard/agronomist)');

  // Agronomist attempting to access Admin Dashboard -> FORBIDDEN 403!
  const agroAccessAdmin = await request('/dashboard/admin', { token: tokens.agronomist });
  assert(agroAccessAdmin.status === 403, 'Agronomist CANNOT access Admin Dashboard (/dashboard/admin) -> HTTP 403 Forbidden');

  // Biotech Expert accessing Biotech Dashboard -> OK
  const biotechDash = await request('/dashboard/biotech', { token: tokens.biotech_expert });
  assert(biotechDash.status === 200, 'Biotech Expert can access Biotech Dashboard (/dashboard/biotech)');

  // Farmer attempting to access Scientist Dashboard -> FORBIDDEN 403!
  const farmerAccessBiotech = await request('/dashboard/biotech', { token: tokens.farmer });
  assert(farmerAccessBiotech.status === 403, 'Farmer CANNOT access Scientist Dashboard (/dashboard/biotech) -> HTTP 403 Forbidden');

  // Farmer accessing Farmer Dashboard -> OK
  const farmerDash = await request('/dashboard/farmer', { token: tokens.farmer });
  assert(farmerDash.status === 200, 'Farmer can access Farmer Dashboard (/dashboard/farmer)');

  // --------------------------------------------------------------------------
  // TEST 6: SCIENTIST RESTRICTED FROM FARMER PRIVATE ACCOUNT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: SCIENTIST RESTRICTED FROM FARMER PRIVATE ACCOUNT ---');
  const farmersList = await request('/farmers', { token: tokens.admin });
  const targetFarmer = farmersList.data[0];
  assert(!!targetFarmer, 'Target farmer account identified');

  if (targetFarmer) {
    const scientistAccessFarmer = await request(`/farmers/${targetFarmer.id}`, { token: tokens.biotech_expert });
    assert(scientistAccessFarmer.status === 403, 'Scientist CANNOT access Farmer private account (/farmers/:id) -> HTTP 403 Forbidden');

    const agroAccessFarmer = await request(`/farmers/${targetFarmer.id}`, { token: tokens.agronomist });
    assert(agroAccessFarmer.status === 200, 'Agronomist CAN access Farmer account for agricultural advisory -> HTTP 200 OK');
  }

  // --------------------------------------------------------------------------
  // TEST 7: SECURE ACCOUNT CREATION & PRIVILEGE ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: ACCOUNT CREATION PRIVILEGE RESTRICTION ---');
  // Public registration cannot grant admin role
  const publicAdminAttempt = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Malicious Visitor',
      email: `visitor_${Date.now()}@test.com`,
      password: 'Password@123',
      role: 'admin',
    }
  });
  assert(publicAdminAttempt.status === 403, 'Public registration attempting to grant admin role rejected with HTTP 403 Forbidden');

  // Unauthorized visitor cannot create additional administrators
  const unauthorizedAdminReg = await request('/auth/register-admin', {
    method: 'POST',
    body: {
      name: 'Second Rogue Admin',
      email: `rogue_${Date.now()}@test.com`,
      password: 'Password@123',
    }
  });
  assert(unauthorizedAdminReg.status === 403, 'Unauthorized visitor cannot register additional administrator -> HTTP 403 Forbidden');

  // Authorized Admin CAN create users with roles
  const testOfficerEmail = `agro_${Date.now()}@agribiotech.demo`;
  const adminCreateUser = await request('/users', {
    method: 'POST',
    token: tokens.admin,
    body: {
      name: 'New Authorized Agronomist',
      email: testOfficerEmail,
      password: 'OfficerPassword@123',
      role: 'agronomist',
      phone: '+91-98765-11223',
    }
  });
  assert(adminCreateUser.status === 201, 'Authorized Admin can create new Agronomist user account');

  // Verify created user can authenticate with their password
  const newOfficerLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: testOfficerEmail, password: 'OfficerPassword@123' }
  });
  assert(newOfficerLogin.status === 200 && newOfficerLogin.data.user.role === 'agronomist', 'Newly created user can authenticate with verified bcrypt password and role');

  // Clean up created test user
  if (adminCreateUser.data?.id) {
    await request(`/users/${adminCreateUser.data.id}`, { method: 'DELETE', token: tokens.admin });
  }

  // --------------------------------------------------------------------------
  // TEST 8: SECURITY AUDIT EVENTS & DEDUPLICATED ALERTS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 8: SECURITY AUDIT EVENTS & NOTIFICATIONS ---');
  const secEvents = await request('/security/events', { token: tokens.admin });
  assert(secEvents.status === 200 && Array.isArray(secEvents.data), 'Admin can view security events audit log');
  assert(secEvents.data.length > 0, `Security events stored count: ${secEvents.data.length}`);

  const adminNotifications = await request('/notifications', { token: tokens.admin });
  assert(adminNotifications.status === 200, 'Admin can fetch notifications');
  const securityAlerts = adminNotifications.data.notifications.filter(n => n.type === 'SECURITY_ALERT');
  assert(securityAlerts.length > 0, `Admin received ${securityAlerts.length} Security Alert notification(s)`);

  // --------------------------------------------------------------------------
  // TEST 9: JWT SIGNATURE TAMPERING
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 9: JWT INTEGRITY ENFORCEMENT ---');
  const tamperedToken = tokens.farmer.slice(0, -6) + 'XYZ123';
  const tamperedReq = await request('/dashboard/farmer', { token: tamperedToken });
  assert(tamperedReq.status === 401, 'Tampered token signature strictly rejected with HTTP 401');

  console.log('\n===============================================================');
  console.log(`🏁 SECURITY VALIDATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('Fatal security test error:', err);
  process.exit(1);
});
