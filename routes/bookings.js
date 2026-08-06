const router = require('express').Router();
const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const sendBookingConfirmation = async (booking, tourTitle) => {
  const date = new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  await transporter.sendMail({
    from: `"Pacific Travel" <${process.env.MAIL_USER}>`,
    to: booking.email,
    subject: `Booking Confirmed – ${tourTitle} | Pacific Travel`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
        <div style="background:#f97316;padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px">Booking Confirmed! 🎉</h1>
          <p style="color:#ffe0c2;margin:6px 0 0">Thank you for booking with Pacific Travel</p>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#333;font-size:15px">Hi <strong>${booking.name}</strong>,</p>
          <p style="color:#555">Your booking has been <strong>confirmed</strong>. Here are your details:</p>

          <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
            <tr style="background:#fff7ed">
              <td style="padding:10px 14px;color:#888;font-weight:600">Tour</td>
              <td style="padding:10px 14px;color:#111;font-weight:700">${tourTitle}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600">Travel Date</td>
              <td style="padding:10px 14px;color:#111">${date}</td>
            </tr>
            <tr style="background:#fff7ed">
              <td style="padding:10px 14px;color:#888;font-weight:600">Persons</td>
              <td style="padding:10px 14px;color:#111">${booking.persons}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600">Total Amount</td>
              <td style="padding:10px 14px;color:#f97316;font-weight:700;font-size:16px">₹${Number(booking.totalPrice).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background:#fff7ed">
              <td style="padding:10px 14px;color:#888;font-weight:600">Payment Method</td>
              <td style="padding:10px 14px;color:#111;text-transform:capitalize">${booking.paymentMethod || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600">Booking ID</td>
              <td style="padding:10px 14px;color:#111;font-size:12px">${booking._id}</td>
            </tr>
          </table>

          ${booking.specialRequests ? `<p style="background:#f9fafb;border-left:3px solid #f97316;padding:10px 14px;color:#555;font-size:13px"><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}

          <p style="color:#555;font-size:13px;margin-top:20px">Our team will contact you shortly to confirm the final details. If you have any questions, feel free to reach out.</p>
          <p style="color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">Pacific Travel Agency &nbsp;|&nbsp; This is an automated email, please do not reply.</p>
        </div>
      </div>
    `,
  });
};

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    let { tour, tourSlug, ...rest } = req.body;
    let tourTitle = 'Your Tour';
    if (!tour && tourSlug) {
      const Tour = require('../models/Tour');
      const found = await Tour.findOne({ slug: tourSlug });
      if (!found) return res.status(404).json({ message: 'Tour not found' });
      tour = found._id;
      tourTitle = found.title;
    } else if (tour) {
      const Tour = require('../models/Tour');
      const found = await Tour.findById(tour).select('title');
      if (found) tourTitle = found.title;
    }
    const booking = await Booking.create({ ...rest, tour, user: req.user.id });
    sendBookingConfirmation(booking, tourTitle).catch(err => console.error('Mail error:', err.message));
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get my bookings
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('tour', 'title img days price');
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id }).populate('tour');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
