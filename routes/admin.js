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

// All customers
adminRouter.get('/customers', async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password').sort('-createdAt');
  res.json(users);
});

module.exports = adminRouter;
