const Sample = require('../models/Sample');
const Order = require('../models/Order');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.$or = [
      { sampleId: { $regex: req.query.q, $options: 'i' } }
    ];
    const [data, total] = await Promise.all([
      Sample.find(filter).populate('patient', 'fullName patientId mobile').populate('test', 'testName sampleType').populate('order', 'orderId').populate('collectedBy', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sample.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPending = async (req, res) => {
  try {
    const data = await Sample.find({ status: 'PENDING' }).populate('patient', 'fullName patientId').populate('test', 'testName sampleType').populate('order', 'orderId');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByOrder = async (req, res) => {
  try {
    const data = await Sample.find({ order: req.params.orderId }).populate('test', 'testName sampleType').populate('collectedBy', 'fullName');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const sample = await Sample.findById(req.params.id).populate('patient').populate('test').populate('order').populate('collectedBy', 'fullName');
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });
    res.json({ success: true, data: sample });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const collect = async (req, res) => {
  try {
    const sample = await Sample.findById(req.params.id);
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });
    if (sample.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Sample already processed' });
    }
    sample.status = 'COLLECTED';
    sample.collectedBy = req.user._id;
    sample.collectionDate = new Date();
    sample.barcode = sample.sampleId;
    if (req.body.notes) sample.notes = req.body.notes;
    await sample.save();

    // Update order status if all samples collected
    const pendingSamples = await Sample.countDocuments({ order: sample.order, status: 'PENDING' });
    if (pendingSamples === 0) {
      await Order.findByIdAndUpdate(sample.order, { status: 'SAMPLE_COLLECTED' });
    }

    await createAuditLog({
      user: req.user, action: 'SAMPLE_COLLECTED', entity: 'Sample',
      entityId: sample._id, newValue: { sampleId: sample.sampleId }, ip: req.ip
    });

    res.json({ success: true, data: sample, message: `Sample ${sample.sampleId} collected` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reject = async (req, res) => {
  try {
    const { reason } = req.body;
    const sample = await Sample.findByIdAndUpdate(req.params.id, { status: 'REJECTED', rejectionReason: reason }, { new: true });
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });
    await createAuditLog({ user: req.user, action: 'SAMPLE_REJECTED', entity: 'Sample', entityId: req.params.id, newValue: { reason }, ip: req.ip });
    res.json({ success: true, message: 'Sample rejected', data: sample });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getPending, getByOrder, getById, collect, reject };
