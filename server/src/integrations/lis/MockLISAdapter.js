const LISAdapter = require('./LISAdapter');
class MockLISAdapter extends LISAdapter {
  constructor(config) { super(config); this.pendingResults = []; this.name = 'MockAnalyzer'; }
  async connect() { this.connected = true; this.lastConnected = new Date(); console.log('[MockLISAdapter] Connected'); return true; }
  async disconnect() { this.connected = false; console.log('[MockLISAdapter] Disconnected'); }
  addMockResult(sampleId, parsedResults) { this.pendingResults.push({ id: `MOCK-${Date.now()}`, sampleId, parsedResults, receivedAt: new Date() }); }
  async receiveResults() { const results = [...this.pendingResults]; this.pendingResults = []; return results; }
  parseResult(raw) { return { sampleId: raw.sampleId, parsedResults: raw.parsedResults || [], analyzerName: this.name, receivedAt: raw.receivedAt || new Date() }; }
  async acknowledgeResult(resultId) { return true; }
}
module.exports = MockLISAdapter;
