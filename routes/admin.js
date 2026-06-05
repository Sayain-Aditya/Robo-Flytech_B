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
  const order = await Order.findByIdAndUpdate(req.params.id,
    { status: req.body.status }, { new: true });
  order ? res.json(order) : res.status(404).json({ message: 'Order not found' });
});

// All customers
adminRouter.get('/customers', async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password').sort('-createdAt');
  res.json(users);
});

module.exports = adminRouter;
