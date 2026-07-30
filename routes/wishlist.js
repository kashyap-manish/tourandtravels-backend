const router = require('express').Router();
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/auth');

// Get wishlist
router.get('/', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('tours', 'title img price days location');
    res.json(wishlist || { tours: [] });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Toggle tour in wishlist
router.post('/toggle/:tourId', auth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user.id, tours: [] });
    const idx = wishlist.tours.indexOf(req.params.tourId);
    if (idx > -1) wishlist.tours.splice(idx, 1);
    else wishlist.tours.push(req.params.tourId);
    await wishlist.save();
    res.json(wishlist);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
