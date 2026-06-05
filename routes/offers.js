const offerRouter = require('express').Router();
const Offer = require('../models/Offer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// Helper — compute discounted price
function applyOffer(price, offer) {
  if (offer.type === 'percentage') return Math.round(price * (1 - offer.value / 100));
  if (offer.type === 'flat')       return Math.max(0, price - offer.value);
  return price;
}

// Public — get all active offers right now
offerRouter.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({ active: true, startDate: { $lte: now }, endDate: { $gte: now } });
    res.json(offers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Public — get products with offer prices applied
offerRouter.get('/products-with-offers', async (req, res) => {
  try {
    const now = new Date();
    const limit  = parseInt(req.query.limit)  || 0;
    const sort   = req.query.sort === 'newest' ? { createdAt: -1 } : {};

    const [products, offers] = await Promise.all([
      Product.find().sort(sort).limit(limit),
      Offer.find({ active: true, startDate: { $lte: now }, endDate: { $gte: now } }).populate('products', '_id')
    ]);

    const result = products.map(p => {
      const prod = p.toObject();
      const applicable = offers.filter(o => {
        if (o.scope === 'all') return true;
        if (o.scope === 'category') return o.categories.includes(p.category);
        if (o.scope === 'products') return o.products.some(op => op._id.toString() === p._id.toString());
        return false;
      });
      if (applicable.length > 0) {
        const best = applicable.reduce((prev, cur) => {
          const prevSave = prev.type === 'percentage' ? p.price * prev.value / 100 : prev.value;
          const curSave  = cur.type  === 'percentage' ? p.price * cur.value  / 100 : cur.value;
          return curSave > prevSave ? cur : prev;
        });
        prod.offerPrice    = applyOffer(p.price, best);
        prod.offerBadge    = best.badge || best.name;
        prod.offerDiscount = best.type === 'percentage' ? `${best.value}% OFF` : `₹${best.value} OFF`;
        prod.originalPrice = prod.originalPrice || p.price;
      }
      return prod;
    });
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — get all offers
offerRouter.get('/', protect, adminOnly, async (req, res) => {
  try {
    const offers = await Offer.find().populate('products', 'name').sort('-createdAt');
    res.json(offers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — create offer
offerRouter.post('/', protect, adminOnly, async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json(offer);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — update offer
offerRouter.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    offer ? res.json(offer) : res.status(404).json({ message: 'Offer not found' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — delete offer
offerRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offer deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = offerRouter;
