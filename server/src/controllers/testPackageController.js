const TestPackage = require('../models/TestPackage');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const [data, total] = await Promise.all([
      TestPackage.find(filter).populate('tests', 'testName testCode price').sort({ packageName: 1 }).skip(skip).limit(limit),
      TestPackage.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const pkg = await TestPackage.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: pkg, message: 'Package created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const pkg = await TestPackage.findById(req.params.id).populate('tests');
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const pkg = await TestPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, data: pkg, message: 'Package updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, getById, update };
