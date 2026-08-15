const Order = require('../models/Order');
const Sample = require('../models/Sample');
const Invoice = require('../models/Invoice');
const Test = require('../models/Test');
const TestPackage = require('../models/TestPackage');
const { generateOrderId, generateSampleId, generateInvoiceId } = require('../services/idGenerator');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.q) {
      // Need to join with patient - handle via populate+filter
    }
    const [data, total] = await Promise.all([
      Order.find(filter).populate('patient', 'fullName patientId mobile').populate('doctor', 'name').populate('orderItems.test', 'testName testCode').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { patient, doctor, tests = [], packages = [], priority, notes } = req.body;

    // Build order items and calculate total
    const orderItems = [];
    let totalAmount = 0;

    for (const testId of tests) {
      const test = await Test.findById(testId);
      if (!test) continue;
      orderItems.push({ test: testId, name: test.testName, price: test.price, type: 'test' });
      totalAmount += test.price;
    }

    for (const pkgId of packages) {
      const pkg = await TestPackage.findById(pkgId).populate('tests');
      if (!pkg) continue;
      orderItems.push({ package: pkgId, name: pkg.packageName, price: pkg.packagePrice, type: 'package' });
      totalAmount += pkg.packagePrice;
      // Add package tests to tests array for sample creation
      for (const t of pkg.tests) {
        tests.push(t._id);
      }
    }

    const orderId = await generateOrderId();
    const order = await Order.create({
      orderId, patient, doctor, orderItems, priority: priority || 'normal',
      notes, totalAmount, status: 'CREATED', createdBy: req.user._id
    });

    // Create samples for each test
    const uniqueTests = [...new Set(tests.map(t => t.toString()))];
    for (const testId of uniqueTests) {
      const test = await Test.findById(testId);
      if (!test) continue;
      const sampleId = await generateSampleId();
      await Sample.create({
        sampleId, order: order._id, patient,
        test: testId, sampleType: test.sampleType,
        status: 'PENDING', barcode: sampleId
      });
    }

    // Create invoice
    const invoiceId = await generateInvoiceId();
    const invoiceItems = orderItems.map(item => ({
      type: item.type,
      refId: item.test?.toString() || item.package?.toString(),
      name: item.name,
      quantity: 1,
      unitPrice: item.price,
      discount: 0,
      total: item.price
    }));
    const invoice = await Invoice.create({
      invoiceId, patient, order: order._id,
      items: invoiceItems, subtotal: totalAmount,
      total: totalAmount, dueAmount: totalAmount,
      status: 'PENDING', createdBy: req.user._id
    });

    // Link invoice to order
    order.invoice = invoice._id;
    order.status = 'SAMPLE_PENDING';
    await order.save();

    await createAuditLog({
      user: req.user, action: 'CREATE_ORDER', entity: 'Order',
      entityId: order._id, newValue: { orderId, totalAmount }, ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: { order, invoice },
      message: `Order ${orderId} created successfully`
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('patient')
      .populate('doctor')
      .populate('orderItems.test')
      .populate('invoice');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const samples = await Sample.find({ order: order._id }).populate('test', 'testName').populate('collectedBy', 'fullName');
    res.json({ success: true, data: { ...order.toObject(), samples } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await createAuditLog({ user: req.user, action: 'UPDATE_ORDER_STATUS', entity: 'Order', entityId: req.params.id, newValue: { status }, ip: req.ip });
    res.json({ success: true, data: order, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['CREATED', 'PAID', 'SAMPLE_PENDING'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order at this stage' });
    }
    order.status = 'CANCELLED';
    await order.save();
    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, getById, updateStatus, cancel };
