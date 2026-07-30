const { Schema, model } = require('mongoose');

const tourSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  img: { type: String, default: '' },
  price: { type: String, required: true },
  days: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['Culture', 'Beach', 'Nature', 'Adventure', 'Camping', 'Party'], default: 'Culture' },
  description: { type: String, default: '' },
  features: [String],
  highlights: [String],
  includes: [String],
  itinerary: [{ day: Number, title: String, desc: String }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = model('Tour', tourSchema);
