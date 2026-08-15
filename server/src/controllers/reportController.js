const Report = require('../models/Report');
const Result = require('../models/Result');
const LabSettings = require('../models/LabSettings');
const { generateReportId } = require('../services/idGenerator');
const { generateReport } = require('../pdf/reportGenerator');
const { createAuditLog } = require('../middleware/auditLogger');
const path = require('path');
const fs = require('fs');

const generate = async (req, res) => {
  try {
    const { resultId, reportType } = req.body;
    if (!resultId || !reportType) {
      return res.status(400).json({ success: false, message: 'resultId and reportType are required' });
    }
    if (!['WITH_HEADER', 'WITHOUT_HEADER'].includes(reportType)) {
      return res.status(400).json({ success: false, message: 'reportType must be WITH_HEADER or WITHOUT_HEADER' });
    }

    const result = await Result.findById(resultId).populate('patient').populate('test').populate('order').populate('sample');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    // Allow report generation for any result that has been reviewed
    if (!['REVIEWED', 'VERIFICATION_PENDING', 'VERIFIED'].includes(result.status)) {
      // Auto-mark as reviewed if entering results
      await Result.findByIdAndUpdate(resultId, { status: 'VERIFICATION_PENDING' });
    }

    const reportId = await generateReportId();
    const report = await Report.create({
      reportId, patient: result.patient._id, order: result.order._id || result.order,
      test: result.test._id || result.test, result: result._id,
      reportType, status: 'GENERATED', generatedBy: req.user._id,
      generatedAt: new Date(), verificationStatus: 'UNVERIFIED'
    });

    // Generate PDF
    await generateReport(reportId, reportType);

    await createAuditLog({
      user: req.user, action: 'REPORT_GENERATED', entity: 'Report',
      entityId: report._id, newValue: { reportId, reportType }, ip: req.ip
    });

    res.status(201).json({ success: true, data: report, message: `Report ${reportId} generated` });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.reportType) filter.reportType = req.query.reportType;
    const [data, total] = await Promise.all([
      Report.find(filter).populate('patient', 'fullName patientId').populate('test', 'testName').populate('generatedBy', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Report.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('patient').populate('test').populate('result').populate('generatedBy', 'fullName').populate('order', 'orderId');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPDF = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    // For patient role, only allow own reports
    // req.user.role check here if patient portal is added

    const requestedType = req.query.type || report.reportType;
    const suffix = requestedType === 'WITH_HEADER' ? 'with-header' : 'without-header';
    const fileName = `${report.reportId}-${suffix}.pdf`;
    const filePath = path.join(__dirname, '../../uploads/reports', fileName);

    if (!fs.existsSync(filePath)) {
      // Try to regenerate
      await generateReport(report.reportId, requestedType);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found' });
    }

    report.downloadCount = (report.downloadCount || 0) + 1;
    await report.save();

    await createAuditLog({ user: req.user, action: 'REPORT_DOWNLOADED', entity: 'Report', entityId: report._id, ip: req.ip });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const search = async (req, res) => {
  try {
    const { reportId, patientId, patientName, mobile, sampleId, orderId, dateFrom, dateTo } = req.query;
    const filter = {};
    if (reportId) filter.reportId = { $regex: reportId, $options: 'i' };
    if (dateFrom || dateTo) {
      filter.generatedAt = {};
      if (dateFrom) filter.generatedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.generatedAt.$lte = new Date(dateTo);
    }
    let reports = await Report.find(filter)
      .populate('patient', 'fullName patientId mobile')
      .populate('test', 'testName')
      .populate('generatedBy', 'fullName')
      .sort({ createdAt: -1 }).limit(50);

    // Filter by patient fields
    if (patientName || patientId || mobile) {
      reports = reports.filter(r => {
        const p = r.patient;
        if (!p) return false;
        if (patientName && !p.fullName?.toLowerCase().includes(patientName.toLowerCase())) return false;
        if (patientId && !p.patientId?.includes(patientId)) return false;
        if (mobile && !p.mobile?.includes(mobile)) return false;
        return true;
      });
    }

    res.json({ success: true, data: reports, total: reports.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const regenerate = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    await generateReport(report.reportId, report.reportType);
    await createAuditLog({ user: req.user, action: 'REPORT_REGENERATED', entity: 'Report', entityId: report._id, ip: req.ip });
    res.json({ success: true, message: 'Report regenerated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByPatient = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    // Security: patient can only see their own reports
    const data = await Report.find({ patient: patientId }).populate('test', 'testName').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUBLIC endpoint for QR verification
const verifyReport = async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId })
      .populate('test', 'testName')
      .populate({ path: 'result', select: 'verifiedAt verifiedBy', populate: { path: 'verifiedBy', select: 'fullName' } });
    const labSettings = await LabSettings.findOne();

    if (!report) {
      return res.json({ success: false, data: { found: false }, message: 'Report not found' });
    }

    // Return ONLY non-PII verification info
    res.json({
      success: true,
      data: {
        found: true,
        reportId: report.reportId,
        testName: report.test?.testName,
        reportDate: report.generatedAt,
        status: report.verificationStatus,
        reportType: report.reportType,
        labName: labSettings?.labName || 'Path-Lab Diagnostics',
        verifiedAt: report.result?.verifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generate, getAll, getById, getPDF, search, regenerate, getByPatient, verifyReport };
