const Patient = require('../models/Patient');
const Order = require('../models/Order');
const Sample = require('../models/Sample');
const Invoice = require('../models/Invoice');
const Report = require('../models/Report');

const getYear = () => new Date().getFullYear();
const padNum = (n) => String(n).padStart(6, '0');

const generatePatientId = async () => {
  const year = getYear();
  const prefix = `PAT-${year}-`;
  // Find highest existing number to avoid duplicates
  const last = await Patient.findOne({ patientId: { $regex: `^${prefix}` } })
    .sort({ patientId: -1 }).select('patientId');
  const nextNum = last ? (parseInt(last.patientId.replace(prefix, ''), 10) + 1) : 1;
  return `${prefix}${padNum(nextNum)}`;
};

const generateOrderId = async () => {
  const year = getYear();
  const prefix = `ORD-${year}-`;
  const last = await Order.findOne({ orderId: { $regex: `^${prefix}` } })
    .sort({ orderId: -1 }).select('orderId');
  const nextNum = last ? (parseInt(last.orderId.replace(prefix, ''), 10) + 1) : 1;
  return `${prefix}${padNum(nextNum)}`;
};

const generateSampleId = async () => {
  const year = getYear();
  const prefix = `S-${year}-`;
  const last = await Sample.findOne({ sampleId: { $regex: `^${prefix}` } })
    .sort({ sampleId: -1 }).select('sampleId');
  const nextNum = last ? (parseInt(last.sampleId.replace(prefix, ''), 10) + 1) : 1;
  return `${prefix}${padNum(nextNum)}`;
};

const generateInvoiceId = async () => {
  const year = getYear();
  const prefix = `INV-${year}-`;
  const last = await Invoice.findOne({ invoiceId: { $regex: `^${prefix}` } })
    .sort({ invoiceId: -1 }).select('invoiceId');
  const nextNum = last ? (parseInt(last.invoiceId.replace(prefix, ''), 10) + 1) : 1;
  return `${prefix}${padNum(nextNum)}`;
};

const generateReportId = async () => {
  const year = getYear();
  const prefix = `REP-${year}-`;
  const last = await Report.findOne({ reportId: { $regex: `^${prefix}` } })
    .sort({ reportId: -1 }).select('reportId');
  const nextNum = last ? (parseInt(last.reportId.replace(prefix, ''), 10) + 1) : 1;
  return `${prefix}${padNum(nextNum)}`;
};

module.exports = { generatePatientId, generateOrderId, generateSampleId, generateInvoiceId, generateReportId };
