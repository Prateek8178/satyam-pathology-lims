const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Order = require('../models/Order');
const Sample = require('../models/Sample');
const Result = require('../models/Result');
const Report = require('../models/Report');
const Payment = require('../models/Payment');
const { generatePatientId } = require('../services/idGenerator');
const { createAuditLog } = require('../middleware/auditLogger');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const q = req.query.q;

    const filter = { isActive: true };
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { patientId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const [data, total] = await Promise.all([
      Patient.find(filter).populate('referringDoctor', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Patient.countDocuments(filter)
    ]);

    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const search = async (req, res) => {
  try {
    const q = req.query.q || '';
    const filter = {
      isActive: true,
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { patientId: { $regex: q, $options: 'i' } }
      ]
    };
    const data = await Patient.find(filter).populate('referringDoctor', 'name').limit(10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const patientId = await generatePatientId();
    // referringDoctor must be ObjectId — strip free text, store in referredByName
    const { referringDoctor, referredByName, ...rest } = req.body;
    const docData = {};
    if (referringDoctor && mongoose.Types.ObjectId.isValid(referringDoctor)) {
      docData.referringDoctor = referringDoctor;
    }
    if (referredByName) docData.referredByName = referredByName;
    else if (referringDoctor && !mongoose.Types.ObjectId.isValid(referringDoctor)) {
      // Passed free text (e.g. "Self") — store it as referredByName
      docData.referredByName = referringDoctor;
    }
    const patient = await Patient.create({
      ...rest,
      ...docData,
      patientId,
      createdBy: req.user._id
    });
    await createAuditLog({
      user: req.user,
      action: 'CREATE_PATIENT',
      entity: 'Patient',
      entityId: patient._id,
      newValue: { patientId, fullName: patient.fullName },
      ip: req.ip
    });
    res.status(201).json({ success: true, data: patient, message: 'Patient registered successfully' });
  } catch (error) {
    console.error('[PATIENT CREATE ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Patient create failed' });
  }
};


const getById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('referringDoctor', 'name qualification specialization mobile').populate('createdBy', 'fullName');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const old = await Patient.findById(req.params.id);
    if (!old) return res.status(404).json({ success: false, message: 'Patient not found' });
    const { referringDoctor, referredByName, ...rest } = req.body;
    const docData = {};
    if (referringDoctor && mongoose.Types.ObjectId.isValid(referringDoctor)) {
      docData.referringDoctor = referringDoctor;
    }
    if (referredByName !== undefined) docData.referredByName = referredByName;
    else if (referringDoctor && !mongoose.Types.ObjectId.isValid(referringDoctor)) {
      docData.referredByName = referringDoctor;
    }
    const updated = await Patient.findByIdAndUpdate(req.params.id, { ...rest, ...docData }, { new: true, runValidators: true });

    await createAuditLog({
      user: req.user,
      action: 'UPDATE_PATIENT',
      entity: 'Patient',
      entityId: req.params.id,
      oldValue: { fullName: old.fullName, mobile: old.mobile },
      newValue: { fullName: updated.fullName, mobile: updated.mobile },
      ip: req.ip
    });
    res.json({ success: true, data: updated, message: 'Patient updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const patientId = req.params.id;
    const [orders, samples, results, reports, payments] = await Promise.all([
      Order.find({ patient: patientId }).populate('doctor', 'name').populate('orderItems.test', 'testName').sort({ createdAt: -1 }),
      Sample.find({ patient: patientId }).populate('test', 'testName').sort({ createdAt: -1 }),
      Result.find({ patient: patientId }).populate('test', 'testName').sort({ createdAt: -1 }),
      Report.find({ patient: patientId }).populate('test', 'testName').sort({ createdAt: -1 }),
      Payment.find({ patient: patientId }).populate('invoice', 'invoiceId total').sort({ createdAt: -1 })
    ]);
    res.json({ success: true, data: { orders, samples, results, reports, payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, search, create, getById, update, getHistory, deletePatient };

