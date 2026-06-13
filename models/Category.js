const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:  { type: String, required: true, unique: true, trim: true },
  slug:  { type: String, required: true, unique: true, trim: true, lowercase: true },
  image: { type: String, default: '' },
  specifications: [{
    label: { type: String, required: true },
    value: { type: String, default: '' },
  }],
}, { timestamps: true });

categorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
