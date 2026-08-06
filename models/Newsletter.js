const { Schema, model } = require('mongoose');

const newsletterSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true });

module.exports = model('Newsletter', newsletterSchema);
