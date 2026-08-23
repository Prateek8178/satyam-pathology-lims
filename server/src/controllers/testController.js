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
    const countMap = Object.fromEntries(paramCounts.map(p => [p._id.toString(), p.count]));
    const data = tests.map(t => ({
      ...t.toObject(),
      parameterCount: countMap[t._id.toString()] || 0
    }));
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
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
    await createAuditLog({
      user: req.user._id,
      action: 'CREATE',
      entity: 'Test',
      entityId: test._id,
      newValue: test.toObject(),
      ip: req.ip
    });
    res.status(201).json({ success: true, data: test });
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
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    await createAuditLog({
      user: req.user._id,
      action: 'UPDATE',
      entity: 'Test',
      entityId: test._id,
      newValue: test.toObject(),
      ip: req.ip
    });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addParameter = async (req, res) => {
  try {
    const parameter = await TestParameter.create({ ...req.body, test: req.params.id });
    res.status(201).json({ success: true, data: parameter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateParameter = async (req, res) => {
  try {
    const parameter = await TestParameter.findByIdAndUpdate(req.params.paramId, req.body, { new: true, runValidators: true });
    if (!parameter) return res.status(404).json({ success: false, message: 'Parameter not found' });
    res.json({ success: true, data: parameter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteParameter = async (req, res) => {
  try {
    const result = await TestParameter.findByIdAndDelete(req.params.paramId);
    if (!result) return res.status(404).json({ success: false, message: 'Parameter not found' });
    res.json({ success: true, message: 'Parameter deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getParameters = async (req, res) => {
  try {
    const params = await TestParameter.find({ test: req.params.id }).sort({ displayOrder: 1, paramName: 1 });
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
    if (testId && testId !== 'custom' && testId !== 'undefined' && testId !== 'null' && mongoose.Types.ObjectId.isValid(testId)) {
      test = await Test.findById(testId);
    }
    if (!test && testName) {
      const trimmedName = testName.trim();
      // Try to find existing test by name first (case-insensitive)
      test = await Test.findOne({ testName: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      if (!test) {
        // Generate a unique code — retry with timestamp suffix on collision
        const baseCode = trimmedName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || `TST${Date.now().toString().slice(-4)}`;
        let code = baseCode;
        let attempts = 0;
        while (attempts < 5) {
          const existing = await Test.findOne({ testCode: code });
          if (!existing) break;
          // Append random suffix to make it unique
          code = `${baseCode.slice(0, 5)}${Date.now().toString().slice(-3)}`;
          attempts++;
        }
        test = await Test.create({
          testName: trimmedName,
          testCode: code,
          category: category || 'General',
          price: 200,
          comments: comments || '',
          isActive: true
        });
      }
    }

    if (!test) {
      return res.status(400).json({ success: false, message: 'Invalid test identifier or name' });
    }

    // Delete previous parameters
    await TestParameter.deleteMany({ test: test._id });

    // Insert new rows in template
    const newParams = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.param && !r.paramName) continue;
      const pName = (r.param || r.paramName).trim();
      if (!pName) continue;
      const pCode = (r.paramCode || pName).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || `P${i + 1}`;

      const param = await TestParameter.create({
        test: test._id,
        paramName: pName,
        paramCode: pCode,
        unit: (r.unit || '').trim(),
        textRange: (r.refRange || r.textRange || '').trim(),
        isSubheader: r.isSubheader || false,
        resultType: r.isSubheader ? 'subheader' : r.resultType || 'numeric',
        formula: r.formula || '',
        dependencies: r.dependencies || [],
        isCalculated: !!(r.formula) || r.isCalculated || false,
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
    console.error('syncTemplate error:', error);
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
