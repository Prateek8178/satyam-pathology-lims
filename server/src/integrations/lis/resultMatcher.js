const Sample = require('../../models/Sample');
const Order = require('../../models/Order');
const LISResult = require('../../models/LISResult');
const Result = require('../../models/Result');
const TestParameter = require('../../models/TestParameter');
const { calculateFlag, formatReferenceRange } = require('../../utils/resultFlagCalculator');
const { RESULT_FLAG } = require('../../config/constants');
const matchAndProcessResult = async (lisResult) => {
  try {
    const sample = await Sample.findOne({ sampleId: lisResult.rawSampleId }).populate({ path: 'order', populate: { path: 'patient' } }).populate('test');
    if (!sample) { lisResult.matchingStatus = 'UNMATCHED'; lisResult.status = 'UNMATCHED'; await lisResult.save(); return { matched: false, lisResult }; }
    lisResult.sample = sample._id; lisResult.order = sample.order._id; lisResult.patient = sample.order.patient._id; lisResult.test = sample.test?._id; lisResult.matchingStatus = 'MATCHED'; lisResult.status = 'MATCHED'; await lisResult.save();
    const parameters = await TestParameter.find({ test: sample.test?._id, isActive: true }).sort({ displayOrder: 1 });
    const patient = sample.order.patient; const age = patient.age || 30; const gender = patient.gender || 'Male';
    const parameterResults = lisResult.parsedResults.map(pr => {
      const param = parameters.find(p => p.paramCode === pr.paramCode || p.paramName === pr.paramName);
      const numericValue = parseFloat(pr.value);
      const flag = param ? calculateFlag(param, numericValue, gender, age) : RESULT_FLAG.NORMAL;
      const referenceRange = param ? formatReferenceRange(param, gender, age) : pr.referenceRange || 'N/A';
      return { parameter: param?._id, value: pr.value, numericValue: isNaN(numericValue) ? undefined : numericValue, unit: pr.unit || param?.unit, referenceRange, flag, remarks: '' };
    });
    const result = await Result.create({ patient: lisResult.patient, order: lisResult.order, sample: lisResult.sample, test: lisResult.test, lisResult: lisResult._id, parameterResults, source: 'LIS', status: 'PENDING', enteredAt: new Date() });
    sample.status = 'COMPLETED'; await sample.save();
    return { matched: true, lisResult, result };
  } catch (err) { console.error(err); throw err; }
};
module.exports = { matchAndProcessResult };
