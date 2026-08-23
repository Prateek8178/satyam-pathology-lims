/**
 * Full HTTP API Test — Save Template
 * Tests the actual HTTP endpoint with real authentication
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function testHTTPFlow() {
  await mongoose.connect(process.env.MONGO_URI);
  const Test = require('../models/Test');
  const TestParameter = require('../models/TestParameter');
  const User = require('../models/User');
  const jwt = require('jsonwebtoken');

  // Get a user to generate token
  const user = await User.findOne();
  if (!user) { console.log('No users found!'); process.exit(1); }
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Got token for user:', user.username, 'role:', user.role);

  const http = require('http');

  const testId = '6a7f3dfc8eac720783e095c8'; // LFT test ID from audit
  const body = JSON.stringify({
    testName: 'Liver Function Test (LFT)',
    comments: '',
    rows: [
      { param: 'Total Bilirubin', unit: 'mg/dL', refRange: '0.2 - 1.2', result: '', isSubheader: false },
      { param: 'Direct Bilirubin', unit: 'mg/dL', refRange: '0.0 - 0.4', result: '', isSubheader: false },
      { param: 'Indirect Bilirubin', unit: 'mg/dL', refRange: '0.1 - 1.0', result: '', isSubheader: false },
      { param: 'SGOT (AST)', unit: 'U/L', refRange: '0 - 40', result: '', isSubheader: false },
      { param: 'SGPT (ALT)', unit: 'U/L', refRange: '0 - 40', result: '', isSubheader: false },
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/tests/${testId}/template`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  console.log(`\nCalling PUT http://localhost:5000/api/tests/${testId}/template`);

  const responseBody = await new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  console.log('\nHTTP Response:', responseBody.status);
  console.log('Response body:', JSON.stringify(responseBody.body, null, 2));

  if (responseBody.body.success) {
    console.log('\n✅ Save Template API WORKS!');
    const count = responseBody.body.data?.parameters?.length;
    console.log(`✅ ${count} parameters saved for LFT`);

    // Now verify by fetching parameters
    const params = await TestParameter.find({ test: testId });
    console.log(`\nVerification: DB has ${params.length} params for LFT`);
    params.forEach(p => console.log(`  - ${p.paramName} | ${p.unit} | ${p.textRange}`));
  } else {
    console.log('\n❌ Save Template FAILED:', responseBody.body.message);
  }

  await mongoose.disconnect();
}

testHTTPFlow().catch(err => { console.error('❌ HTTP Test Error:', err.message); process.exit(1); });
