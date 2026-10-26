const https = require('https');

const API_BASE = 'https://agri-bio-tech-management-platform.vercel.app/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// Check HaveIBeenPwned k-anonymity API for SHA-1 prefix
function checkHaveIBeenPwned(password) {
  const crypto = require('crypto');
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.pwnedpasswords.com',
      path: `/range/${prefix}`,
      method: 'GET',
      headers: { 'User-Agent': 'AgriBioTech-Security-Audit' },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const lines = body.split('\n');
        let count = 0;
        for (const line of lines) {
          const [hashSuffix, occ] = line.trim().split(':');
          if (hashSuffix === suffix) {
            count = parseInt(occ, 10);
            break;
          }
        }
        resolve({ sha1, count });
      });
    });
    req.on('error', () => resolve({ sha1, count: -1 }));
    req.end();
  });
}

async function runDemoAuthTests() {
  console.log('=== STARTING DEMO ACCOUNT AUTHENTICATION & BREACH FIX VERIFICATION ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Verify breach status in public breach databases (HaveIBeenPwned)
  console.log('Step 1: Verifying HaveIBeenPwned breach counts for legacy vs new demo credentials...');
  const legacyPwned = await checkHaveIBeenPwned('Farmer@123');
  console.log(`- Legacy password "Farmer@123": ${legacyPwned.count} public data breach occurrences.`);
  assert(legacyPwned.count > 0, 'Confirmed legacy demo password "Farmer@123" is in public breach databases (triggers Chrome warning)');

  const cleanPwned = await checkHaveIBeenPwned('AgriBio#Farmer2026!');
  console.log(`- New secure passphrase "AgriBio#Farmer2026!": ${cleanPwned.count} breach occurrences.`);
  assert(cleanPwned.count === 0, 'Confirmed new secure passphrase "AgriBio#Farmer2026!" has ZERO breach occurrences');

  // 2. Test 1-Click Demo Sandbox Session Endpoint
  console.log('\nStep 2: Testing POST /api/auth/demo-session endpoint...');
  const demoFarmerRes = await request('/auth/demo-session', {
    method: 'POST',
    body: { role: 'farmer' }
  });
  if (demoFarmerRes.status !== 200) {
    console.log(`Endpoint returned status: ${demoFarmerRes.status}`, demoFarmerRes.data);
  }
  assert(demoFarmerRes.status === 200, 'POST /auth/demo-session returns 200 OK');
  assert(demoFarmerRes.data && demoFarmerRes.data.token && demoFarmerRes.data.user.role === 'farmer', 'Demo session issues valid token and farmer profile');

  // Test other demo roles
  const demoAgroRes = await request('/auth/demo-session', {
    method: 'POST',
    body: { role: 'agronomist' }
  });
  assert(demoAgroRes.status === 200 && demoAgroRes.data.user.role === 'agronomist', 'Demo session issues valid agronomist token');

  const invalidRoleRes = await request('/auth/demo-session', {
    method: 'POST',
    body: { role: 'superhacker' }
  });
  assert(invalidRoleRes.status === 400, 'Demo session rejects invalid roles with 400');

  // 3. Verify Legacy POST /auth/demo-login remains 403 Forbidden (for strict security compliance)
  console.log('\nStep 3: Verifying legacy unauthenticated POST /auth/demo-login remains 403 Forbidden...');
  const legacyDemoLogin = await request('/auth/demo-login', { method: 'POST' });
  assert(legacyDemoLogin.status === 403, 'Legacy /auth/demo-login endpoint strictly returns 403 Forbidden');

  // 4. Test Demo Account Dual-Authentication (Passwords NOT Changed Automatically)
  console.log('\nStep 4: Testing demo account password behavior (No automatic password changes)...');
  const legacyFarmerLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'farmer@agribiotech.demo', password: 'Farmer@123' }
  });
  assert(legacyFarmerLogin.status === 200, 'Legacy Farmer@123 password still authenticates (passwords not changed automatically)');

  const cleanFarmerLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'farmer@agribiotech.demo', password: 'AgriBio#Farmer2026!' }
  });
  assert(cleanFarmerLogin.status === 200, 'Unbreached passphrase AgriBio#Farmer2026! authenticates cleanly');

  // 5. Test Real Farmer Account Isolation
  console.log('\nStep 5: Verifying real farmer account isolation...');
  const testFarmerEmail = `isolation_test_${Date.now()}@testfarm.in`;
  const testFarmerPass = 'MyRealFarmSecure#99!';

  // Register real farmer
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Isolation Test Farmer',
      email: testFarmerEmail,
      password: testFarmerPass,
      phone: '9876543210',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      primaryCrops: 'Paddy',
    }
  });
  assert(regRes.status === 201 || regRes.status === 200, 'Real farmer registered with unique password');

  // Real farmer authenticates with their unique password
  const realLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: testFarmerEmail, password: testFarmerPass }
  });
  assert(realLogin.status === 200, 'Real farmer authenticates with unique password');

  // Real farmer CANNOT use demo passphrase
  const attackLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: testFarmerEmail, password: 'AgriBio#Farmer2026!' }
  });
  assert(attackLogin.status === 401, 'Real farmer account CANNOT use demo passphrase (isolated)');

  // Real farmer CANNOT use legacy demo password
  const legacyAttackLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: testFarmerEmail, password: 'Farmer@123' }
  });
  assert(legacyAttackLogin.status === 401, 'Real farmer account CANNOT use legacy demo password (isolated)');

  console.log(`\n=== TEST RESULTS: ${passed}/${total} PASSED ===`);
  if (passed === total) {
    console.log('All tests passed successfully!');
  } else {
    process.exit(1);
  }
}

runDemoAuthTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
