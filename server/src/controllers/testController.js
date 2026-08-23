const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.q) filter.$or = [
      { testName: { $regex: req.query.q, $options: 'i' } },
      { testCode: { $regex: req.query.q, $options: 'i' } }
    ];
    const [tests, total] = await Promise.all([
      Test.find(filter).sort({ testName: 1 }).skip(skip).limit(limit),
      Test.countDocuments(filter)
    ]);
    // Attach parameter counts
    const paramCounts = await TestParameter.aggregate([
      { $match: { test: { $in: tests.map(t => t._id) }, isActive: true } },
      { $group: { _id: '$test', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    paramCounts.forEach(p => { countMap[p._id.toString()] = p.count; });
    const data = tests.map(t => ({ ...t.toObject(), parameterCount: countMap[t._id.toString()] || 0 }));
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Test.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const test = await Test.create(req.body);
    res.status(201).json({ success: true, data: test, message: 'Test created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    const parameters = await TestParameter.find({ test: test._id, isActive: true }).sort({ displayOrder: 1 });
    res.json({ success: true, data: { ...test.toObject(), parameters } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: test, message: 'Test updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addParameter = async (req, res) => {
  try {
    const param = await TestParameter.create({ ...req.body, test: req.params.id });
    res.status(201).json({ success: true, data: param, message: 'Parameter added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateParameter = async (req, res) => {
  try {
    const param = await TestParameter.findByIdAndUpdate(req.params.paramId, req.body, { new: true });
    if (!param) return res.status(404).json({ success: false, message: 'Parameter not found' });
    res.json({ success: true, data: param });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteParameter = async (req, res) => {
  try {
    await TestParameter.findByIdAndUpdate(req.params.paramId, { isActive: false });
    res.json({ success: true, message: 'Parameter removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getParameters = async (req, res) => {
  try {
    const params = await TestParameter.find({ test: req.params.id, isActive: true }).sort({ displayOrder: 1, paramName: 1 });
    res.json({ success: true, data: params });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Sync whole template (save added/removed rows, updated ranges, display order to test master)
const syncTemplate = async (req, res) => {
  try {
    const { testId } = req.params;
    const { rows = [], testName, category, comments } = req.body;

    let test;
    if (testId && testId !== 'custom' && mongoose.Types.ObjectId.isValid(testId)) {
      test = await Test.findById(testId);
    }
    if (!test && testName) {
      const code = testName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || `TST${Date.now().toString().slice(-4)}`;
      test = await Test.findOne({ testCode: code });
      if (!test) {
        test = await Test.create({
          testName,
          testCode: code,
          category: category || 'General',
          price: 200,
          comments: comments || '',
          isActive: true
        });
      }
    }

    if (!test) {
      return res.status(400).json({ success: false, message: 'Invalid test identifier' });
    }

    // Deactivate previous parameters
    await TestParameter.updateMany({ test: test._id }, { isActive: false });

    // Insert or activate new rows in template
    const newParams = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.param && !r.paramName) continue;
      const pName = r.param || r.paramName;
      const pCode = (r.paramCode || pName).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || `P${i + 1}`;

      const param = await TestParameter.create({
        test: test._id,
        paramName: pName,
        paramCode: pCode,
        unit: r.unit || '',
        textRange: r.refRange || r.textRange || '',
        isSubheader: r.isSubheader || false,
        resultType: r.isSubheader ? 'subheader' : r.resultType || 'numeric',
        formula: r.formula || '',
        dependencies: r.dependencies || [],
        isCalculated: !!r.formula || r.isCalculated || false,
        displayOrder: i + 1,
        isActive: true
      });
      newParams.push(param);
    }

    res.json({
      success: true,
      message: `Template for "${test.testName}" updated with ${newParams.length} parameters`,
      data: { test, parameters: newParams }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  getCategories,
  getParameters,
  create,
  getById,
  update,
  addParameter,
  updateParameter,
  deleteParameter,
  syncTemplate
};
