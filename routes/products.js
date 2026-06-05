const proRouter = require('express').Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// Public
proRouter.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (req.query.brand) query.brand = { $in: req.query.brand.split(',') };
    if (req.query.maxPrice) query.price = { $lte: Number(req.query.maxPrice) };
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ products, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

proRouter.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    p ? res.json(p) : res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public — dynamic filter options from real data
proRouter.get('/meta/filters', async (req, res) => {
  try {
    const [categories, brands, priceRange] = await Promise.all([
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Product.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Product.aggregate([
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
      ])
    ]);
    res.json({
      categories: categories.map(c => ({ name: c._id, count: c.count })),
      brands: brands.map(b => ({ name: b._id, count: b.count })),
      priceRange: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max } : { min: 0, max: 100000 }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin only
proRouter.post('/', protect, adminOnly, async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

proRouter.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    p ? res.json(p) : res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

proRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = proRouter;
