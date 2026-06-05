const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();
const app = express();

connectDB();

// Security & performance middlewares
app.use(helmet());
app.use(compression());
const allowedOrigins = [
  'http://localhost:3000',
  'https://robo-flytech-b.vercel.app',
  'https://robo-fly-tech.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Basic rate limiting for protection, but allow realistic traffic levels
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
	})
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/offers',     require('./routes/offers'));
app.use('/api/upload',     require('./routes/upload'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
