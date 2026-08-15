const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Reagent', 'Tube', 'Syringe', 'Gloves', 'Container', 'Other'] },
  batch: { type: String },
  quantity: { type: Number, default: 0 },
  unit: { type: String },
  expiryDate: { type: Date },
  supplier: { type: String },
  purchaseDate: { type: Date },
  minimumStock: { type: Number, default: 10 },
  costPerUnit: { type: Number },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
