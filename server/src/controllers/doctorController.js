const Doctor = require('../models/Doctor');
const Order = require('../models/Order');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const q = req.query.q;
    const filter = {};
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { mobile: { $regex: q, $options: 'i' } },
      { specialization: { $regex: q, $options: 'i' } }
    ];
    const [data, total] = await Promise.all([
      Doctor.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Doctor.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const doctor = await Doctor.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ user: req.user, action: 'CREATE_DOCTOR', entity: 'Doctor', entityId: doctor._id, ip: req.ip });
    res.status(201).json({ success: true, data: doctor, message: 'Doctor added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    await createAuditLog({ user: req.user, action: 'UPDATE_DOCTOR', entity: 'Doctor', entityId: req.params.id, ip: req.ip });
    res.json({ success: true, data: doctor, message: 'Doctor updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const totalOrders = await Order.countDocuments({ doctor: doctorId });
    res.json({ success: true, data: { totalOrders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, getById, update, getStats };
