const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['percentage', 'flat'], required: true },
  value:       { type: Number, required: true },          // % or ₹ amount
  scope:       { type: String, enum: ['all', 'category', 'products'], required: true },
  categories:  [{ type: String }],                        // used when scope=category
  products:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // scope=products
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  badge:       { type: String, default: '' },             // e.g. "DIWALI", "HOLI SALE"
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
