const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.$text = { $search: req.query.search };

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .skip(skip)
        .limit(limit)
        .select('name price originalPrice image rating category brand stock createdAt')
        .lean(),
    ]);

    res.json({
      page,
      pages: Math.ceil(total / limit),
      total,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
