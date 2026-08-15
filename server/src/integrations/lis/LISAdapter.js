class LISAdapter {
  constructor(config) { this.config = config; this.connected = false; this.lastConnected = null; this.connectionError = null; }
  async connect() { throw new Error(`${this.constructor.name}: connect() not implemented`); }
  async disconnect() { throw new Error(`${this.constructor.name}: disconnect() not implemented`); }
  getConnectionStatus() { return { connected: this.connected, lastConnected: this.lastConnected, error: this.connectionError, adapterType: this.constructor.name }; }
  async receiveResults() { throw new Error(`${this.constructor.name}: receiveResults() not implemented`); }
  parseResult(raw) { throw new Error(`${this.constructor.name}: parseResult() not implemented`); }
  async acknowledgeResult(resultId) { throw new Error(`${this.constructor.name}: acknowledgeResult() not implemented`); }
  async sendOrder(order) { throw new Error(`${this.constructor.name}: sendOrder() not supported`); }
}
module.exports = LISAdapter;
