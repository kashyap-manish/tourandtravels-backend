const { Schema, model } = require('mongoose');

const bookingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
  persons: { type: Number, required: true, min: 1 },
  totalPrice: { type: String, required: true },
  travelDate: { type: Date, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  specialRequests: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
}, { timestamps: true });

module.exports = model('Booking', bookingSchema);
