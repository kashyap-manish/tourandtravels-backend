const router = require('express').Router();
const Review = require('../models/Review');
const Tour = require('../models/Tour');
const auth = require('../middleware/auth');

// Get reviews for a tour
router.get('/:tourId', async (req, res) => {
  try {
    const reviews = await Review.find({ tour: req.params.tourId }).populate('user', 'name avatar');
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Add review
router.post('/:tourId', auth, async (req, res) => {
  try {
    const existing = await Review.findOne({ tour: req.params.tourId, user: req.user.id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this tour' });
    const review = await Review.create({ ...req.body, tour: req.params.tourId, user: req.user.id });

    // update tour rating
    const reviews = await Review.find({ tour: req.params.tourId });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Tour.findByIdAndUpdate(req.params.tourId, { rating: avg.toFixed(1), reviewCount: reviews.length });

    res.status(201).json(review);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
