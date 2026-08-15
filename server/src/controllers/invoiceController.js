const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.patient) filter.patient = req.query.patient;
    const [data, total] = await Promise.all([
      Invoice.find(filter).populate('patient', 'fullName patientId mobile').populate('order', 'orderId').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('patient').populate('order', 'orderId status').populate('createdBy', 'fullName');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const payments = await Payment.find({ invoice: req.params.id }).populate('receivedBy', 'fullName').sort({ receivedAt: -1 });
    res.json({ success: true, data: { ...invoice.toObject(), payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const { amount, method, transactionId, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });
    if (!method) return res.status(400).json({ success: false, message: 'Payment method required' });

    const payment = await Payment.create({
      invoice: invoice._id, patient: invoice.patient,
      amount, method, transactionId, notes,
      receivedBy: req.user._id, receivedAt: new Date()
    });

    invoice.paidAmount = (invoice.paidAmount || 0) + amount;
    invoice.dueAmount = invoice.total - invoice.paidAmount;
    if (invoice.dueAmount <= 0) {
      invoice.dueAmount = 0;
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIAL';
    }
    await invoice.save();

    await createAuditLog({
      user: req.user, action: 'PAYMENT_RECEIVED', entity: 'Invoice',
      entityId: invoice._id, newValue: { amount, method }, ip: req.ip
    });

    res.status(201).json({ success: true, data: { payment, invoice }, message: 'Payment recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFinancialSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayPayments, monthPayments, pendingInvoices] = await Promise.all([
      Payment.aggregate([{ $match: { receivedAt: { $gte: today }, isRefund: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { receivedAt: { $gte: monthStart }, isRefund: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Invoice.aggregate([{ $match: { status: { $in: ['PENDING', 'PARTIAL'] } } }, { $group: { _id: null, total: { $sum: '$dueAmount' } } }])
    ]);

    res.json({
      success: true,
      data: {
        todayRevenue: todayPayments[0]?.total || 0,
        monthRevenue: monthPayments[0]?.total || 0,
        pendingDues: pendingInvoices[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, addPayment, getFinancialSummary };
