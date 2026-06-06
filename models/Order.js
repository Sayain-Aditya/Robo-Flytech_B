const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: Number,
  originalPrice: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone:   String,
    address: String,
    city:    String,
    pin:     String,
    country: String,
  },
  paymentMethod: { type: String, default: 'COD' },
  itemsPrice: Number,
  shippingPrice: Number,
  totalPrice: Number,
  originalItemsPrice: { type: Number, default: 0 },  // MRP total before offer discounts
  couponCode:   { type: String, default: '' },
  discount:     { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
