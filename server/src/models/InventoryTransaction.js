const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedAt: { type: Date, default: Date.now },
  notes: { type: String },
  balanceAfter: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
