const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');
const User = require('./models/User');

const products = [
  {
    name: 'iPhone 15 Pro',
    description: 'Apple iPhone 15 Pro with A17 Pro chip, titanium design, and 48MP camera system.',
    price: 134900,
    category: 'Phones',
    brand: 'Apple',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1697740423659-0571e7c08b6f?w=400',
    rating: 4.8,
    numReviews: 120,
  },
  {
    name: 'Samsung Galaxy S24',
    description: 'Samsung Galaxy S24 with Snapdragon 8 Gen 3, 50MP camera, and 6.2" Dynamic AMOLED display.',
    price: 79999,
    category: 'Phones',
    brand: 'Samsung',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
    rating: 4.6,
    numReviews: 95,
  },
  {
    name: 'MacBook Air M3',
    description: 'Apple MacBook Air with M3 chip, 15.3-inch Liquid Retina display, and up to 18 hours battery.',
    price: 114900,
    category: 'Laptops',
    brand: 'Apple',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    rating: 4.9,
    numReviews: 80,
  },
  {
    name: 'Dell XPS 15',
    description: 'Dell XPS 15 with Intel Core i7, 16GB RAM, 512GB SSD, and stunning 15.6" OLED display.',
    price: 89999,
    category: 'Laptops',
    brand: 'Dell',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
    rating: 4.5,
    numReviews: 60,
  },
  {
    name: 'iPad Pro 12.9"',
    description: 'Apple iPad Pro with M2 chip, 12.9-inch Liquid Retina XDR display, and Apple Pencil support.',
    price: 99900,
    category: 'Tablets',
    brand: 'Apple',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
    rating: 4.7,
    numReviews: 75,
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Sony WH-1000XM5 wireless noise-cancelling headphones with 30-hour battery and multipoint connection.',
    price: 24990,
    category: 'Audio',
    brand: 'Sony',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    rating: 4.8,
    numReviews: 200,
  },
  {
    name: 'Apple AirPods Pro',
    description: 'Apple AirPods Pro with Active Noise Cancellation, Transparency mode, and MagSafe charging case.',
    price: 24900,
    category: 'Audio',
    brand: 'Apple',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
    rating: 4.7,
    numReviews: 180,
  },
  {
    name: 'Samsung 65" 4K QLED TV',
    description: 'Samsung 65-inch 4K QLED Smart TV with Quantum Processor and HDR support.',
    price: 89999,
    category: 'TVs',
    brand: 'Samsung',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=400',
    rating: 4.6,
    numReviews: 45,
  },
  {
    name: 'Logitech MX Master 3',
    description: 'Logitech MX Master 3 wireless mouse with MagSpeed scroll wheel and multi-device support.',
    price: 7995,
    category: 'Accessories',
    brand: 'Logitech',
    stock: 60,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    rating: 4.8,
    numReviews: 310,
  },
  {
    name: 'Apple Watch Series 9',
    description: 'Apple Watch Series 9 with S9 chip, always-on Retina display, and advanced health sensors.',
    price: 41900,
    category: 'Accessories',
    brand: 'Apple',
    stock: 35,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
    rating: 4.7,
    numReviews: 140,
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  await Product.deleteMany();
  await Product.insertMany(products);
  console.log(`✅ ${products.length} products seeded`);

  // Create admin user
  const adminExists = await User.findOne({ email: 'admin@techstore.com' });
  if (!adminExists) {
    await User.create({
      name: 'Admin',
      email: 'admin@techstore.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin user created: admin@techstore.com / admin123');
  }

  mongoose.disconnect();
  console.log('Done!');
};

seed().catch(err => { console.error(err); process.exit(1); });
