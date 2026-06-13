const catRouter = require('express').Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// Public — get all categories
catRouter.get('/', async (req, res) => {
  try {
    const cats = await Category.find().sort('name');
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin — create
catRouter.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, image, specifications } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const cat = await Category.create({ name, slug, image: image || '', specifications: specifications || [] });
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ message: err.code === 11000 ? 'Category already exists' : err.message });
  }
});

// Admin — update
catRouter.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, image, specifications } = req.body;
    const update = { image, specifications: specifications || [] };
    if (name) { update.name = name; update.slug = name.toLowerCase().replace(/\s+/g, '-'); }
    const cat = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    cat ? res.json(cat) : res.status(404).json({ message: 'Category not found' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin — delete
catRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = catRouter;
