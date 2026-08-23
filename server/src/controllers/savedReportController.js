const SavedReport = require('../models/SavedReport');
const Patient = require('../models/Patient');

const getNextNumber = async (req, res) => {
  try {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;
    const prefix = `STP-${dateStr}-`;

    // Find all reports created today with this prefix
    const todayReports = await SavedReport.find({
      reportNo: { $regex: new RegExp(`^${prefix}`) }
    }).select('reportNo');

    let maxNum = 0;
    if (todayReports && todayReports.length > 0) {
      for (const r of todayReports) {
        const match = r.reportNo && r.reportNo.match(new RegExp(`^${prefix}(\\d+)`));
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxNum) maxNum = val;
        }
      }
    }

    const nextNum = maxNum + 1;
    const reportNo = `${prefix}${String(nextNum).padStart(3, '0')}`;
    res.json({ success: true, nextNumber: reportNo, count: nextNum });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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
    const now = new Date();
    const dd   = String(now.getDate()).padStart(2, '0');
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;
    const prefix  = `STP-${dateStr}-`;

    // Find all reports today to guarantee uniqueness
    const todayReports = await SavedReport.find({
      reportNo: { $regex: new RegExp(`^${prefix}`) }
    }).select('reportNo');

    let maxNum = 0;
    if (todayReports && todayReports.length > 0) {
      for (const r of todayReports) {
        const match = r.reportNo && r.reportNo.match(new RegExp(`^${prefix}(\\d+)`));
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxNum) maxNum = val;
        }
      }
    }

    let reportNo = req.body.reportNo ? req.body.reportNo.trim() : '';
    // If not provided, or invalid format, or already exists, assign next unique number
    const isExisting = reportNo ? await SavedReport.findOne({ reportNo }) : null;
    if (!reportNo || reportNo.endsWith('-') || isExisting) {
      const nextNum = maxNum + 1;
      reportNo = `${prefix}${String(nextNum).padStart(3, '0')}`;
    }

    const { filterReportableSections } = require('../utils/formulaEngine');
    const cleanedSections = filterReportableSections(req.body.sections || []);

    const report = await SavedReport.create({
      ...req.body,
      sections: cleanedSections,
      reportNo,
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

module.exports = { getNextNumber, getAll, create, getById, deleteReport };
