const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: Number, default: 1 },
  emailVerified: { type: Boolean, default: false },
  verifyOtp: { type: String, default: null },
  verifyOtpExpiry: { type: Date, default: null },
}, { timestamps: true });

module.exports = model('User', userSchema);
