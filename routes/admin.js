const adminRouter = require('express').Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

adminRouter.use(protect, adminOnly);

// Dashboard stats
adminRouter.get('/stats', async (req, res) => {
  const [totalOrders, totalUsers, totalProducts, orders] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.find().select('totalPrice createdAt status'),
  ]);
  const revenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  res.json({ totalOrders, totalUsers, totalProducts, revenue });
});

// All orders
adminRouter.get('/orders', async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
  res.json(orders);
});

// Update order status
adminRouter.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prevStatus = order.status;
    const newStatus  = req.body.status;

    // Restore stock if cancelling a non-cancelled order
    if (newStatus === 'Cancelled' && prevStatus !== 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    // Re-deduct stock if un-cancelling (e.g. back to Pending/Processing)
    if (prevStatus === 'Cancelled' && newStatus !== 'Cancelled') {
      for (const item of order.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (!updated) return res.status(400).json({ message: `Insufficient stock to reactivate order.` });
      }
    }

    order.status = newStatus;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update shipping charges
adminRouter.put('/orders/:id/shipping', async (req, res) => {
  try {
    const { shippingPrice } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const oldShipping = order.shippingPrice || 0;
    const newShipping = Number(shippingPrice) || 0;
    
    order.shippingPrice = newShipping;
    order.totalPrice = order.itemsPrice + newShipping - (order.discount || 0);
    order.shippingChargesPending = false;
    
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// All customers
adminRouter.get('/customers', async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password').sort('-createdAt');
  res.json(users);
});

// Get single customer details with addresses and order stats
adminRouter.get('/customers/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    const Address = require('../models/Address');
    const addressDoc = await Address.findOne({ user: req.params.id });
    const addresses = addressDoc?.addresses || [];
    
    const orders = await Order.find({ user: req.params.id }).sort('-createdAt');
    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      processing: orders.filter(o => o.status === 'Processing').length,
      shipped: orders.filter(o => o.status === 'Shipped').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
      totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    };

    res.json({ user, addresses, orders, orderStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = adminRouter;
