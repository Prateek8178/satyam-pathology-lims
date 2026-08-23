/**
 * Fix Duplicate Parameters Script
 * Removes duplicate params from LFT and Vitamin B12
 * Also adds the simple Malaria (Rapid Card) test
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function fixAll() {
  await mongoose.connect(process.env.MONGO_URI);
  const Test = require('../models/Test');
  const TestParameter = require('../models/TestParameter');

  // ── 1. Fix LFT Duplicates ─────────────────────────────────────
  console.log('\n=== Fixing LFT Duplicates ===');
  const lft = await Test.findOne({ testName: /liver function test/i });
  if (lft) {
    const params = await TestParameter.find({ test: lft._id }).sort({ displayOrder: 1 });
    const seen = {};
    for (const p of params) {
      const key = p.paramName.toLowerCase().trim();
      if (seen[key]) {
        await TestParameter.deleteOne({ _id: p._id });
        console.log(`  Deleted duplicate: "${p.paramName}" (${p._id})`);
      } else {
        seen[key] = true;
      }
    }
    console.log('  LFT duplicates fixed.');
  }

  // ── 2. Fix Vitamin B12 Duplicates ────────────────────────────
  console.log('\n=== Fixing Vitamin B12 Duplicates ===');
  const vb12 = await Test.findOne({ testName: /vitamin b12/i });
  if (vb12) {
    const params = await TestParameter.find({ test: vb12._id }).sort({ displayOrder: 1 });
    const seen = {};
    for (const p of params) {
      const key = p.paramName.toLowerCase().trim();
      if (seen[key]) {
        await TestParameter.deleteOne({ _id: p._id });
        console.log(`  Deleted duplicate: "${p.paramName}" (${p._id})`);
      } else {
        seen[key] = true;
      }
    }
    console.log('  Vitamin B12 duplicates fixed.');
  }

  // ── 3. Add/Fix Malaria Rapid Test ────────────────────────────
  console.log('\n=== Adding/Fixing Malaria Rapid Test ===');
  let malariaRapid = await Test.findOne({ testName: /^malaria rapid/i });
  if (!malariaRapid) {
    malariaRapid = await Test.create({
      testName: 'Malaria (Rapid)',
      testCode: 'MALARARD',
      category: 'Haematology',
      price: 150,
      sampleType: 'Blood',
      isActive: true,
    });
    console.log('  Created Malaria (Rapid) test:', malariaRapid._id);
  }
  // Remove old params
  await TestParameter.deleteMany({ test: malariaRapid._id });
  // Add fresh params
  await TestParameter.create([
    {
      test: malariaRapid._id,
      paramName: 'Malaria Pf (P. falciparum)',
      paramCode: 'MALARIAPF',
      unit: '',
      textRange: 'Negative',
      resultType: 'text',
      options: ['Positive', 'Negative'],
      isSubheader: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      test: malariaRapid._id,
      paramName: 'Malaria Pv (P. vivax)',
      paramCode: 'MALARIAPV',
      unit: '',
      textRange: 'Negative',
      resultType: 'text',
      options: ['Positive', 'Negative'],
      isSubheader: false,
      displayOrder: 2,
      isActive: true,
    },
  ]);
  console.log('  Malaria (Rapid) params added: Pf + Pv (Positive/Negative)');

  // ── 4. Fix Malaria Antigen params (add missing textRange) ─────
  console.log('\n=== Fixing Malaria Antigen Rapid params ===');
  const malariaAntigen = await Test.findOne({ testName: /malaria antigen/i });
  if (malariaAntigen) {
    await TestParameter.updateMany(
      { test: malariaAntigen._id, textRange: '' },
      { $set: { textRange: 'Negative', resultType: 'text' } }
    );
    console.log('  Malaria Antigen params updated with Negative reference range');
  }

  // ── 5. Fix all duplicate params in ALL tests ─────────────────
  console.log('\n=== Fixing Duplicates in ALL Tests ===');
  const allTests = await Test.find({ isActive: true });
  let totalFixed = 0;
  for (const t of allTests) {
    const params = await TestParameter.find({ test: t._id }).sort({ displayOrder: 1 });
    const seen = {};
    for (const p of params) {
      const key = p.paramName.toLowerCase().trim();
      if (seen[key]) {
        await TestParameter.deleteOne({ _id: p._id });
        totalFixed++;
      } else {
        seen[key] = true;
      }
    }
  }
  console.log(`  Total duplicates removed across all tests: ${totalFixed}`);

  console.log('\n✅ All fixes applied successfully!');
  await mongoose.disconnect();
}

fixAll().catch(err => { console.error('Error:', err.message); process.exit(1); });
