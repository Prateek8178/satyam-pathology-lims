const MockLISAdapter = require('./MockLISAdapter');
const { matchAndProcessResult } = require('./resultMatcher');
const LISResult = require('../../models/LISResult');
let adapterInstance = null; let pollingTimer = null; let lastResultTime = null; let pendingCount = 0;
const getAdapter = (type, config) => {
  switch ((type || 'mock').toLowerCase()) {
    case 'mock': return new MockLISAdapter(config);
    case 'astm': return new (require('./ASTMAdapter'))(config);
    case 'hl7': return new (require('./HL7Adapter'))(config);
    default: return new MockLISAdapter(config);
  }
};
const start = async (config = {}) => {
  const type = process.env.LIS_ADAPTER_TYPE || 'mock'; const interval = parseInt(process.env.LIS_POLLING_INTERVAL) || 30000;
  try {
    adapterInstance = getAdapter(type, config); await adapterInstance.connect();
    pollingTimer = setInterval(async () => { await poll(); }, interval);
  } catch (err) { console.error(err); }
};
const stop = async () => { if (pollingTimer) clearInterval(pollingTimer); if (adapterInstance) await adapterInstance.disconnect(); adapterInstance = null; };
const poll = async () => {
  if (!adapterInstance || !adapterInstance.connected) return;
  try {
    const rawResults = await adapterInstance.receiveResults();
    if (!rawResults || rawResults.length === 0) return;
    for (const raw of rawResults) {
      const parsed = adapterInstance.parseResult(raw);
      const lisResult = await LISResult.create({ rawSampleId: parsed.sampleId, rawData: raw, parsedResults: parsed.parsedResults, receivedAt: parsed.receivedAt || new Date(), status: 'RECEIVED', matchingStatus: 'PENDING' });
      lastResultTime = new Date();
      await matchAndProcessResult(lisResult);
      await adapterInstance.acknowledgeResult(raw.id);
    }
    pendingCount = 0;
  } catch (err) { console.error(err); }
};
const getStatus = () => ({ connected: adapterInstance?.connected || false, adapterType: adapterInstance?.constructor?.name || 'None', lastResultTime, pendingCount, ...adapterInstance?.getConnectionStatus() });
const getAdapter_ = () => adapterInstance;
module.exports = { start, stop, poll, getStatus, getAdapter: getAdapter_ };
