const { Schema, model } = require('mongoose');

const wishlistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tours: [{ type: Schema.Types.ObjectId, ref: 'Tour' }],
}, { timestamps: true });

module.exports = model('Wishlist', wishlistSchema);
