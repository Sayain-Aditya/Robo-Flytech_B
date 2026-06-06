const router = require('express').Router();
const Address = require('../models/Address');
const { protect } = require('../middleware/auth');

// GET all addresses for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const doc = await Address.findOne({ user: req.user._id });
    res.json(doc ? doc.addresses : []);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add a new address
router.post('/', protect, async (req, res) => {
  try {
    const { fullName, phone, address, city, pin, country } = req.body;
    if (!fullName || !phone || !address || !city || !pin) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const doc = await Address.findOneAndUpdate(
      { user: req.user._id },
      { $push: { addresses: { fullName, phone, address, city, pin, country: country || 'India' } } },
      { new: true, upsert: true }
    );
    res.status(201).json(doc.addresses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE a specific address by its _id
router.delete('/:addressId', protect, async (req, res) => {
  try {
    const doc = await Address.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    );
    res.json(doc ? doc.addresses : []);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update a specific address by its _id
router.put('/:addressId', protect, async (req, res) => {
  try {
    const { fullName, phone, address, city, pin, country } = req.body;
    const doc = await Address.findOneAndUpdate(
      { user: req.user._id, 'addresses._id': req.params.addressId },
      { $set: { 'addresses.$.fullName': fullName, 'addresses.$.phone': phone, 'addresses.$.address': address, 'addresses.$.city': city, 'addresses.$.pin': pin, 'addresses.$.country': country || 'India' } },
      { new: true }
    );
    res.json(doc ? doc.addresses : []);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
