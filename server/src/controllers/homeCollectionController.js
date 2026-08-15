const HomeCollection = require('../models/HomeCollection');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const [data, total] = await Promise.all([
      HomeCollection.find(filter).populate('patient', 'fullName patientId mobile').populate('assignedTechnician', 'fullName').populate('tests', 'testName').sort({ date: -1 }).skip(skip).limit(limit),
      HomeCollection.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const hc = await HomeCollection.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: hc, message: 'Home collection request created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const hc = await HomeCollection.findById(req.params.id).populate('patient').populate('assignedTechnician').populate('tests');
    if (!hc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: hc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const hc = await HomeCollection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: hc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, getById, update };
