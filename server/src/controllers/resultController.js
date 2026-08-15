const Result = require('../models/Result');
const Order = require('../models/Order');
const TestParameter = require('../models/TestParameter');
const { calculateFlag, formatReferenceRange } = require('../utils/resultFlagCalculator');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.patient) filter.patient = req.query.patient;
    const [data, total] = await Promise.all([
      Result.find(filter).populate('patient', 'fullName patientId').populate('test', 'testName').populate('sample', 'sampleId').populate('verifiedBy', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Result.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByOrder = async (req, res) => {
  try {
    const data = await Result.find({ order: req.params.orderId }).populate('test', 'testName').populate('parameterResults.parameter').populate('verifiedBy', 'fullName');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByPatient = async (req, res) => {
  try {
    const data = await Result.find({ patient: req.params.patientId }).populate('test', 'testName').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('patient', 'fullName patientId age gender mobile')
      .populate('test', 'testName sampleType category')
      .populate('sample', 'sampleId sampleType collectionDate')
      .populate('order', 'orderId priority')
      .populate('parameterResults.parameter')
      .populate('enteredBy', 'fullName')
      .populate('verifiedBy', 'fullName')
      .populate('lisResult');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const enterManual = async (req, res) => {
  try {
    const { patient, order, sample, test, parameterResults, technicianRemarks } = req.body;
    // Calculate flags
    const parameters = await TestParameter.find({ test, isActive: true });
    const patientDoc = await require('../models/Patient').findById(patient);
    const age = patientDoc?.age || 30;
    const gender = patientDoc?.gender || 'Male';

    const processedParams = parameterResults.map(pr => {
      const param = parameters.find(p => p._id.toString() === pr.parameter);
      const numericValue = parseFloat(pr.value);
      const flag = param ? calculateFlag(param, numericValue, gender, age) : 'NORMAL';
      const referenceRange = param ? formatReferenceRange(param, gender, age) : pr.referenceRange || 'N/A';
      return { ...pr, numericValue: isNaN(numericValue) ? undefined : numericValue, flag, referenceRange };
    });

    const result = await Result.create({
      patient, order, sample, test, parameterResults: processedParams,
      source: 'MANUAL', status: 'PENDING',
      enteredBy: req.user._id, enteredAt: new Date(),
      technicianRemarks
    });
    res.status(201).json({ success: true, data: result, message: 'Result entered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    if (!['PENDING', 'REVIEWED'].includes(result.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit verified result' });
    }
    Object.assign(result, req.body);
    await result.save();
    res.json({ success: true, data: result, message: 'Result updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendForVerification = async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, { status: 'VERIFICATION_PENDING' }, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    await Order.findByIdAndUpdate(result.order, { status: 'VERIFICATION_PENDING' });
    res.json({ success: true, data: result, message: 'Sent for verification' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verify = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    if (result.status !== 'VERIFICATION_PENDING') {
      return res.status(400).json({ success: false, message: 'Result is not pending verification' });
    }
    result.status = 'VERIFIED';
    result.verifiedBy = req.user._id;
    result.verifiedAt = new Date();
    if (req.body.pathologistRemarks) result.pathologistRemarks = req.body.pathologistRemarks;
    await result.save();
    await Order.findByIdAndUpdate(result.order, { status: 'VERIFIED' });
    await createAuditLog({
      user: req.user, action: 'RESULT_VERIFIED', entity: 'Result',
      entityId: result._id, newValue: { status: 'VERIFIED' }, ip: req.ip
    });
    res.json({ success: true, data: result, message: 'Result verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectResult = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await Result.findByIdAndUpdate(req.params.id, { status: 'REJECTED', pathologistRemarks: reason }, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    await createAuditLog({ user: req.user, action: 'RESULT_REJECTED', entity: 'Result', entityId: req.params.id, ip: req.ip });
    res.json({ success: true, data: result, message: 'Result sent back for revision' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getByOrder, getByPatient, getById, enterManual, update, sendForVerification, verify, reject: rejectResult };
