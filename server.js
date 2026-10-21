const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected to pacific DB'))
  .catch(err => console.error('MongoDB error:', err));

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
app.use('/api/admin/bookings', adminRoutes);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/search', require('./routes/search'));
app.use('/api/payment', require('./routes/payment'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Pacific backend running on port ${PORT}`));
