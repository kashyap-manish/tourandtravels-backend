const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/order
router.post('/order', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/payment/verify — verify payment signature & confirm booking
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ message: 'Payment verification failed' });

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'confirmed', paymentStatus: 'paid', paymentId: razorpay_payment_id },
      { new: true }
    );

    res.json({ success: true, booking });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
