// Comprehensive Test for Production Login Endpoints, Dual Routing & CORS Preflight
const http = require('http');

async function testRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      ...(dataString ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dataString) } : {}),
    };

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json || data });
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting Production Deployment & Login Endpoint Verification Suite...\n');

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
  const res1 = await testRequest('/health');
  assert(res1.status === 200 && res1.body.status === 'online', 'GET /health returns 200 and status online');

  // 2. Healthcheck /api/health
  const res2 = await testRequest('/api/health');
  assert(res2.status === 200 && res2.body.status === 'online', 'GET /api/health returns 200 and status online');

  // 3. CORS Preflight OPTIONS /api/auth/login
  const res3 = await testRequest('/api/auth/login', 'OPTIONS', null, {
    'Origin': 'https://my-agribiotech-frontend.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type,Authorization',
  });
  assert(res3.status === 204 || res3.status === 200, 'OPTIONS /api/auth/login preflight succeeds (200/204)');
  assert(res3.headers['access-control-allow-origin'] === 'https://my-agribiotech-frontend.vercel.app' || res3.headers['access-control-allow-origin'] === '*', 'CORS Allow-Origin header present');

  // 4. Test POST /api/auth/login (Standard /api route)
  const res4 = await testRequest('/api/auth/login', 'POST', {
    email: 'admin@agribiotech.demo',
    password: 'Admin@123',
  });
  assert(res4.status === 200 && res4.body.token && res4.body.user && res4.body.user.role === 'admin', 'POST /api/auth/login succeeds with valid Admin token & user');

  // 5. Test POST /auth/login (Root route fallback for serverless path rewrites)
  const res5 = await testRequest('/auth/login', 'POST', {
    email: 'agronomist@agribiotech.demo',
    password: 'Agronomist@123',
  });
  assert(res5.status === 200 && res5.body.token && res5.body.user && res5.body.user.role === 'agronomist', 'POST /auth/login (serverless fallback) succeeds with Agronomist token');

  // 6. Test Scientist login
  const res6 = await testRequest('/api/auth/login', 'POST', {
    email: 'scientist@agribiotech.demo',
    password: 'Scientist@123',
  });
  assert(res6.status === 200 && res6.body.token && res6.body.user && res6.body.user.role === 'biotech_expert', 'POST /api/auth/login succeeds for Scientist');

  // 7. Test Farmer login
  const res7 = await testRequest('/api/auth/login', 'POST', {
    email: 'farmer@agribiotech.demo',
    password: 'Farmer@123',
  });
  assert(res7.status === 200 && res7.body.token && res7.body.user && res7.body.user.role === 'farmer', 'POST /api/auth/login succeeds for Farmer');

  // 8. Test Invalid Credentials (must reject with 401 and JSON error)
  const res8 = await testRequest('/api/auth/login', 'POST', {
    email: 'admin@agribiotech.demo',
    password: 'WrongPassword123!',
  });
  assert(res8.status === 401 && res8.body.error, 'POST /api/auth/login correctly rejects invalid password with 401 JSON');

  console.log(`\n================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
