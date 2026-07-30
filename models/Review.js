const { Schema, model } = require('mongoose');

const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

module.exports = model('Review', reviewSchema);
