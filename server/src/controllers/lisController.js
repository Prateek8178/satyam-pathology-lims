const LISResult = require('../models/LISResult');
const Sample = require('../models/Sample');
const LISManager = require('../integrations/lis/LISManager');
const { matchAndProcessResult } = require('../integrations/lis/resultMatcher');
const Analyzer = require('../models/Analyzer');
const { createAuditLog } = require('../middleware/auditLogger');

// Called by analyzer/middleware (no user auth required - use LIS_API_KEY)
const receiveResult = async (req, res) => {
  try {
    const { sampleId, results, analyzerName, timestamp } = req.body;
    if (!sampleId) return res.status(400).json({ success: false, message: 'sampleId is required' });

    const lisResult = await LISResult.create({
      rawSampleId: sampleId,
      rawData: req.body,
      parsedResults: results || [],
      receivedAt: timestamp ? new Date(timestamp) : new Date(),
      status: 'RECEIVED',
      matchingStatus: 'PENDING'
    });

    // Async matching
    matchAndProcessResult(lisResult).catch(err => console.error('[LIS] Match error:', err.message));

    res.json({ success: true, message: 'Result received', data: { id: lisResult._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInbox = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.matchingStatus) filter.matchingStatus = req.query.matchingStatus;
    const [data, total] = await Promise.all([
      LISResult.find(filter).populate('patient', 'fullName patientId').populate('sample', 'sampleId').populate('test', 'testName').sort({ receivedAt: -1 }).skip(skip).limit(limit),
      LISResult.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUnmatched = async (req, res) => {
  try {
    const data = await LISResult.find({ matchingStatus: 'UNMATCHED' }).sort({ receivedAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const matchManually = async (req, res) => {
  try {
    const { sampleId } = req.body;
    const lisResult = await LISResult.findById(req.params.id);
    if (!lisResult) return res.status(404).json({ success: false, message: 'LIS result not found' });
    const sample = await Sample.findOne({ sampleId });
    if (!sample) return res.status(404).json({ success: false, message: 'Sample not found' });
    lisResult.rawSampleId = sampleId; // Override for matching
    await matchAndProcessResult(lisResult);
    await createAuditLog({ user: req.user, action: 'LIS_MANUAL_MATCH', entity: 'LISResult', entityId: lisResult._id, newValue: { sampleId }, ip: req.ip });
    res.json({ success: true, message: 'Result matched successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const status = LISManager.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DEV ONLY
const injectMock = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not available in production' });
    }
    const { sampleId, results } = req.body;
    const adapter = LISManager.getAdapter();
    if (!adapter || !adapter.addMockResult) {
      return res.status(400).json({ success: false, message: 'Mock adapter not active' });
    }
    adapter.addMockResult(sampleId, results);
    // Trigger poll immediately
    await LISManager.poll();
    res.json({ success: true, message: `Mock result injected for sample: ${sampleId}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalyzers = async (req, res) => {
  try {
    const data = await Analyzer.find();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { receiveResult, getInbox, getUnmatched, matchManually, getStatus, injectMock, getAnalyzers };
