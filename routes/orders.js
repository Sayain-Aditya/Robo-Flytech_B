const ordRouter = require('express').Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

ordRouter.post('/', protect, async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, totalPrice } = req.body;
  const order = await Order.create({
    user: req.user._id, items, shippingAddress,
    paymentMethod, itemsPrice, shippingPrice, totalPrice,
  });
  res.status(201).json(order);
});

ordRouter.get('/myorders', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json(orders);
});

ordRouter.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  order ? res.json(order) : res.status(404).json({ message: 'Order not found' });
});

module.exports = ordRouter;
