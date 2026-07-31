const router = require('express').Router();
const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const sendStatusEmail = async (booking, tourTitle, status) => {
  const isConfirmed = status === 'confirmed';
  const date = new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  await transporter.sendMail({
    from: `"Pacific Travel" <${process.env.MAIL_USER}>`,
    to: booking.email,
    subject: `Booking ${isConfirmed ? 'Confirmed ✅' : 'Cancelled ❌'} – ${tourTitle} | Pacific Travel`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
        <div style="background:${isConfirmed ? '#f97316' : '#ef4444'};padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px">${isConfirmed ? '🎉 Booking Confirmed!' : '❌ Booking Cancelled'}</h1>
          <p style="color:${isConfirmed ? '#ffe0c2' : '#fecaca'};margin:6px 0 0">Pacific Travel Agency</p>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#333;font-size:15px">Hi <strong>${booking.name}</strong>,</p>
          <p style="color:#555">${isConfirmed
            ? 'Great news! Your booking has been <strong>confirmed</strong> by our team. Get ready for an amazing trip!'
            : 'We regret to inform you that your booking has been <strong>cancelled</strong>. Please contact us for more details.'
          }</p>
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
              <td style="padding:10px 14px;color:#f97316;font-weight:700">₹${Number(booking.totalPrice).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background:#fff7ed">
              <td style="padding:10px 14px;color:#888;font-weight:600">Status</td>
              <td style="padding:10px 14px;font-weight:700;color:${isConfirmed ? '#16a34a' : '#dc2626'};text-transform:capitalize">${status}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600">Booking ID</td>
              <td style="padding:10px 14px;color:#111;font-size:12px">${booking._id}</td>
            </tr>
          </table>
          <p style="color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">Pacific Travel Agency &nbsp;|&nbsp; This is an automated email, please do not reply.</p>
        </div>
      </div>
    `,
  });
};

// Get all bookings (admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const bookings = await Booking.find(filter)
      .populate('tour', 'title img days price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ bookings, total });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update booking status (admin)
router.put('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('tour', 'title');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const tourTitle = booking.tour?.title || 'Your Tour';
    sendStatusEmail(booking, tourTitle, status).catch(err => console.error('Mail error:', err.message));
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
