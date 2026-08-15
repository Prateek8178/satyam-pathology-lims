const Notification = require('../models/Notification');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Notification.find().populate('patient', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments()
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll };
