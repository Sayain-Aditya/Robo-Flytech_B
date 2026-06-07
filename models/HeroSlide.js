const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  image:       { type: String, required: true },
  label:       { type: String, default: '' },
  tag:         { type: String, default: '' },
  heading:     { type: String, default: '' },
  subtext:     { type: String, default: '' },
  buttonText:  { type: String, default: '' },
  buttonLink:  { type: String, default: '/products' },
  active:      { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
