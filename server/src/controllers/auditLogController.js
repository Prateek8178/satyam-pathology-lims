const AuditLog = require('../models/AuditLog');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.user) filter.user = req.query.user;
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
    }
    const [data, total] = await Promise.all([
      AuditLog.find(filter).populate('user', 'fullName username').sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByEntity = async (req, res) => {
  try {
    const data = await AuditLog.find({ entity: req.params.entity, entityId: req.params.entityId }).populate('user', 'fullName username').sort({ timestamp: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getByEntity };
