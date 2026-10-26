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
  console.log('=== STARTING RECOMMENDATIONS VERIFICATION TEST SUITE ===\n');
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
    // 1. Fetch all recommendations
    const allRes = await request('/recommendations');
    assert(allRes.status === 200 && Array.isArray(allRes.data), 'GET /api/recommendations returns 200 with array');
    console.log(`Retrieved ${allRes.data.length} total recommendations.`);
    assert(allRes.data.length >= 12, 'Historical recommendations are preserved (>= 12 records)');

    // 2. Verify farm and crop enrichment
    const hasCropName = allRes.data.every(r => typeof r.cropName === 'string' && r.cropName.length > 0);
    assert(hasCropName, 'Every recommendation has a cropName associated');

    const maizeRecs = allRes.data.filter(r => r.cropName?.toLowerCase() === 'maize');
    const wheatRecs = allRes.data.filter(r => r.cropName?.toLowerCase() === 'wheat');
    console.log(`Crop breakdown: Maize=${maizeRecs.length}, Wheat=${wheatRecs.length}, Total=${allRes.data.length}`);
    assert(maizeRecs.length > 0, 'Maize recommendations are correctly identified');
    assert(wheatRecs.length > 0, 'Wheat recommendations are correctly identified');

    // 3. Test that unverified claims are sanitized or qualified
    const unverifiedClaimsCleaned = allRes.data.every(r => {
      const benefit = r.expectedBenefit || '';
      // If it mentions percentages or hours, it must have an estimate qualifier
      const hasNumerical = /([0-9]+%|[0-9]+-[0-9]+%|[0-9]+\s*(?:hours|hrs|days|weeks))/i.test(benefit);
      if (!hasNumerical) return true;
      return /(estimate|unverified|varies)/i.test(benefit);
    });
    assert(unverifiedClaimsCleaned, 'Numerical benefits & timelines contain field estimate / unverified qualifiers');

    // 4. Test crop filtering via API
    const maizeApiRes = await request('/recommendations?crop=Maize');
    assert(maizeApiRes.status === 200, 'GET /api/recommendations?crop=Maize returns 200');
    const onlyMaize = maizeApiRes.data.every(r => r.cropName?.toLowerCase() === 'maize');
    assert(onlyMaize, 'GET /api/recommendations?crop=Maize does NOT mix unrelated Wheat');

    const wheatApiRes = await request('/recommendations?crop=Wheat');
    assert(wheatApiRes.status === 200, 'GET /api/recommendations?crop=Wheat returns 200');
    const onlyWheat = wheatApiRes.data.every(r => r.cropName?.toLowerCase() === 'wheat');
    assert(onlyWheat, 'GET /api/recommendations?crop=Wheat does NOT mix unrelated Maize');

    // 5. Test farm filtering via API
    // Anaimalai Bio-Maize farm id: 6ad5f8a36a24a7ff18cdea57
    const anaimalaiRes = await request('/recommendations?farmId=6ad5f8a36a24a7ff18cdea57');
    assert(anaimalaiRes.status === 200, 'GET /api/recommendations?farmId=6ad5f8a36a24a7ff18cdea57 returns 200');
    const anaimalaiNoWheat = anaimalaiRes.data.every(r => r.cropName?.toLowerCase() !== 'wheat');
    assert(anaimalaiNoWheat, 'Anaimalai Maize farm view strictly excludes Wheat recommendations');

    // 6. Test Mark Applied status update
    if (allRes.data.length > 0) {
      const targetRec = allRes.data[0];
      const updateRes = await request(`/recommendations/${targetRec.id}`, {
        method: 'PUT',
        body: { status: 'APPLIED' },
      });
      assert(updateRes.status === 200 && updateRes.data.status === 'APPLIED', 'PUT /api/recommendations/:id successfully marks as APPLIED');
    }

    console.log(`\n=== TEST RESULTS: ${passed}/${total} PASSED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
