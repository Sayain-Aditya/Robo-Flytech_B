const router = require('express').Router();
const HeroSlide = require('../models/HeroSlide');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// Public — active slides ordered
router.get('/', async (req, res) => {
  try {
    const slides = await HeroSlide.find({ active: true }).sort('order');
    res.json(slides);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — all slides
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const slides = await HeroSlide.find().sort('order');
    res.json(slides);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — create
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const slide = await HeroSlide.create(req.body);
    res.status(201).json(slide);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — update
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, { new: true });
    slide ? res.json(slide) : res.status(404).json({ message: 'Slide not found' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await HeroSlide.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
