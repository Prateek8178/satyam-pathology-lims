const Appointment = require('../models/Appointment');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const [data, total] = await Promise.all([
      Appointment.find(filter).populate('patient', 'fullName patientId mobile').populate('doctor', 'name').populate('tests', 'testName').sort({ date: -1 }).skip(skip).limit(limit),
      Appointment.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const appt = await Appointment.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: appt, message: 'Appointment created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate('patient').populate('doctor').populate('tests');
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, getById, update };
