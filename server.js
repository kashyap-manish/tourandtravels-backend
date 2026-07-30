const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected to pacific DB'))
  .catch(err => console.error('MongoDB error:', err));

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/profile', require('./routes/profile'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Pacific backend running on port ${PORT}`));
