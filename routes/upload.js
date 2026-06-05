const router  = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer  = require('multer');
const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store files in memory as Buffer — no disk, no multer-storage-cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, png and webp images are allowed'));
  },
});

// Upload a single buffer to Cloudinary and return the secure URL
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'robostore/products', transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    );
    stream.end(buffer);
  });

// POST /api/upload/single — returns { url }
router.post('/single', protect, adminOnly, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const url = await uploadToCloudinary(req.file.buffer);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/upload/multiple — returns { urls: [] }
router.post('/multiple', protect, adminOnly, upload.array('images', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'No files uploaded' });
  try {
    const urls = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
