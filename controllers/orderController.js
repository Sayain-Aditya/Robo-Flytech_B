const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendWhatsAppOrderNotification } = require('../utils/whatsappNotifier');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, totalPrice, couponCode, discount, originalItemsPrice } = req.body;

    // Validate stock availability first
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for "${product.name}". Available: ${product.stock}` });
      }
    }

    // Atomically deduct stock — only update if stock is still sufficient
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        return res.status(400).json({ message: `Stock just ran out for one of the items. Please refresh and try again.` });
      }
    }

    const user = await User.findById(req.user.id).select('name email phone');

    const order = await Order.create({
      user: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      originalItemsPrice: originalItemsPrice || itemsPrice,
      couponCode: couponCode || '',
      discount: discount || 0,
    });

    sendWhatsAppOrderNotification(order, user).catch(err => console.error('WhatsApp notification error:', err.message));

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.product', 'name image price');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Allow access to order owner or admin
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ message: 'Not authorized' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
