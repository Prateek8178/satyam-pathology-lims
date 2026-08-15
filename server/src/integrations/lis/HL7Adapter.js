const LISAdapter = require('./LISAdapter');
class HL7Adapter extends LISAdapter {
  constructor(config) { super(config); throw new Error('[HL7Adapter] Not yet configured.'); }
}
module.exports = HL7Adapter;
