require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await User.updateOne(
    { email: 'kumarthakurmanish1999@gmail.com' },
    { $set: { role: 'admin', emailVerified: true } }
  );
  if (result.matchedCount === 0) {
    console.log('❌ User not found. Please register first at /register');
  } else {
    console.log('✅ User is now admin and email verified!');
  }
  mongoose.disconnect();
}).catch(err => console.error('DB Error:', err));
