const router = require('express').Router();
const Newsletter = require('../models/Newsletter');
const protect = require('../middleware/auth');

// POST /api/newsletter — subscribe
router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    await Newsletter.create({ email });
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Already subscribed' });
    res.status(500).json({ message: e.message });
  }
});

// GET /api/newsletter — admin: get all subscribers
router.get('/', protect, async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
