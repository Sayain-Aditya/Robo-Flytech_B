const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { sendWhatsAppOrderNotification } = require('../utils/whatsappNotifier');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, totalPrice, couponCode, discount, originalItemsPrice } = req.body;

    // Validate coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!coupon) return res.status(400).json({ message: 'Invalid coupon code' });
      if (!coupon.isActive) return res.status(400).json({ message: 'Coupon is not active' });
      if (coupon.endDate && new Date() > new Date(coupon.endDate)) {
        return res.status(400).json({ message: 'Coupon has expired' });
      }
      if (new Date() < new Date(coupon.startDate)) {
        return res.status(400).json({ message: 'Coupon is not yet active' });
      }
      if (itemsPrice < coupon.minOrderAmount) {
        return res.status(400).json({ message: `Minimum order amount ₹${coupon.minOrderAmount} required` });
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit reached' });
      }

      // Increment usage count
      coupon.usedCount += 1;
      await coupon.save();
    }

    // Validate stock availability first
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for "${product.name}". Available: ${product.stock}` });
      }
    }

    // Check if all products have free shipping
    const products = await Product.find({ _id: { $in: items.map(i => i.product) } });
    const allFreeShipping = products.every(p => p.freeShipping === true);
    
    let finalShippingPrice;
    let shippingChargesPending = false;
    
    if (allFreeShipping) {
      // All products have free shipping toggle ON - FREE delivery, no pending
      finalShippingPrice = 0;
      shippingChargesPending = false;
    } else {
      // At least one product has free shipping toggle OFF - charge shipping but mark as pending for admin review
      finalShippingPrice = shippingPrice; // Use frontend calculated shipping
      shippingChargesPending = true; // Show notice that it will be updated
    }
    
    const finalTotalPrice = itemsPrice + finalShippingPrice - (discount || 0);

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
      shippingPrice: finalShippingPrice,
      shippingChargesPending,
      totalPrice: finalTotalPrice,
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
