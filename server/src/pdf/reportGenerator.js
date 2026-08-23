const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const Report = require('../models/Report');
const Result = require('../models/Result');
const LabSettings = require('../models/LabSettings');
const TestParameter = require('../models/TestParameter');
const { REPORT_TYPE } = require('../config/constants');
const { isReportable } = require('../utils/formulaEngine');

const COLORS = {
  primary: '#1D3557',
  accent: '#E63946',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  text: '#0F172A',
  muted: '#64748B',
  light: '#F8FAFC',
  border: '#CBD5E1'
};

const getFlagColor = (flag) => {
  switch (flag) {
    case 'CRITICAL':
    case 'High':
    case 'HIGH': return COLORS.danger;
    case 'Low':
    case 'LOW': return '#2563EB';
    case 'ABNORMAL': return COLORS.warning;
    default: return COLORS.text;
  }
};

const getFlagLabel = (flag) => {
  if (!flag) return '';
  if (flag === 'CRITICAL' || flag === 'C') return 'Critical';
  if (flag === 'HIGH' || flag === 'High' || flag === 'H') return 'High';
  if (flag === 'LOW' || flag === 'Low' || flag === 'L') return 'Low';
  return String(flag);
};

// Converts Base64 data URL or file path to Buffer
const getImageBuffer = (src) => {
  if (!src) return null;
  try {
    if (src.startsWith('data:image/')) {
      const base64Data = src.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }
    if (fs.existsSync(src)) {
      return fs.readFileSync(src);
    }
  } catch (err) {
    console.error('Image buffer extraction error:', err.message);
  }
  return null;
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

  const labSettings = (await LabSettings.findOne()) || {
    labName: 'We Care PATHOLOGY LAB',
    tagline: 'Accurate Results Timely Delivered',
    address: '1283, BT Road near Maruti Marbal, Choti Bajariya, Garha Jabalpur (M.P.)',
    phone: '9131709514',
    doctorName: 'DR. R K SAGARIYA',
    doctorDegree: 'MD PATHOLOGY',
    disclaimer: 'Note: Pathological Test Have Technical, For Any Disparity, retested Examination Are Required. No Legal Liability Is Accepted. Clinical Correlation Is Also Requested.'
  };

  const patient = report.patient || {};
  const test = report.test || {};
  const result = report.result || {};
  const doc = new PDFDocument({ margin: 30, size: 'A4', autoFirstPage: false });

  const uploadDir = path.join(__dirname, '../../uploads/reports');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const suffix = reportType === REPORT_TYPE.WITH_HEADER ? 'with-header' : 'without-header';
  const fileName = `${reportId}-${suffix}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const logoBuffer = getImageBuffer(labSettings.logo);
  const signatureBuffer = getImageBuffer(labSettings.signature);
  const qrBuffer = await QRCode.toBuffer(`https://satyam-pathology-lims.com/verify/${reportId}`, { width: 80, margin: 1 }).catch(() => null);

  // Helper to draw the header on a page
  const drawHeader = () => {
    const pageWidth = doc.page.width - 60;
    let y = 30;

    if (reportType === REPORT_TYPE.WITH_HEADER) {
      // Left Badge
      doc.rect(30, y, 140, 48).fill('#1D3557');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
        .text('PATHOLOGY REPORTS', 36, y + 8, { width: 128, align: 'center' });
      doc.rect(36, y + 26, 128, 16).fill('#E63946');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF')
        .text(labSettings.tagline || 'Accurate Results Timely Delivered', 36, y + 30, { width: 128, align: 'center' });

      // Logo
      if (logoBuffer) {
        doc.image(logoBuffer, 180, y, { fit: [50, 48], align: 'center', valign: 'center' });
      }

      // Right Clinic Details
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#E63946')
        .text(labSettings.labName || 'We Care PATHOLOGY LAB', 240, y, { width: pageWidth - 210, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#334155')
        .text(labSettings.address || '', 240, y + 22, { width: pageWidth - 210, align: 'right' })
        .text(`Customer Support :- ${labSettings.customerSupport || labSettings.phone || ''}`, 240, y + 34, { width: pageWidth - 210, align: 'right' });

      y += 56;
      doc.moveTo(30, y).lineTo(30 + pageWidth, y).lineWidth(1.5).strokeColor('#0F172A').stroke();
      y += 6;
    }

    // Patient Info Box
    const col1X = 35;
    const col2X = 230;
    const col3X = 420;
    const infoY = y + 4;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(COLORS.text);
    doc.text(`${patient.fullName || '—'}`, col1X, infoY);
    doc.fontSize(8).font('Helvetica');
    doc.text(`Age : ${patient.age ? `${patient.age} Years` : '—'}`, col1X, infoY + 12);
    doc.text(`Sex : ${patient.gender || '—'}`, col1X, infoY + 22);
    doc.text(`UHID : ${patient.patientId || reportId}`, col1X, infoY + 32);

    if (qrBuffer) {
      doc.image(qrBuffer, col2X, infoY, { width: 42, height: 42 });
    }
    doc.font('Helvetica-Bold').text(`Ref. By : ${patient.referringDoctor?.name || 'Self'}`, col2X + 48, infoY + 12);

    const reportDate = new Date(report.generatedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.font('Helvetica').text(`Registered : ${reportDate} 09:00 AM`, col3X, infoY, { align: 'right' });
    doc.text(`Collected : ${reportDate} 09:45 AM`, col3X, infoY + 12, { align: 'right' });
    doc.text(`Reported : ${reportDate} 04:00 PM`, col3X, infoY + 22, { align: 'right' });

    y += 48;
    doc.moveTo(30, y).lineTo(30 + pageWidth, y).lineWidth(1.5).strokeColor('#0F172A').stroke();
    return y + 10;
  };

  // Helper to draw repeating footer on every page
  const drawFooter = () => {
    const pageWidth = doc.page.width - 60;
    const footerY = doc.page.height - 75;

    // Doctor Signature
    const sigX = 30 + pageWidth - 140;
    if (signatureBuffer) {
      doc.image(signatureBuffer, sigX + 20, footerY - 32, { fit: [100, 30], align: 'center' });
    }
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLORS.text)
      .text(labSettings.doctorName || 'DR. R K SAGARIYA', sigX, footerY, { width: 140, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#475569')
      .text(labSettings.doctorDegree || 'MD PATHOLOGY', sigX, footerY + 11, { width: 140, align: 'center' });

    // Disclaimer line
    doc.moveTo(30, footerY + 24).lineTo(30 + pageWidth, footerY + 24).lineWidth(0.5).strokeColor(COLORS.border).stroke();
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.muted)
      .text(labSettings.disclaimer || 'Note: Pathological Test Have Technical, For Any Disparity, retested Examination Are Required. No Legal Liability Is Accepted. Clinical Correlation Is Also Requested.', 30, footerY + 28, { width: pageWidth, align: 'center' });
  };

  doc.addPage();
  let currentY = drawHeader();

  // Test Title
  const pageWidth = doc.page.width - 60;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text)
    .text(test.testName?.toUpperCase() || 'LABORATORY REPORT', 30, currentY, { width: pageWidth, align: 'center' });
  currentY += 18;

  // Table Headers
  const colWidths = { param: 190, result: 80, flag: 40, range: 140, unit: 85 };
  doc.moveTo(30, currentY).lineTo(30 + pageWidth, currentY).lineWidth(1.5).strokeColor('#0F172A').stroke();
  currentY += 4;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text);
  let cx = 30;
  doc.text('Test', cx + 4, currentY, { width: colWidths.param }); cx += colWidths.param;
  doc.text('Result', cx, currentY, { width: colWidths.result, align: 'center' }); cx += colWidths.result;
  doc.text('', cx, currentY, { width: colWidths.flag }); cx += colWidths.flag;
  doc.text('Ref. Value', cx + 4, currentY, { width: colWidths.range }); cx += colWidths.range;
  doc.text('Unit', cx, currentY, { width: colWidths.unit, align: 'center' });
  currentY += 14;
  doc.moveTo(30, currentY).lineTo(30 + pageWidth, currentY).lineWidth(1).strokeColor('#0F172A').stroke();
  currentY += 6;

  // Filter only reportable parameter results
  const rawParams = result.parameterResults || [];
  const paramResults = rawParams.filter(pr => isReportable(pr.value) || isReportable(pr.numericValue));

  paramResults.forEach((pr, i) => {
    // Check if we need a new page
    if (currentY > doc.page.height - 110) {
      drawFooter();
      doc.addPage();
      currentY = drawHeader() + 10;
    }

    const rowH = 16;
    let rx = 30;
    doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.text);
    doc.text(pr.parameter?.paramName || 'Parameter', rx + 4, currentY + 3, { width: colWidths.param }); rx += colWidths.param;

    doc.font('Helvetica-Bold').fillColor(getFlagColor(pr.flag))
      .text(String(pr.value ?? pr.numericValue ?? ''), rx, currentY + 3, { width: colWidths.result, align: 'center' }); rx += colWidths.result;

    const flagLabel = getFlagLabel(pr.flag);
    doc.fontSize(8).text(flagLabel, rx, currentY + 3, { width: colWidths.flag, align: 'center' }); rx += colWidths.flag;

    doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.text)
      .text(pr.referenceRange || '—', rx + 4, currentY + 3, { width: colWidths.range }); rx += colWidths.range;

    doc.text(pr.unit || '', rx, currentY + 3, { width: colWidths.unit, align: 'center' });

    currentY += rowH;
    doc.moveTo(30, currentY).lineTo(30 + pageWidth, currentY).lineWidth(0.3).strokeColor('#E2E8F0').stroke();
    currentY += 2;
  });

  // Comments / Interpretation box
  if (result.pathologistRemarks || result.technicianRemarks || test.comments) {
    currentY += 10;
    if (currentY > doc.page.height - 140) {
      drawFooter();
      doc.addPage();
      currentY = drawHeader() + 10;
    }
    const remarks = result.pathologistRemarks || result.technicianRemarks || test.comments;
    doc.rect(30, currentY, pageWidth, 40).strokeColor('#0F172A').stroke();
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.text)
      .text('Interpretation / Comments:', 36, currentY + 4);
    doc.fontSize(7.5).font('Helvetica').fillColor('#334155')
      .text(remarks, 36, currentY + 14, { width: pageWidth - 12 });
  }

  // Draw footer on last page
  drawFooter();

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const pdfRelPath = `uploads/reports/${fileName}`;
  await Report.findOneAndUpdate({ reportId }, { pdfPath: pdfRelPath, status: 'FINAL', generatedAt: new Date() });

  return { filePath, pdfPath: pdfRelPath, fileName };
};

module.exports = { generateReport };
