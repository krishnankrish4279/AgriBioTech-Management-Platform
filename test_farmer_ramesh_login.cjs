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

async function runTests() {
  console.log('=== VERIFYING FARMER DEMO CREDENTIAL RAMESH@123 ON PRODUCTION ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
    }
  }

  // 1. Farmer Login with Ramesh@123
  console.log('Step 1: Authenticating farmer demo account with Ramesh@123...');
  const farmerRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'farmer@agribiotech.demo', password: 'Ramesh@123' },
  });
  assert(farmerRes.status === 200, 'POST /auth/login returns 200 OK for farmer with Ramesh@123');
  assert(farmerRes.data && farmerRes.data.user && farmerRes.data.user.role === 'farmer', 'User role is correctly returned as farmer');
  assert(farmerRes.data.token && typeof farmerRes.data.token === 'string', 'Valid JWT auth token received');

  // 2. Admin Login with Admin@123 (unchanged)
  console.log('\nStep 2: Checking other users credentials remained untouched...');
  const adminRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@agribiotech.demo', password: 'Admin@123' },
  });
  assert(adminRes.status === 200 && adminRes.data.user.role === 'admin', 'Admin continues to authenticate with Admin@123');

  // 3. Scientist Login (unchanged)
  const sciRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'scientist@agribiotech.demo', password: 'Scientist@123' },
  });
  assert(sciRes.status === 200 && sciRes.data.user.role === 'biotech_expert', 'Scientist continues to authenticate with Scientist@123');

  // 4. Agronomist Login (unchanged)
  const agroRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'agronomist@agribiotech.demo', password: 'Agronomist@123' },
  });
  assert(agroRes.status === 200 && agroRes.data.user.role === 'agronomist', 'Agronomist continues to authenticate with Agronomist@123');

  // 5. Isolation: Admin cannot authenticate with Ramesh@123
  console.log('\nStep 3: Checking credential isolation across accounts...');
  const adminWithRamesh = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@agribiotech.demo', password: 'Ramesh@123' },
  });
  assert(adminWithRamesh.status === 401, 'Admin cannot log in with Ramesh@123 (strictly isolated)');

  // 6. Invalid password rejection
  const invalidPass = await request('/auth/login', {
    method: 'POST',
    body: { email: 'farmer@agribiotech.demo', password: 'WrongPassword!456' },
  });
  assert(invalidPass.status === 401, 'Invalid password is rejected with 401');

  console.log(`\n=== RESULTS: ${passed}/${total} PASSED ===`);
  if (passed !== total) process.exit(1);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
