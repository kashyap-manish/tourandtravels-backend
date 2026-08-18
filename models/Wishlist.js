const { Schema, model } = require('mongoose');

const wishlistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tours: [{ type: Schema.Types.ObjectId, ref: 'Tour' }],
  hotels: [{
    id:       { type: String, required: true },
    title:    String,
    img:      String,
    price:    String,
    location: String,
    stars:    Number,
    website:  String,
  }],
}, { timestamps: true });

module.exports = model('Wishlist', wishlistSchema);
