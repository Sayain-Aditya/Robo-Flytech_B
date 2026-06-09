const couponRouter = require('express').Router();
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// Validate coupon (public for checkout)
couponRouter.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
    if (!coupon.isActive) return res.status(400).json({ message: 'Coupon is not active' });
    if (coupon.endDate && new Date() > new Date(coupon.endDate)) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }
    if (new Date() < new Date(coupon.startDate)) {
      return res.status(400).json({ message: 'Coupon is not yet active' });
    }
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount ₹${coupon.minOrderAmount} required` });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((orderAmount * coupon.value) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }

    res.json({ 
      valid: true, 
      discount,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all coupons (admin)
couponRouter.get('/', protect, adminOnly, async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json(coupons);
});

// Create coupon (admin)
couponRouter.post('/', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update coupon (admin)
couponRouter.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete coupon (admin)
couponRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = couponRouter;
