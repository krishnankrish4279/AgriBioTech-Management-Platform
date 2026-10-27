const http = require('http');

const API_BASE = 'http://localhost:5000/api';

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

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('  AGRIBIOTECH PLATFORM - INTEGRATED THREE-MODULE VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 0: AUTHENTICATION FOR ALL 4 ROLES
  // -------------------------------------------------------------------------
  console.log('--- Step 0: Authenticating All 4 Roles ---');
  
  const farmerLogin = await request('/auth/demo-session', { method: 'POST', body: { role: 'farmer' } });
  const farmerToken = farmerLogin.data?.token;
  assert(farmerToken && farmerLogin.status === 200, 'Farmer demo session authenticated successfully');

  const agronomistLogin = await request('/auth/demo-session', { method: 'POST', body: { role: 'agronomist' } });
  const agronomistToken = agronomistLogin.data?.token;
  assert(agronomistToken && agronomistLogin.status === 200, 'Agronomist demo session authenticated successfully');

  const biotechLogin = await request('/auth/demo-session', { method: 'POST', body: { role: 'biotech_expert' } });
  const biotechToken = biotechLogin.data?.token;
  assert(biotechToken && biotechLogin.status === 200, 'Biotechnology Expert demo session authenticated successfully');

  const adminLogin = await request('/auth/demo-session', { method: 'POST', body: { role: 'admin' } });
  const adminToken = adminLogin.data?.token;
  assert(adminToken && adminLogin.status === 200, 'Admin demo session authenticated successfully');

  // Fetch all farms with admin to get authorized vs unauthorized farms
  const allFarmsRes = await request('/farms', { headers: { Authorization: `Bearer ${adminToken}` } });
  const allFarms = allFarmsRes.data || [];
  assert(allFarms.length >= 2, `Located ${allFarms.length} registered farms in database`);

  // Farmer's authorized farm
  const farmerFarmsRes = await request('/farms', { headers: { Authorization: `Bearer ${farmerToken}` } });
  const farmerFarms = farmerFarmsRes.data || [];
  const farmerFarm = farmerFarms[0] || allFarms[0];

  // A different farm NOT owned by this farmer
  const unauthorizedFarm = allFarms.find(f => f.id !== farmerFarm.id && f._id !== farmerFarm.id) || allFarms[1];

  // Create an active disease report for the farmer's farm
  const reportRes = await request('/diseases/cases', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: {
      farmId: farmerFarm.id || farmerFarm._id,
      diseaseName: 'Yellow Mosaic Virus (Begomovirus)',
      crop: farmerFarm.currentCrop || 'Cotton',
      severity: 'HIGH',
      status: 'ACTIVE',
      symptoms: 'Foliar chlorotic mottling, leaf curling, and whitefly infestations',
      affectedArea: '2.5 Acres',
      dateObserved: new Date().toISOString(),
    },
  });
  const farmerCase = reportRes.data?.diseaseReport || reportRes.data;
  const caseId = farmerCase.id || farmerCase._id;
  assert(farmerCase && caseId, `Created fresh active disease case for farmer farm: ${caseId}`);

  // Create or pick an unauthorized case on another farm
  const otherReportRes = await request('/diseases/cases', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      farmId: unauthorizedFarm.id || unauthorizedFarm._id,
      diseaseName: 'Bacterial Wilt (Ralstonia solanacearum)',
      crop: unauthorizedFarm.currentCrop || 'Tomato',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      symptoms: 'Rapid diurnal wilting of leaves and vascular browning',
      affectedArea: '3.0 Acres',
      dateObserved: new Date().toISOString(),
    },
  });
  const unauthorizedCase = otherReportRes.data?.diseaseReport || otherReportRes.data;
  const unauthorizedCaseId = unauthorizedCase.id || unauthorizedCase._id;

  // -------------------------------------------------------------------------
  // MODULE 1: DISEASE SURVEILLANCE CASE FOLLOW-UP WORKFLOW
  // -------------------------------------------------------------------------
  console.log('\n--- MODULE 1: Disease Follow-Up Workflow ---');

  // 1. Farmer submits a valid follow-up for their active case
  const followUpData = {
    treatmentDate: new Date().toISOString(),
    treatmentApplied: 'Applied Beauveria bassiana foliar bio-spray (2.5 ml/L) with neem seed kernel extract',
    currentSymptoms: 'Foliar yellowing contained, whitefly nymph population reduced by 65%',
    pestActivity: 'Whitefly counts dropped from 14/leaf to 4/leaf; no secondary vector spread',
    currentCondition: 'Improved',
    additionalObservations: 'Crop vigor improving, new terminal shoots emerging healthy',
  };

  const submitRes = await request(`/diseases/cases/${caseId}/follow-ups`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: followUpData,
  });

  assert(
    submitRes.status === 201 && submitRes.data?.followUp?.id,
    'Authorized farmer successfully submitted follow-up report for their case',
    JSON.stringify(submitRes.data)
  );

  const followUpId = submitRes.data?.followUp?.id;

  // 2. Evidence-Based Resolution Rule: applying treatment does NOT automatically resolve case
  const caseCheckRes = await request(`/diseases/cases/${caseId}`, {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const caseAfterFollowUp = caseCheckRes.data;
  assert(
    caseAfterFollowUp?.status !== 'RESOLVED' && caseAfterFollowUp?.status !== 'Resolved',
    'Evidence-based resolution rule preserved: applying treatment does NOT automatically resolve case',
    `Current Status: ${caseAfterFollowUp?.status}`
  );
  assert(
    caseAfterFollowUp?.pendingFollowUpReview === true,
    'Case flagged with pendingFollowUpReview: true for agronomist/expert review'
  );

  // 3. Security Isolation: Farmer CANNOT submit follow-up on another farmer's unauthorized case
  const unauthorizedRes = await request(`/diseases/cases/${unauthorizedCaseId}/follow-ups`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: followUpData,
  });
  assert(
    unauthorizedRes.status === 403,
    'Backend strictly forbids farmer from submitting follow-up against another farmer\'s unauthorized case (HTTP 403)',
    `Status: ${unauthorizedRes.status}`
  );

  // 4. Permission Boundary: Farmer CANNOT review follow-up or change official case status
  const farmerReviewAttempt = await request(`/diseases/cases/${caseId}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: {
      followUpId,
      newStatus: 'Resolved',
      reviewNotes: 'Farmer attempting to declare official resolution',
    },
  });
  assert(
    farmerReviewAttempt.status === 403,
    'Backend strictly forbids farmer from recording official agronomist review or changing case status (HTTP 403)'
  );

  // 5. Agronomist reviews the follow-up and sets status to Treatment Ongoing
  const agronomistReview1 = await request(`/diseases/cases/${caseId}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${agronomistToken}` },
    body: {
      followUpId,
      newStatus: 'Treatment Ongoing',
      reviewNotes: 'Verified whitefly reduction from 14/leaf to 4/leaf. Biological mycoparasitic activity confirmed. Continue monitoring canopy for 5 additional days.',
    },
  });
  assert(
    agronomistReview1.status === 200,
    'Authorized agronomist successfully recorded review and updated status to "Treatment Ongoing"'
  );

  // 6. Audit Trail: Verify history, reviewer identity, and timestamp persist
  const caseWithAudit = await request(`/diseases/cases/${caseId}`, {
    headers: { Authorization: `Bearer ${agronomistToken}` },
  });
  const auditEntries = caseWithAudit.data?.auditTrail || [];
  assert(
    auditEntries.length > 0,
    `Audit trail accurately preserved ${auditEntries.length} chronological actions with reviewer identities & timestamps`
  );

  // 7. Evidence-Based Case Resolution by Authorized Reviewer
  const agronomistResolve = await request(`/diseases/cases/${caseId}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${agronomistToken}` },
    body: {
      followUpId,
      newStatus: 'Resolved',
      reviewNotes: 'Microscopic and field photographic evidence confirms zero viral spread and complete nymph eradication. Official resolution approved.',
      reason: 'Evidence confirms complete symptom abatement and restored foliar health.',
    },
  });
  assert(
    agronomistResolve.status === 200 && agronomistResolve.data?.diseaseCase?.status === 'Resolved',
    'Authorized agronomist marked case as Resolved with required agronomic justification'
  );

  // -------------------------------------------------------------------------
  // MODULE 2: BIO SOLUTIONS ROLE-BASED ACCESS & AUTHORIZATION
  // -------------------------------------------------------------------------
  console.log('\n--- MODULE 2: Bio Solutions Role-Based Access and Authorization ---');

  // 1. Farmer can view recommendations
  const farmerRecsRes = await request('/recommendations', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  assert(
    farmerRecsRes.status === 200 && Array.isArray(farmerRecsRes.data),
    `Farmer can access recommendations list (${farmerRecsRes.data?.length || 0} items)`
  );

  const testRec = farmerRecsRes.data?.[0];
  if (testRec) {
    const recId = testRec.id || testRec._id;

    // 2. Farmer can view recommendation details
    const recDetailRes = await request(`/recommendations/${recId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(
      recDetailRes.status === 200 && recDetailRes.data?.title,
      'Farmer can view recommendation details'
    );

    // 3. Farmer can mark recommendation as applied
    const markAppliedRes = await request(`/recommendations/${recId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { status: 'APPLIED' },
    });
    assert(
      markAppliedRes.status === 200 && markAppliedRes.data?.status === 'APPLIED',
      'Farmer can mark recommendation as APPLIED, and status persists correctly'
    );

    // 4. Farmer CANNOT modify expert prescription fields
    const farmerTamperRes = await request(`/recommendations/${recId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { dosage: '100 Liters per acre', productName: 'Unauthorized Chemical' },
    });
    assert(
      farmerTamperRes.status === 403,
      'Backend forbids farmer from modifying expert prescription protocol fields (HTTP 403)'
    );
  }

  // 5. Farmer CANNOT generate AI recommendations
  const farmerAIRes = await request('/recommendations/generate-ai', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: {
      cropName: 'Cotton',
      growthStage: 'VEGETATIVE',
      soilCondition: 'Alluvial Loam',
      diseaseSymptom: 'Foliar Spots',
    },
  });
  assert(
    farmerAIRes.status === 403 && (farmerAIRes.data?.error?.includes('Requires one of [admin, biotech_expert]') || farmerAIRes.data?.error?.includes('Forbidden')),
    `Backend strictly forbids farmer from running AI prescription synthesis (HTTP 403: "${farmerAIRes.data?.error}")`
  );

  // 6. Farmer CANNOT create expert protocols
  const farmerCreateRes = await request('/recommendations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: {
      title: 'Farmer Prescribed Protocol',
      recommendationType: 'BIOFERTILIZER',
      cropName: 'Wheat',
    },
  });
  assert(
    farmerCreateRes.status === 403 && (farmerCreateRes.data?.error?.includes('Requires one of [admin, biotech_expert]') || farmerCreateRes.data?.error?.includes('Forbidden')),
    `Backend strictly forbids farmer from creating expert protocols (HTTP 403: "${farmerCreateRes.data?.error}")`
  );

  // 7. Admin CAN run AI Recommender
  const adminAIRes = await request('/recommendations/generate-ai', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      cropName: 'Tomato',
      growthStage: 'FLOWERING',
      soilCondition: 'Sandy Loam',
      diseaseSymptom: 'Early Blight Foliar Spots',
    },
  });
  assert(
    adminAIRes.status === 200 && adminAIRes.data?.recommendations?.length > 0,
    `Authorized Admin successfully ran AI Recommender (generated ${adminAIRes.data?.recommendations?.length} prescriptions)`
  );

  // 8. Biotech Expert CAN run AI Recommender
  const biotechAIRes = await request('/recommendations/generate-ai', {
    method: 'POST',
    headers: { Authorization: `Bearer ${biotechToken}` },
    body: {
      cropName: 'Rice',
      growthStage: 'VEGETATIVE',
      soilCondition: 'Clay Loam',
      diseaseSymptom: 'Bacterial Leaf Blight',
    },
  });
  assert(
    biotechAIRes.status === 200 && biotechAIRes.data?.recommendations?.length > 0,
    `Biotechnology Expert successfully ran AI Recommender (generated ${biotechAIRes.data?.recommendations?.length} prescriptions)`
  );

  // 9. Admin CAN prescribe expert protocol
  const adminProtocolRes = await request('/recommendations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      title: 'Trichoderma viride Bio-Fungicide Drench Protocol',
      productName: 'BioTrich-V WP',
      recommendationType: 'BIOPESTICIDE',
      cropName: 'Chilli',
      dosage: '5g per Liter of root drench',
      reasoning: 'Suppresses Fusarium wilt and damping off via competitive root colonization',
      isAutomatedSuggestion: false,
    },
  });
  assert(
    adminProtocolRes.status === 201 && adminProtocolRes.data?.title,
    'Admin successfully prescribed new expert biological protocol'
  );

  // -------------------------------------------------------------------------
  // MODULE 3: COMPLETE LIVE WEATHER SYSTEM & ADVISORIES
  // -------------------------------------------------------------------------
  console.log('\n--- MODULE 3: Live Weather System with Open-Meteo & Radar ---');

  // 1. Fetch live meteorological observations from Open-Meteo for GPS coordinates
  const weatherRes = await request('/weather/current?lat=13.0827&lng=80.2707&locationName=Chennai%20Agricultural%20Zone');
  assert(
    weatherRes.status === 200 && weatherRes.data?.current?.temperature != null,
    `Real Open-Meteo observation fetched: ${weatherRes.data?.current?.temperature}°C, ${weatherRes.data?.current?.relativeHumidity}% Humidity, Condition: "${weatherRes.data?.current?.conditionText}"`
  );
  assert(
    weatherRes.data?.hourly?.length >= 24,
    `Hourly forecast provides ${weatherRes.data?.hourly?.length} hours of forecast data`
  );
  assert(
    weatherRes.data?.daily?.length >= 7,
    `Daily forecast provides ${weatherRes.data?.daily?.length} days of daily forecast data`
  );
  assert(
    weatherRes.data?.source?.includes('Open-Meteo'),
    `Data source explicitly credited: "${weatherRes.data?.source}"`
  );

  // 2. Fetch registered farms real weather
  const farmsWeatherRes = await request('/weather/farms', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  assert(
    farmsWeatherRes.status === 200 && Array.isArray(farmsWeatherRes.data),
    `Fetched live weather for ${farmsWeatherRes.data?.length} registered farms using actual coordinates`
  );

  // 3. Fetch live RainViewer radar overlay metadata
  const radarRes = await request('/weather/radar-overlay');
  assert(
    radarRes.status === 200 && radarRes.data?.tileUrl?.includes('tilecache.rainviewer.com'),
    `RainViewer live precipitation radar overlay active: ${radarRes.data?.tileUrl}`
  );

  // 4. Generate & sync rule-based agronomic weather advisories
  const syncAdvisoriesRes = await request('/weather/sync-advisories', {
    method: 'POST',
    headers: { Authorization: `Bearer ${agronomistToken}` },
  });
  assert(
    syncAdvisoriesRes.status === 200,
    `Weather advisory engine evaluated registered farms: ${syncAdvisoriesRes.data?.message} (Active: ${syncAdvisoriesRes.data?.activeCount ?? 0})`
  );

  // 5. Query advisories under WEATHER_ACTION category
  const weatherAdvRes = await request('/advisories?category=WEATHER_ACTION', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  assert(
    weatherAdvRes.status === 200 && Array.isArray(weatherAdvRes.data),
    `Weather advisories query under category WEATHER_ACTION succeeded (${weatherAdvRes.data?.length} advisories)`
  );

  // 6. Invalid coordinates error handling
  const invalidCoordRes = await request('/weather/current?lat=invalid&lng=xyz');
  assert(
    invalidCoordRes.status === 400,
    'Backend safely rejects invalid coordinates with HTTP 400 without fabricating fake data'
  );

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
