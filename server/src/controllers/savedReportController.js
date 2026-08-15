const SavedReport = require('../models/SavedReport');
const Patient = require('../models/Patient');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.q) {
      const patients = await Patient.find({
        fullName: { $regex: req.query.q, $options: 'i' }
      }).select('_id');
      filter.patient = { $in: patients.map(p => p._id) };
    }
    const [data, total] = await Promise.all([
      SavedReport.find(filter)
        .populate('patient', 'fullName patientId age gender mobile')
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SavedReport.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    // Auto-generate STP-DDMMYYYY-NNN report number
    const now = new Date();
    const dd   = String(now.getDate()).padStart(2, '0');
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;          // e.g. 15082026
    const prefix  = `STP-${dateStr}-`;             // e.g. STP-15082026-

    // Count how many reports already exist today
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const endOfDay   = new Date(now); endOfDay.setHours(23,59,59,999);
    const countToday = await SavedReport.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const serial   = String(countToday + 1).padStart(3, '0'); // 001, 002, ...
    const reportNo = prefix + serial;                          // STP-15082026-001

    const report = await SavedReport.create({
      ...req.body,
      reportNo,          // override whatever client sent
      createdBy: req.user._id,
    });
    const populated = await report.populate('patient', 'fullName patientId age gender mobile');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const report = await SavedReport.findById(req.params.id)
      .populate('patient', 'fullName patientId age gender mobile address')
      .populate('createdBy', 'fullName');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    await SavedReport.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, getById, deleteReport };
