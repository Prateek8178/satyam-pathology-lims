/**
 * Restore CBC Full Parameters (wiped by test script)
 */
require('dotenv').config();
const mongoose = require('mongoose');

const CBC_PARAMS = [
  { paramName: 'Hemoglobin (Hb)', paramCode: 'HB', unit: 'g/dL', textRange: '13.5 - 17.5 (M), 11.5 - 15.5 (F)', maleRange: { low: 13.5, high: 17.5 }, femaleRange: { low: 11.5, high: 15.5 }, childRange: { low: 11.5, high: 14.5 }, resultType: 'numeric', displayOrder: 1 },
  { paramName: 'RBC Count', paramCode: 'RBC', unit: 'mill/cumm', textRange: '4.5 - 5.5 (M), 3.8 - 4.8 (F)', maleRange: { low: 4.5, high: 5.5 }, femaleRange: { low: 3.8, high: 4.8 }, resultType: 'numeric', displayOrder: 2 },
  { paramName: 'PCV / Hematocrit', paramCode: 'PCV', unit: '%', textRange: '40 - 50 (M), 36 - 46 (F)', maleRange: { low: 40, high: 50 }, femaleRange: { low: 36, high: 46 }, resultType: 'numeric', displayOrder: 3 },
  { paramName: 'MCV', paramCode: 'MCV', unit: 'fL', textRange: '80 - 100', maleRange: { low: 80, high: 100 }, femaleRange: { low: 80, high: 100 }, formula: '(PCV * 10) / RBC', isCalculated: true, resultType: 'calculated', displayOrder: 4 },
  { paramName: 'MCH', paramCode: 'MCH', unit: 'pg', textRange: '27 - 33', maleRange: { low: 27, high: 33 }, femaleRange: { low: 27, high: 33 }, formula: '(HB * 10) / RBC', isCalculated: true, resultType: 'calculated', displayOrder: 5 },
  { paramName: 'MCHC', paramCode: 'MCHC', unit: 'g/dL', textRange: '32 - 36', maleRange: { low: 32, high: 36 }, femaleRange: { low: 32, high: 36 }, formula: '(HB * 100) / PCV', isCalculated: true, resultType: 'calculated', displayOrder: 6 },
  { paramName: 'WBC Count (TLC)', paramCode: 'WBC', unit: 'thou/cumm', textRange: '4 - 11', maleRange: { low: 4, high: 11 }, femaleRange: { low: 4, high: 11 }, resultType: 'numeric', displayOrder: 7 },
  { paramName: 'DIFFERENTIAL WBC COUNT', paramCode: 'DIFFWBC', isSubheader: true, resultType: 'subheader', displayOrder: 8 },
  { paramName: 'Neutrophils', paramCode: 'NEUT', unit: '%', textRange: '40 - 75', maleRange: { low: 40, high: 75 }, femaleRange: { low: 40, high: 75 }, resultType: 'numeric', displayOrder: 9 },
  { paramName: 'Lymphocytes', paramCode: 'LYMPH', unit: '%', textRange: '20 - 45', maleRange: { low: 20, high: 45 }, femaleRange: { low: 20, high: 45 }, resultType: 'numeric', displayOrder: 10 },
  { paramName: 'Monocytes', paramCode: 'MONO', unit: '%', textRange: '2 - 10', maleRange: { low: 2, high: 10 }, femaleRange: { low: 2, high: 10 }, resultType: 'numeric', displayOrder: 11 },
  { paramName: 'Eosinophils', paramCode: 'EOS', unit: '%', textRange: '1 - 6', maleRange: { low: 1, high: 6 }, femaleRange: { low: 1, high: 6 }, resultType: 'numeric', displayOrder: 12 },
  { paramName: 'Basophils', paramCode: 'BASO', unit: '%', textRange: '0 - 1', maleRange: { low: 0, high: 1 }, femaleRange: { low: 0, high: 1 }, resultType: 'numeric', displayOrder: 13 },
  { paramName: 'PLATELET COUNT', paramCode: 'PLATELET', unit: 'Lakhs/cumm', textRange: '1.5 - 4.0', maleRange: { low: 1.5, high: 4.0 }, femaleRange: { low: 1.5, high: 4.0 }, resultType: 'numeric', displayOrder: 14 },
  { paramName: 'PLATELET INDICES', paramCode: 'PLATIDX', isSubheader: true, resultType: 'subheader', displayOrder: 15 },
  { paramName: 'MPV (Mean Platelet Vol)', paramCode: 'MPV', unit: 'fL', textRange: '7.5 - 12.5', maleRange: { low: 7.5, high: 12.5 }, femaleRange: { low: 7.5, high: 12.5 }, resultType: 'numeric', displayOrder: 16 },
  { paramName: 'PDW (Platelet Dist Width)', paramCode: 'PDW', unit: '%', textRange: '10 - 17.9', maleRange: { low: 10, high: 17.9 }, femaleRange: { low: 10, high: 17.9 }, resultType: 'numeric', displayOrder: 17 },
  { paramName: 'PCT (Platelet Crit)', paramCode: 'PCT', unit: '%', textRange: '0.15 - 0.40', maleRange: { low: 0.15, high: 0.40 }, femaleRange: { low: 0.15, high: 0.40 }, resultType: 'numeric', displayOrder: 18 },
  { paramName: 'RDW-CV', paramCode: 'RDWCV', unit: '%', textRange: '11.5 - 14.5', maleRange: { low: 11.5, high: 14.5 }, femaleRange: { low: 11.5, high: 14.5 }, resultType: 'numeric', displayOrder: 19 },
];

async function restoreCBC() {
  await mongoose.connect(process.env.MONGO_URI);
  const Test = require('../models/Test');
  const TestParameter = require('../models/TestParameter');

  const cbc = await Test.findOne({ testName: /complete blood count/i });
  if (!cbc) { console.error('CBC not found!'); process.exit(1); }
  console.log(`Restoring CBC: ${cbc._id}`);

  await TestParameter.deleteMany({ test: cbc._id });
  for (const p of CBC_PARAMS) {
    await TestParameter.create({ ...p, test: cbc._id, isActive: true, dependencies: p.dependencies || [] });
  }

  const count = await TestParameter.countDocuments({ test: cbc._id });
  console.log(`✅ CBC restored with ${count} parameters`);
  await mongoose.disconnect();
}

restoreCBC().catch(console.error);
