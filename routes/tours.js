const router = require('express').Router();
const mongoose = require('mongoose');
const Tour = require('../models/Tour');
const auth = require('../middleware/auth');

// Get all tours
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: 1 };
    if (category && category !== 'All') filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const tours = await Tour.find(filter);
    res.json(tours);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get single tour by id or slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tour = mongoose.Types.ObjectId.isValid(id)
      ? await Tour.findById(id)
      : await Tour.findOne({ slug: id });
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.json(tour);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
