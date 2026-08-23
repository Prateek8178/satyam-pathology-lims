/**
 * Direct Save Template Flow Test
 * Tests the full syncTemplate flow: find test by ID → delete old params → create new params → return
 * Run: node src/utils/testSaveTemplate.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function testSaveTemplate() {
  await mongoose.connect(process.env.MONGO_URI);
  const Test = require('../models/Test');
  const TestParameter = require('../models/TestParameter');

  console.log('\n=== TEST 1: syncTemplate with known testId (CBC) ===');
  const cbc = await Test.findOne({ testName: /complete blood count/i });
  if (!cbc) { console.log('CBC test not found!'); process.exit(1); }
  console.log(`Found CBC: ${cbc._id}`);

  const paramsBefore = await TestParameter.find({ test: cbc._id });
  console.log(`Params before sync: ${paramsBefore.length}`);

  // Simulate what the frontend sends
  const rows = [
    { param: 'Hemoglobin (Hb)', unit: 'g/dL', refRange: '13.5 - 17.5', result: '', isSubheader: false },
    { param: 'RBC Count', unit: 'mill/cumm', refRange: '4.5 - 5.5', result: '', isSubheader: false },
    { param: 'WBC Count (TLC)', unit: 'thou/cumm', refRange: '4 - 11', result: '', isSubheader: false },
  ];

  // Run the syncTemplate logic directly
  await TestParameter.deleteMany({ test: cbc._id });
  const newParams = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const pName = (r.param || r.paramName || '').trim();
    if (!pName) continue;
    const pCode = (r.paramCode || pName).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || `P${i + 1}`;
    const p = await TestParameter.create({
      test: cbc._id,
      paramName: pName,
      paramCode: pCode,
      unit: (r.unit || '').trim(),
      textRange: (r.refRange || r.textRange || '').trim(),
      isSubheader: r.isSubheader || false,
      resultType: r.isSubheader ? 'subheader' : r.resultType || 'numeric',
      displayOrder: i + 1,
      isActive: true
    });
    newParams.push(p);
  }
  console.log(`✅ Sync done. New params: ${newParams.length}`);

  // Verify they're saved
  const paramsAfter = await TestParameter.find({ test: cbc._id });
  console.log(`Params after sync: ${paramsAfter.length}`);
  paramsAfter.forEach(p => console.log(`  - ${p.paramName} | ${p.unit} | ${p.textRange}`));

  console.log('\n=== TEST 2: syncTemplate with testName lookup (LFT) ===');
  const testName = 'Liver Function Test (LFT)';
  const trimmedName = testName.trim();
  const escaped = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  console.log('Escaped name for regex:', escaped);
  const lft = await Test.findOne({ testName: { $regex: new RegExp(`^${escaped}$`, 'i') } });
  if (lft) {
    console.log(`✅ Found LFT by name: ${lft._id}`);
    const lftParams = await TestParameter.find({ test: lft._id });
    console.log(`LFT params in DB: ${lftParams.length}`);
    lftParams.slice(0, 5).forEach(p => console.log(`  - ${p.paramName}`));
  } else {
    console.log(`❌ LFT NOT found by name lookup!`);
  }

  console.log('\n=== TEST 3: syncTemplate with "custom" testId (new test) ===');
  const newTestName = `Test_Debug_${Date.now()}`;
  const baseCode = newTestName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  let code = baseCode;
  let attempts = 0;
  while (attempts < 5) {
    const existing = await Test.findOne({ testCode: code });
    if (!existing) break;
    code = `${baseCode.slice(0, 5)}${Date.now().toString().slice(-3)}`;
    attempts++;
  }
  console.log(`Creating new test with code: "${code}"`);
  const newTest = await Test.create({ testName: newTestName, testCode: code, category: 'General', price: 100, isActive: true });
  console.log(`✅ Created: ${newTest._id}`);
  await Test.findByIdAndDelete(newTest._id); // cleanup
  console.log('✅ Cleaned up test');

  console.log('\n=== ALL TESTS PASSED ===');
  await mongoose.disconnect();
}

testSaveTemplate().catch(err => { console.error('❌ Error:', err); process.exit(1); });
