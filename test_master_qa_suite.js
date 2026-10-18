// test_master_qa_suite.js
// Master QA and Bug Audit Test Runner for AgriBioTech Platform

const { execSync } = require('child_process');

console.log('================================================================');
console.log('🌾 AGRIBIOTECH PLATFORM: MASTER QUALITY ASSURANCE & VERIFICATION');
console.log('================================================================\n');

const suites = [
  { name: 'Security & Role-Based Access Control', file: 'test_security_access_control.js' },
  { name: 'Location-Based GIS Surveillance & Nearby Alerts', file: 'test_gis_nearby_alerts.js' },
  { name: 'Disease Severity, Status Lifecycle & Demo Data', file: 'test_disease_severity_and_demo.js' },
  { name: 'End-to-End System Flows & Module CRUD', file: 'test_e2e_flows.js' },
];

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const suite of suites) {
  console.log(`\n▶️  RUNNING: ${suite.name} (${suite.file})...`);
  try {
    const output = execSync(`node ${suite.file}`, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(output);
    results.push({ suite: suite.name, status: 'PASSED' });
    totalPassed++;
  } catch (error) {
    console.error(`❌ Suite failed: ${suite.name}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    results.push({ suite: suite.name, status: 'FAILED' });
    totalFailed++;
  }
}

console.log('\n================================================================');
console.log('🏁 MASTER QA SUMMARY RESULTS');
console.log('================================================================');
results.forEach(r => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(`  ${icon} ${r.suite}: ${r.status}`);
});
console.log('----------------------------------------------------------------');
console.log(`Suites Passed: ${totalPassed}/${suites.length}`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
