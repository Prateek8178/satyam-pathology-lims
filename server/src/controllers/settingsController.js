const LabSettings = require('../models/LabSettings');
const ReportTemplate = require('../models/ReportTemplate');
const { createAuditLog } = require('../middleware/auditLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const getLabSettings = async (req, res) => {
  try {
    let settings = await LabSettings.findOne();
    if (!settings) {
      settings = await LabSettings.create({ labName: 'Path-Lab Diagnostics' });
    }
    // Mask LIS password
    const data = settings.toObject();
    if (data.lisSettings?.password) data.lisSettings.password = '***';
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLabSettings = async (req, res) => {
  try {
    const update = req.body;
    // Don't update password via this endpoint
    if (update.lisSettings?.password === '***') delete update.lisSettings.password;
    let settings = await LabSettings.findOneAndUpdate({}, update, { new: true, upsert: true, runValidators: true });
    const data = settings.toObject();
    if (data.lisSettings?.password) data.lisSettings.password = '***';
    await createAuditLog({ user: req.user, action: 'UPDATE_LAB_SETTINGS', entity: 'LabSettings', entityId: settings._id, ip: req.ip });
    res.json({ success: true, data, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLISSettings = async (req, res) => {
  try {
    const settings = await LabSettings.findOne().select('+lisSettings.password');
    const data = settings?.lisSettings || {};
    const safe = { ...data.toObject ? data.toObject() : data };
    if (safe.password) safe.password = '***';
    res.json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLISSettings = async (req, res) => {
  try {
    const lisUpdate = req.body;
    if (lisUpdate.password === '***') delete lisUpdate.password;
    const update = {};
    for (const key of Object.keys(lisUpdate)) {
      update[`lisSettings.${key}`] = lisUpdate[key];
    }
    await LabSettings.findOneAndUpdate({}, { $set: update }, { upsert: true });
    res.json({ success: true, message: 'LIS settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLabSettings, updateLabSettings, getLISSettings, updateLISSettings };
