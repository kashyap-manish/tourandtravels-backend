const { Schema, model } = require('mongoose');

const bookingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['tour', 'bus', 'train', 'hotel', 'flight'], default: 'tour' },
  tour: { type: Schema.Types.ObjectId, ref: 'Tour' },
  origin: { type: String, default: '' },
  destination: { type: String, default: '' },
  operator: { type: String, default: '' },
  trainName: { type: String, default: '' },
  trainNo: { type: String, default: '' },
  busClass: { type: String, default: '' },
  departure: { type: String, default: '' },
  arrival: { type: String, default: '' },
  duration: { type: String, default: '' },
  distanceKm: { type: Number, default: 0 },
  station: { type: String, default: '' },
  seat: { type: Schema.Types.Mixed, default: null },
  passengers: { type: Number, default: 1 },
  aadhaarVerified: { type: Boolean, default: false },
  persons: { type: Number, default: 1 },
  totalPrice: { type: Schema.Types.Mixed, required: true },
  travelDate: { type: Date, default: Date.now },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  specialRequests: { type: String, default: '' },
  paymentMethod: { type: String, default: 'online' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'paid' },
  paymentId: { type: String, default: '' },
}, { timestamps: true });

module.exports = model('Booking', bookingSchema);
