const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    const [data, total] = await Promise.all([
      InventoryItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      InventoryItem.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json({ success: true, data: item, message: 'Item added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const stockIn = async (req, res) => {
  try {
    const { quantity, reason, notes } = req.body;
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    item.quantity += parseInt(quantity);
    await item.save();
    await InventoryTransaction.create({ item: item._id, type: 'IN', quantity, reason, notes, performedBy: req.user._id, balanceAfter: item.quantity });
    res.json({ success: true, data: item, message: 'Stock added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const stockOut = async (req, res) => {
  try {
    const { quantity, reason, notes } = req.body;
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.quantity < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
    item.quantity -= parseInt(quantity);
    await item.save();
    await InventoryTransaction.create({ item: item._id, type: 'OUT', quantity, reason, notes, performedBy: req.user._id, balanceAfter: item.quantity });
    res.json({ success: true, data: item, message: 'Stock removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const data = await InventoryTransaction.find({ item: req.params.id }).populate('performedBy', 'fullName').sort({ performedAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, getById, update, stockIn, stockOut, getTransactions };
