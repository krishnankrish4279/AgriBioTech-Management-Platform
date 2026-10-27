const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `http://localhost:5000/api${path}`);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
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

async function verifyBioSolutionsRoles() {
  console.log('================================================================');
  console.log('  BIO SOLUTIONS ROLE-BASED ACCESS & PERMISSION VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, msg) {
    total++;
    if (cond) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
    }
  }

  // 1. Authenticate Farmer Ramesh
  const farmerLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'farmer@agribiotech.demo', password: 'Ramesh@123' }
  });
  assert(farmerLogin.status === 200, 'Farmer Ramesh logged in successfully');
  const farmerToken = farmerLogin.data?.token;

  // 2. Authenticate Biotech Expert
  const biotechLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'scientist@agribiotech.demo', password: 'Scientist@123' }
  });
  assert(biotechLogin.status === 200, 'Biotech Expert logged in successfully');
  const biotechToken = biotechLogin.data?.token;

  // 3. Authenticate Admin
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@agribiotech.demo', password: 'Admin@123' }
  });
  assert(adminLogin.status === 200, 'Admin logged in successfully');
  const adminToken = adminLogin.data?.token;

  // 4. Farmer calls /farms -> scoped to farmer
  const farmerFarms = await request('/farms', {
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  assert(farmerFarms.status === 200 && Array.isArray(farmerFarms.data), 'Farmer can fetch authorized farms');
  const farmerFarm = farmerFarms.data?.[0];
  console.log(`    Authorized farm: "${farmerFarm?.farmName}", Crop: "${farmerFarm?.currentCrop}"`);

  // 5. Farmer views recommendations
  const recs = await request('/recommendations', {
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  assert(recs.status === 200 && Array.isArray(recs.data), `Farmer received ${recs.data.length} recommendations`);

  if (recs.data.length > 0) {
    const testRec = recs.data[0];
    
    // 6. View Details
    const detailRes = await request(`/recommendations/${testRec.id}`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    assert(detailRes.status === 200 && detailRes.data?.title, `Farmer can view details for recommendation: "${detailRes.data?.title}"`);

    // 7. Mark Applied
    const markApplied = await request(`/recommendations/${testRec.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { status: 'APPLIED' }
    });
    assert(markApplied.status === 200 && markApplied.data?.status === 'APPLIED', 'Farmer can mark recommendation as APPLIED');

    // 8. Reject Tampering
    const tamper = await request(`/recommendations/${testRec.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { dosage: '999 Gallons', productName: 'Hacked Chemical' }
    });
    assert(tamper.status === 403, 'Farmer is forbidden from modifying formulation/dosage (HTTP 403)');
  }

  // 9. Farmer tries to call generate-ai -> MUST BE 403
  const farmerAI = await request('/recommendations/generate-ai', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: {
      cropName: 'Cotton',
      growthStage: 'VEGETATIVE',
      soilCondition: 'Black Soil',
      diseaseSymptom: 'Foliar Blight',
    }
  });
  assert(farmerAI.status === 403, `Direct AI inference by farmer rejected with HTTP 403: "${farmerAI.data?.error}"`);
  assert(
    farmerAI.data?.error === 'Forbidden: Requires one of [admin, biotech_expert], current role: farmer',
    'Exact error matches expected authorization error message'
  );

  // 10. Farmer tries to create expert protocol -> MUST BE 403
  const farmerCreate = await request('/recommendations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: {
      title: 'Farmer Biocontrol Protocol',
      recommendationType: 'BIOLOGICAL_CONTROL',
      cropName: 'Rice',
      productName: 'Self-made concoction',
      reasoning: 'Testing permissions',
    }
  });
  assert(farmerCreate.status === 403, `Direct protocol creation by farmer rejected with HTTP 403: "${farmerCreate.data?.error}"`);

  // 11. Biotech Expert runs AI inference -> MUST SUCCEED (200)
  const biotechAI = await request('/recommendations/generate-ai', {
    method: 'POST',
    headers: { Authorization: `Bearer ${biotechToken}` },
    body: {
      cropName: 'Rice',
      growthStage: 'VEGETATIVE',
      soilCondition: 'Clay Loam',
      diseaseSymptom: 'Bacterial Leaf Blight',
    }
  });
  assert(biotechAI.status === 200 && biotechAI.data?.recommendations?.length === 3, `Biotech Expert synthesized ${biotechAI.data?.recommendations?.length} recommendations`);

  // 12. Admin runs AI inference -> MUST SUCCEED (200)
  const adminAI = await request('/recommendations/generate-ai', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      cropName: 'Tomato',
      growthStage: 'FLOWERING',
      soilCondition: 'Sandy Loam',
      diseaseSymptom: 'Early Blight',
    }
  });
  assert(adminAI.status === 200 && adminAI.data?.recommendations?.length === 3, `Admin synthesized ${adminAI.data?.recommendations?.length} recommendations`);

  console.log(`\n================================================================`);
  console.log(`  VERIFICATION RESULTS: ${passed}/${total} PASSED`);
  console.log(`================================================================\n`);

  if (passed !== total) process.exit(1);
}

verifyBioSolutionsRoles().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
