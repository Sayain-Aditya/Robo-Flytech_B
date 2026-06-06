const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price:        { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  image: { type: String, default: '' },
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  specifications: [
    {
      label: { type: String, required: true },
      value: { type: String, required: true },
    }
  ],
  warranty:        { type: String, default: '' },
  warrantyEnabled: { type: Boolean, default: false },
  warrantyDuration:{ type: Number, default: 1 },
  warrantyUnit:    { type: String, enum: ['Days', 'Months', 'Years'], default: 'Years' },
  returnsEnabled:  { type: Boolean, default: false },
  returnDays:      { type: Number, default: 7 },
  freeShipping:    { type: Boolean, default: false },
}, { timestamps: true });

// Indexes for common queries: text search on name and filter by category
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
