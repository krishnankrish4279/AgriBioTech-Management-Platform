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

async function runPasswordSecurityTests() {
  console.log('=== STARTING PASSWORD SECURITY & RECOVERY TEST SUITE ===\n');
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

  try {
    // 1. Existing Farmer Login Check
    console.log('Step 1: Testing existing Farmer Login with registered credentials...');
    const loginExisting = await request('/auth/login', {
      method: 'POST',
      body: { email: 'farmer@agribiotech.demo', password: 'Farmer@123' },
    });
    assert(loginExisting.status === 200 && loginExisting.data?.token, 'Existing farmer account authenticates successfully');
    assert(loginExisting.data?.user?.role === 'farmer', 'User role is correctly identified as farmer');

    // 2. Real Farmer Account Creation with Unique Password
    console.log('\nStep 2: Testing Real Farmer Registration with unique, unbreached password...');
    const testFarmerEmail = `farmer.unique.${Date.now()}@agrofarm.demo`;
    const initialPassword = 'AgriSecure#Delta2026!';

    // Test rejection of weak password on registration
    const weakReg = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Selvam Murugan',
        email: `weak.${Date.now()}@agrofarm.demo`,
        password: '123',
      },
    });
    assert(weakReg.status === 400, 'Registration rejects weak passwords (< 8 chars)');

    // Test rejection of known breached password
    const breachedReg = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Selvam Murugan',
        email: `breached.${Date.now()}@agrofarm.demo`,
        password: 'Farmer@123',
      },
    });
    assert(breachedReg.status === 400, 'Registration rejects known breached/default dictionary passwords');

    // Valid unique password registration
    const validReg = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Selvam Murugan',
        email: testFarmerEmail,
        password: initialPassword,
        phone: '+91-98444-11223',
        state: 'Tamil Nadu',
        district: 'Thanjavur',
        primaryCrops: 'Paddy, Banana',
      },
    });
    assert(validReg.status === 201 && validReg.data?.token, 'Farmer account created with unique, secure password');
    assert(validReg.data?.user?.role === 'farmer', 'Farmer role assigned with profile creation');

    // 3. Test Farmer Login with newly created unique credentials
    console.log('\nStep 3: Testing Login with newly created farmer credentials...');
    const loginNew = await request('/auth/login', {
      method: 'POST',
      body: { email: testFarmerEmail, password: initialPassword },
    });
    assert(loginNew.status === 200 && loginNew.data?.token, 'Login succeeds with unique farmer password');

    // 4. Test Password Recovery (Forgot Password Flow)
    console.log('\nStep 4: Testing Password Recovery request...');
    const forgotRes = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: testFarmerEmail },
    });
    assert(forgotRes.status === 200 && forgotRes.data?.success === true, 'POST /auth/forgot-password initiates recovery');
    assert(forgotRes.data?.resetToken && forgotRes.data.resetToken.length > 20, 'Generates secure cryptographic reset token');
    const resetToken = forgotRes.data?.resetToken;

    // 5. Test Password Strength Enforcement on Password Reset
    console.log('\nStep 5: Testing Password Strength validation on Reset...');
    const weakReset = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, newPassword: '123' },
    });
    assert(weakReset.status === 400, 'Password reset rejects weak passwords (< 8 chars)');

    const breachedReset = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, newPassword: 'Farmer@123' },
    });
    assert(breachedReset.status === 400, 'Password reset rejects known breached dictionary passwords');

    // 6. Authorized Password Reset with Strong, Unique Password
    console.log('\nStep 6: Executing Authorized Password Reset with new unique password...');
    const updatedPassword = 'NewHarvest#BioPlot2026!';
    const validReset = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, newPassword: updatedPassword },
    });
    assert(validReset.status === 200 && validReset.data?.success === true, 'Password reset successfully executed');

    // 7. Verify Login with New Unique Password
    console.log('\nStep 7: Testing Farmer Login with updated password...');
    const loginUpdated = await request('/auth/login', {
      method: 'POST',
      body: { email: testFarmerEmail, password: updatedPassword },
    });
    assert(loginUpdated.status === 200 && loginUpdated.data?.token, 'Farmer successfully logs in with updated unique password');

    // 8. Verify Old Password is Inactive
    console.log('\nStep 8: Verifying initial password no longer authenticates...');
    const loginOld = await request('/auth/login', {
      method: 'POST',
      body: { email: testFarmerEmail, password: initialPassword },
    });
    assert(loginOld.status === 401, 'Previous password rejected after authorized reset');

    console.log(`\n=== TEST RESULTS: ${passed}/${total} PASSED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runPasswordSecurityTests();
