const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.q) filter.$or = [
      { fullName: { $regex: req.query.q, $options: 'i' } },
      { username: { $regex: req.query.q, $options: 'i' } },
      { email: { $regex: req.query.q, $options: 'i' } }
    ];
    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const user = await User.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ user: req.user, action: 'CREATE_USER', entity: 'User', entityId: user._id, ip: req.ip });
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({ success: true, data: userObj, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('createdBy', 'fullName');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { password, ...updateData } = req.body; // Don't update password here
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await createAuditLog({ user: req.user, action: 'UPDATE_USER', entity: 'User', entityId: req.params.id, ip: req.ip });
    res.json({ success: true, data: user, message: 'User updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deactivate = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await createAuditLog({ user: req.user, action: 'DEACTIVATE_USER', entity: 'User', entityId: req.params.id, ip: req.ip });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    await createAuditLog({ user: req.user, action: 'RESET_USER_PASSWORD', entity: 'User', entityId: req.params.id, ip: req.ip });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, getById, update, deactivate, resetPassword };
