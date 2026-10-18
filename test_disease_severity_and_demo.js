// test_disease_severity_and_demo.js
// Automated verification suite for disease severity, demo data handling, role permissions, and status transitions

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting AgriBioTech Disease Severity & Demo Data Handling Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Authenticate users
  console.log('🔑 Authenticating users across roles...');
  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  const adminAuth = await login('admin@agribiotech.demo', 'Admin@123');
  const agronomistAuth = await login('agronomist@agribiotech.demo', 'Agronomist@123');
  const scientistAuth = await login('scientist@agribiotech.demo', 'Scientist@123');
  const farmerAuth = await login('farmer@agribiotech.demo', 'Farmer@123');

  assert(adminAuth.status === 200 && adminAuth.data.token, 'Admin authenticated');
  assert(agronomistAuth.status === 200 && agronomistAuth.data.token, 'Agronomist authenticated');
  assert(scientistAuth.status === 200 && scientistAuth.data.token, 'Scientist (Biotech Expert) authenticated');
  assert(farmerAuth.status === 200 && farmerAuth.data.token, 'Farmer authenticated');

  const adminToken = adminAuth.data.token;
  const agronomistToken = agronomistAuth.data.token;
  const scientistToken = scientistAuth.data.token;
  const farmerToken = farmerAuth.data.token;

  // 2. Test Demo Records vs Real Field Reports
  console.log('\n🏷️  Testing Demo Records tagging and distinction...');
  const casesRes = await fetch(`${BASE_URL}/diseases`, {
    headers: { Authorization: `Bearer ${agronomistToken}` },
  });
  const allCases = await casesRes.json();
  assert(casesRes.status === 200 && Array.isArray(allCases), 'Fetched disease surveillance records');

  const demoCases = allCases.filter((c) => c.isDemo === true);
  assert(demoCases.length >= 6, `Found ${demoCases.length} baseline demo records labeled with isDemo: true`);
  demoCases.forEach((c) => {
    assert(c.isDemo === true, `Demo case "${c.diseaseName}" has isDemo === true`);
  });

  // 3. Test Reporting by Agronomist: custom severity & status preserved, not forced to LOW or RESOLVED
  console.log('\n🌾 Testing Agronomist Reporting with custom severity & status...');
  const farmsRes = await fetch(`${BASE_URL}/farms`, {
    headers: { Authorization: `Bearer ${agronomistToken}` },
  });
  const farms = await farmsRes.json();
  assert(farms.length > 0, `Found ${farms.length} farms for surveillance linking`);
  const targetFarm = farms[0];

  const reportPayload = {
    farmId: targetFarm.id,
    diseaseName: 'Test Fall Armyworm Infestation',
    severity: 'HIGH',
    status: 'ACTIVE',
    symptoms: 'Aggressive leaf perforation with whorl damage and visible larvae frass',
    recommendedTreatment: 'Apply pheromone bait lures and spray Bacillus thuringiensis kurstaki',
  };

  const createRes = await fetch(`${BASE_URL}/diseases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${agronomistToken}`,
    },
    body: JSON.stringify(reportPayload),
  });
  const createdCase = await createRes.json();
  assert(createRes.status === 201, 'Agronomist successfully submitted disease outbreak report');
  assert(createdCase.severity === 'HIGH', `Reported severity preserved as HIGH (was: ${createdCase.severity})`);
  assert(createdCase.status === 'ACTIVE', `Reported status preserved as ACTIVE (was: ${createdCase.status})`);
  assert(createdCase.isDemo === false, `Real field report marked with isDemo: false`);
  assert(createdCase.latitude !== undefined && createdCase.longitude !== undefined, 'Coordinates populated from farm');

  const testCaseId = createdCase.id;

  // 4. Test Biotech Expert Review & Status Update
  console.log('\n🔬 Testing Biotech Expert permission to update disease severity and case status...');
  const scientistUpdateRes = await fetch(`${BASE_URL}/diseases/${testCaseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${scientistToken}`,
    },
    body: JSON.stringify({
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      recommendedTreatment: 'Updated biotech protocol: Release Trichogramma chilonis egg parasitoids (50,000/ha)',
    }),
  });
  const scientistUpdatedCase = await scientistUpdateRes.json();
  assert(scientistUpdateRes.status === 200, 'Biotech Expert authorized to update disease case (HTTP 200)');
  assert(scientistUpdatedCase.severity === 'CRITICAL', 'Biotech Expert elevated severity to CRITICAL');
  assert(scientistUpdatedCase.status === 'INVESTIGATING', 'Biotech Expert set status to INVESTIGATING (Under Investigation)');
  assert(scientistUpdatedCase.recommendedTreatment.includes('Trichogramma'), 'Biotech Expert prescribed biotech treatment');

  // 5. Test Agronomist Status Transition to RESOLVED
  console.log('\n🌱 Testing Status Transition to RESOLVED...');
  const resolveRes = await fetch(`${BASE_URL}/diseases/${testCaseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${agronomistToken}`,
    },
    body: JSON.stringify({
      status: 'RESOLVED',
      severity: 'LOW',
    }),
  });
  const resolvedCase = await resolveRes.json();
  assert(resolveRes.status === 200, 'Case updated to RESOLVED');
  assert(resolvedCase.status === 'RESOLVED', 'Status is RESOLVED');
  assert(resolvedCase.resolvedAt !== undefined, 'resolvedAt timestamp recorded for historical surveillance');

  // 6. Test Surveillance Query: Resolved case still queryable in history
  console.log('\n📜 Testing Surveillance History availability...');
  const historyRes = await fetch(`${BASE_URL}/diseases?status=RESOLVED`, {
    headers: { Authorization: `Bearer ${agronomistToken}` },
  });
  const resolvedList = await historyRes.json();
  const foundResolved = resolvedList.some((c) => c.id === testCaseId);
  assert(foundResolved, 'Resolved case remains accessible in surveillance history');

  // 7. Test Severity Filters on API
  console.log('\n🔍 Testing API Severity Filters...');
  const criticalRes = await fetch(`${BASE_URL}/diseases?severity=CRITICAL`, {
    headers: { Authorization: `Bearer ${agronomistToken}` },
  });
  const criticalList = await criticalRes.json();
  assert(criticalList.every((c) => c.severity === 'CRITICAL'), 'All returned cases match CRITICAL severity filter');

  const highRes = await fetch(`${BASE_URL}/diseases?severity=HIGH`, {
    headers: { Authorization: `Bearer ${agronomistToken}` },
  });
  const highList = await highRes.json();
  assert(highList.every((c) => c.severity === 'HIGH'), 'All returned cases match HIGH severity filter');

  // 8. Test Farmer Problem Reporting: Not auto-resolved or forced low
  console.log('\n👨‍🌾 Testing Farmer Problem Reporting...');
  const farmerReportRes = await fetch(`${BASE_URL}/diseases/farmer-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${farmerToken}`,
    },
    body: JSON.stringify({
      farmId: targetFarm.id,
      crop: 'Cotton',
      problemType: 'Yellow leaves',
      description: 'Severe yellowing on upper leaves across most of the field',
      affectedArea: 'Most of field',
    }),
  });
  const farmerReport = await farmerReportRes.json();
  assert(farmerReportRes.status === 201, 'Farmer submitted crop problem report');
  assert(farmerReport.status === 'REPORTED', `Farmer submission has status 'REPORTED', not RESOLVED (was: ${farmerReport.status})`);
  assert(farmerReport.severity === 'HIGH', `Farmer affectedArea 'Most of field' correctly mapped to HIGH severity (was: ${farmerReport.severity})`);

  // Clean up test reports
  console.log('\n🧹 Cleaning up test cases...');
  if (testCaseId) {
    await fetch(`${BASE_URL}/diseases/${testCaseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
  if (farmerReport.id) {
    await fetch(`${BASE_URL}/diseases/${farmerReport.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
  console.log('  Cleaned up temporary test cases.');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
