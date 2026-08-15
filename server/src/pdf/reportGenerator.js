const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const Report = require('../models/Report');
const Result = require('../models/Result');
const LabSettings = require('../models/LabSettings');
const TestParameter = require('../models/TestParameter');
const { REPORT_TYPE } = require('../config/constants');

const COLORS = {
  primary: '#1E40AF',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  text: '#1F2937',
  muted: '#6B7280',
  light: '#F3F4F6',
  border: '#E5E7EB'
};

const getFlagColor = (flag) => {
  switch (flag) {
    case 'CRITICAL': return COLORS.danger;
    case 'HIGH': return '#EA580C';
    case 'LOW': return '#2563EB';
    case 'ABNORMAL': return COLORS.warning;
    default: return COLORS.text;
  }
};

const getFlagLabel = (flag) => {
  switch (flag) {
    case 'CRITICAL': return 'C';
    case 'HIGH': return 'H';
    case 'LOW': return 'L';
    case 'ABNORMAL': return 'A';
    default: return '';
  }
};

const generateReport = async (reportId, reportType, options = {}) => {
  const report = await Report.findOne({ reportId })
    .populate({ path: 'patient', populate: { path: 'referringDoctor' } })
    .populate('order')
    .populate('test')
    .populate({
      path: 'result',
      populate: { path: 'parameterResults.parameter', model: 'TestParameter' }
    });

  if (!report) throw new Error(`Report not found: ${reportId}`);
  if (!report.result) throw new Error('No result data found for report');

  const labSettings = await LabSettings.findOne();
  const patient = report.patient;
  const test = report.test;
  const result = report.result;
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Ensure uploads directory exists
  const uploadDir = path.join(__dirname, '../../uploads/reports');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const suffix = reportType === REPORT_TYPE.WITH_HEADER ? 'with-header' : 'without-header';
  const fileName = `${reportId}-${suffix}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width - 80; // accounting for margins
  let y = 40;

  if (reportType === REPORT_TYPE.WITH_HEADER && labSettings) {
    // === HEADER SECTION ===
    // Logo (if exists)
    if (labSettings.logo && fs.existsSync(labSettings.logo)) {
      doc.image(labSettings.logo, 40, y, { width: 80, height: 80 });
    }
    // Lab name
    doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.primary)
      .text(labSettings.labName || 'Path-Lab Diagnostics', 130, y + 5, { width: pageWidth - 90 });
    // Address/contact
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
      .text(labSettings.address || '', 130, y + 32, { width: pageWidth - 90 })
      .text(`Tel: ${labSettings.phone || ''} | Email: ${labSettings.email || ''}`, 130, y + 44)
      .text(labSettings.registrationInfo || '', 130, y + 56);
    y += 90;
    // Separator
    doc.moveTo(40, y).lineTo(40 + pageWidth, y).lineWidth(2).strokeColor(COLORS.primary).stroke();
    y += 10;
  } else {
    // WITHOUT_HEADER: just a thin top border
    doc.moveTo(40, y).lineTo(40 + pageWidth, y).lineWidth(1).strokeColor(COLORS.border).stroke();
    y += 10;
  }

  // === REPORT TITLE ===
  doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.primary)
    .text('LABORATORY REPORT', 40, y, { width: pageWidth, align: 'center' });
  y += 22;

  // Report ID + Date (right aligned)
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted);
  const reportDate = new Date(report.generatedAt || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Report ID: ${reportId}`, 40, y, { width: pageWidth, align: 'right' });
  y += 12;
  doc.text(`Date: ${reportDate}`, 40, y, { width: pageWidth, align: 'right' });
  y += 18;

  // === PATIENT INFO BOX ===
  doc.rect(40, y, pageWidth, 60).fillAndStroke(COLORS.light, COLORS.border);
  const col1X = 50;
  const col2X = 220;
  const col3X = 390;
  const infoY = y + 8;
  doc.fontSize(9).fillColor(COLORS.text);
  const dob = patient.dob ? new Date(patient.dob).toLocaleDateString('en-IN') : 'N/A';
  const collectionDate = result.enteredAt ? new Date(result.enteredAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  
  doc.font('Helvetica-Bold').text('Patient:', col1X, infoY).font('Helvetica').text(`${patient.fullName}`, col1X + 50, infoY);
  doc.font('Helvetica-Bold').text('UHID:', col1X, infoY + 14).font('Helvetica').text(patient.patientId, col1X + 50, infoY + 14);
  doc.font('Helvetica-Bold').text('Age/Sex:', col1X, infoY + 28).font('Helvetica').text(`${patient.age || 'N/A'} Yrs / ${patient.gender || 'N/A'}`, col1X + 50, infoY + 28);
  doc.font('Helvetica-Bold').text('Mobile:', col1X, infoY + 42).font('Helvetica').text(patient.mobile || 'N/A', col1X + 50, infoY + 42);
  
  const refDoc = patient.referringDoctor?.name || 'Self';
  doc.font('Helvetica-Bold').text('Ref. Doctor:', col2X, infoY).font('Helvetica').text(refDoc, col2X + 70, infoY);
  doc.font('Helvetica-Bold').text('Collection:', col2X, infoY + 14).font('Helvetica').text(collectionDate, col2X + 70, infoY + 14);
  doc.font('Helvetica-Bold').text('Sample Type:', col2X, infoY + 28).font('Helvetica').text(test.sampleType || 'N/A', col2X + 70, infoY + 28);

  y += 68;

  // === TEST NAME ===
  doc.rect(40, y, pageWidth, 18).fill(COLORS.primary);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
    .text(test.testName?.toUpperCase() || 'TEST RESULTS', 46, y + 4, { width: pageWidth - 12 });
  y += 22;

  // === RESULTS TABLE HEADER ===
  const colWidths = { sno: 25, param: 160, result: 80, unit: 70, range: 120, flag: 40 };
  const startX = 40;
  doc.rect(startX, y, pageWidth, 16).fill('#E8EEF7');
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.text);
  let cx = startX + 4;
  doc.text('#', cx, y + 4, { width: colWidths.sno }); cx += colWidths.sno;
  doc.text('Parameter', cx, y + 4, { width: colWidths.param }); cx += colWidths.param;
  doc.text('Result', cx, y + 4, { width: colWidths.result }); cx += colWidths.result;
  doc.text('Unit', cx, y + 4, { width: colWidths.unit }); cx += colWidths.unit;
  doc.text('Reference Range', cx, y + 4, { width: colWidths.range }); cx += colWidths.range;
  doc.text('Flag', cx, y + 4, { width: colWidths.flag });
  y += 18;

  // === RESULT ROWS ===
  const paramResults = result.parameterResults || [];
  paramResults.forEach((pr, i) => {
    const rowH = 16;
    if (i % 2 === 0) doc.rect(startX, y, pageWidth, rowH).fill('#FAFAFA');
    doc.fontSize(8).fillColor(getFlagColor(pr.flag)).font('Helvetica');
    let rx = startX + 4;
    doc.text(String(i + 1), rx, y + 4, { width: colWidths.sno }); rx += colWidths.sno;
    doc.fillColor(COLORS.text).text(pr.parameter?.paramName || 'N/A', rx, y + 4, { width: colWidths.param }); rx += colWidths.param;
    doc.fillColor(getFlagColor(pr.flag)).font('Helvetica-Bold').text(pr.value || 'N/A', rx, y + 4, { width: colWidths.result }); rx += colWidths.result;
    doc.fillColor(COLORS.muted).font('Helvetica').text(pr.unit || '', rx, y + 4, { width: colWidths.unit }); rx += colWidths.unit;
    doc.fillColor(COLORS.text).text(pr.referenceRange || 'N/A', rx, y + 4, { width: colWidths.range }); rx += colWidths.range;
    const flagLabel = getFlagLabel(pr.flag);
    if (flagLabel) {
      doc.fillColor(getFlagColor(pr.flag)).font('Helvetica-Bold').text(flagLabel, rx, y + 4, { width: colWidths.flag });
    }
    // Bottom border
    doc.moveTo(startX, y + rowH).lineTo(startX + pageWidth, y + rowH).lineWidth(0.3).strokeColor(COLORS.border).stroke();
    y += rowH;
  });

  y += 10;

  // === REMARKS ===
  if (result.pathologistRemarks || result.technicianRemarks) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text).text('Remarks:', 40, y);
    y += 12;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.text)
      .text(result.pathologistRemarks || result.technicianRemarks || '', 40, y, { width: pageWidth });
    y += 20;
  }

  // === FOOTER ===
  const footerY = doc.page.height - 120;
  doc.moveTo(40, footerY).lineTo(40 + pageWidth, footerY).lineWidth(1).strokeColor(COLORS.border).stroke();
  
  // Signatures
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted);
  doc.text('Technician', 40, footerY + 8);
  doc.text('Authorized Signatory', 40 + pageWidth - 140, footerY + 8);
  doc.moveTo(40, footerY + 40).lineTo(140, footerY + 40).lineWidth(0.5).strokeColor(COLORS.muted).stroke();
  doc.moveTo(40 + pageWidth - 160, footerY + 40).lineTo(40 + pageWidth - 20, footerY + 40).lineWidth(0.5).strokeColor(COLORS.muted).stroke();

  // QR Code (WITH_HEADER only)
  if (reportType === REPORT_TYPE.WITH_HEADER && labSettings?.reportSettings?.showQR !== false) {
    try {
      const qrBuffer = await QRCode.toBuffer(`http://localhost:5173/verify-report/${reportId}`, { width: 70, margin: 1 });
      doc.image(qrBuffer, 40 + pageWidth - 70, footerY + 5, { width: 60, height: 60 });
      doc.fontSize(6).fillColor(COLORS.muted).text('Scan to verify', 40 + pageWidth - 70, footerY + 66, { width: 60, align: 'center' });
    } catch (qrErr) {
      console.warn('QR generation failed:', qrErr.message);
    }
  }

  // Disclaimer
  if (labSettings?.disclaimer) {
    doc.fontSize(7).fillColor(COLORS.muted).text(labSettings.disclaimer, 40, footerY + 50, { width: pageWidth - 80 });
  }

  // Footer text
  doc.fontSize(7).fillColor(COLORS.muted).text(
    labSettings?.reportSettings?.footerText || `This report is generated by ${labSettings?.labName || 'Path-Lab'}. For queries contact lab.`,
    40, footerY + 80, { width: pageWidth, align: 'center' }
  );

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Update report record
  const pdfRelPath = `uploads/reports/${fileName}`;
  await Report.findOneAndUpdate({ reportId }, { pdfPath: pdfRelPath, status: 'FINAL', generatedAt: new Date() });

  return { filePath, pdfPath: pdfRelPath, fileName };
};

module.exports = { generateReport };
