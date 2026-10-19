// Comprehensive Test for Production Login Endpoints, Dual Routing & CORS Preflight

async function testFetch(baseUrl, path, method = 'GET', body = null, headers = {}) {
  const url = `${baseUrl}${path}`;
  const reqHeaders = {
    ...headers,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      let json = null;
      const text = await res.text();
      try { json = JSON.parse(text); } catch (e) {}

      return {
        status: res.status,
        headers: res.headers,
        body: json || text,
      };
    } catch (err) {
      lastError = err;
      await new Promise(r => setTimeout(r, 800));
    }
  }
  throw lastError;
}

async function runSuiteForTarget(baseUrl, targetName) {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Test Suite for: ${targetName} (${baseUrl})`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Healthcheck /health
  const res1 = await testFetch(baseUrl, '/health');
  assert(res1.status === 200 && res1.body && res1.body.status === 'online', 'GET /health returns 200 and status online', `status: ${res1.status}, body: ${JSON.stringify(res1.body)}`);

  // 2. Healthcheck /api/health
  const res2 = await testFetch(baseUrl, '/api/health');
  assert(res2.status === 200 && res2.body.status === 'online', 'GET /api/health returns 200 and status online');

  // 3. CORS Preflight OPTIONS /api/auth/login
  const res3 = await testFetch(baseUrl, '/api/auth/login', 'OPTIONS', null, {
    'Origin': 'https://agri-bio-tech-management-platform.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type,Authorization',
  });
  assert(res3.status === 204 || res3.status === 200, 'OPTIONS /api/auth/login preflight succeeds (200/204)');
  assert(
    res3.headers.get('access-control-allow-origin') === 'https://agri-bio-tech-management-platform.vercel.app' ||
    res3.headers.get('access-control-allow-origin') === '*',
    'CORS Allow-Origin header matches frontend domain'
  );

  // 4. Test POST /api/auth/login (Standard /api route for Admin)
  const res4 = await testFetch(baseUrl, '/api/auth/login', 'POST', {
    email: 'admin@agribiotech.demo',
    password: 'Admin@123',
  });
  assert(res4.status === 200 && res4.body.token && res4.body.user && res4.body.user.role === 'admin', 'POST /api/auth/login succeeds for Admin with valid token');

  // 5. Test POST /auth/login (Root route fallback for serverless path rewrites)
  const res5 = await testFetch(baseUrl, '/auth/login', 'POST', {
    email: 'admin@agribiotech.demo',
    password: 'Admin@123',
  });
  assert(res5.status === 200 && res5.body.token && res5.body.user && res5.body.user.role === 'admin', 'POST /auth/login (fallback) succeeds for Admin with token');

  // 6. Test Invalid Credentials (must reject with 401 and JSON error)
  const res6 = await testFetch(baseUrl, '/api/auth/login', 'POST', {
    email: 'admin@agribiotech.demo',
    password: 'WrongPassword123!',
  });
  assert(res6.status === 401 && res6.body.error, 'POST /api/auth/login correctly rejects invalid password with 401 JSON');

  // 7. Test Non-existent User (must reject with 401 and JSON error)
  const res7 = await testFetch(baseUrl, '/api/auth/login', 'POST', {
    email: 'nonexistent@agribiotech.demo',
    password: 'SomePassword123!',
  });
  assert(res7.status === 401 && res7.body.error, 'POST /api/auth/login correctly rejects non-existent user with 401 JSON');

  // 8. Test Normalized Double /api Prefix
  const res8 = await testFetch(baseUrl, '/api/api/auth/login', 'POST', {
    email: 'admin@agribiotech.demo',
    password: 'Admin@123',
  });
  assert(res8.status === 200 && res8.body.token, 'POST /api/api/auth/login (normalized double /api) succeeds');

  console.log(`Target ${targetName}: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function run() {
  const localOk = await runSuiteForTarget('http://localhost:5000', 'Local Dev Server');
  const prodOk = await runSuiteForTarget('https://agri-bio-tech-management-platform.vercel.app', 'Deployed Production Backend');

  console.log('\n================================');
  console.log(`OVERALL RESULT: ${localOk && prodOk ? 'ALL SUITES PASSED' : 'SUITE FAILED'}`);
  console.log('================================\n');

  process.exit(localOk && prodOk ? 0 : 1);
}

run().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
