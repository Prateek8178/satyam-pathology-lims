require('dotenv').config();
const mongoose = require('mongoose');

async function deepAudit() {
  await mongoose.connect(process.env.MONGO_URI);
  const Test = require('../models/Test');
  const TestParameter = require('../models/TestParameter');

  const tests = await Test.find({ isActive: true }).sort({ testName: 1 });
  
  console.log('=== DUPLICATE PARAMETER AUDIT ===');
  let totalDuplicates = 0;
  for (const t of tests) {
    const params = await TestParameter.find({ test: t._id }).sort({ displayOrder: 1 });
    const seen = {};
    const dups = [];
    for (const p of params) {
      const key = p.paramName.toLowerCase().trim();
      if (seen[key]) {
        dups.push({ name: p.paramName, id: p._id, isActive: p.isActive });
      } else {
        seen[key] = p._id;
      }
    }
    if (dups.length > 0) {
      console.log(`\nDUPLICATES in "${t.testName}":`);
      dups.forEach(d => console.log(`  - "${d.name}" (id: ${d.id}, active: ${d.isActive})`));
      totalDuplicates += dups.length;
    }
  }
  console.log(`\nTotal duplicate params found: ${totalDuplicates}`);

  console.log('\n=== MALARIA TEST AUDIT ===');
  const malariaTests = await Test.find({ testName: { $regex: /malaria/i } });
  for (const mt of malariaTests) {
    const params = await TestParameter.find({ test: mt._id }).sort({ displayOrder: 1 });
    console.log(`Test: ${mt.testName} (${mt._id})`);
    params.forEach(p => console.log(`  - ${p.paramName} | type: ${p.resultType} | range: ${p.textRange}`));
  }

  console.log('\n=== TESTS WITH MANY PARAMS (potential dups) ===');
  const paramCounts = await TestParameter.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$test', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  for (const pc of paramCounts) {
    const t = await Test.findById(pc._id);
    console.log(`${t?.testName}: ${pc.count} params`);
  }
  
  await mongoose.disconnect();
}
deepAudit().catch(console.error);
