const router = require('express').Router();
const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Tour = require('../models/Tour');
const auth = require('../middleware/auth');

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const sendStatusEmail = async (booking, title, status) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return;
  const isConfirmed = status === 'confirmed';
  const dateStr = booking.travelDate
    ? new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';
  await transporter.sendMail({
    from: `"Pacific Travel" <${process.env.MAIL_USER}>`,
    to: booking.email,
    subject: `Booking ${isConfirmed ? 'Confirmed ✅' : 'Cancelled ❌'} – ${title} | Pacific Travel`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
        <div style="background:${isConfirmed ? '#f97316' : '#ef4444'};padding:28px 32px">
          <h1 style="color:#fff;margin:0;font-size:22px">${isConfirmed ? '🎉 Booking Confirmed!' : '❌ Booking Cancelled'}</h1>
          <p style="color:${isConfirmed ? '#ffe0c2' : '#fecaca'};margin:6px 0 0">Pacific Travel Agency</p>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#333;font-size:15px">Hi <strong>${booking.name}</strong>,</p>
          <p style="color:#555">${isConfirmed
            ? 'Great news! Your booking has been <strong>confirmed</strong> by our team.'
            : 'We regret to inform you that your booking has been <strong>cancelled</strong>. Please contact support for assistance.'
          }</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
            <tr style="background:#fff7ed">
              <td style="padding:10px 14px;color:#888;font-weight:600">Booking</td>
              <td style="padding:10px 14px;color:#111;font-weight:700">${title}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600">Date</td>
              <td style="padding:10px 14px;color:#111">${dateStr}</td>
            </tr>
            <tr style="background:#fff7ed">
              <td style="padding:10px 14px;color:#888;font-weight:600">Total Amount</td>
              <td style="padding:10px 14px;color:#f97316;font-weight:700">₹${Number(booking.totalPrice).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#888;font-weight:600">Status</td>
              <td style="padding:10px 14px;font-weight:700;color:${isConfirmed ? '#16a34a' : '#dc2626'};text-transform:capitalize">${status}</td>
            </tr>
            <tr style="background:#fff7ed">
              <td style="padding:10px 14px;color:#888;font-weight:600">Booking ID</td>
              <td style="padding:10px 14px;color:#111;font-size:12px">${booking._id}</td>
            </tr>
          </table>
          <p style="color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">Pacific Travel Agency &nbsp;|&nbsp; Automated notification.</p>
        </div>
      </div>
    `,
  });
};

// ─── BOOKINGS ───────────────────────────────────────────────────────────────

const getBookingsHandler = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { origin: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { operator: { $regex: search, $options: 'i' } },
        { trainName: { $regex: search, $options: 'i' } },
      ];
    }
    const bookings = await Booking.find(filter)
      .populate('tour', 'title img days price location')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ bookings, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const updateBookingStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('tour', 'title')
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const title = booking.tour?.title
      || (booking.origin && booking.destination ? `${booking.origin} → ${booking.destination}` : null)
      || booking.operator
      || booking.trainName
      || 'Pacific Booking';

    sendStatusEmail(booking, title, status).catch(err => console.error('Mail error:', err.message));
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Support both /bookings and / for bookings
router.get('/bookings', auth, isAdmin, getBookingsHandler);
router.get('/', auth, isAdmin, getBookingsHandler);

router.put('/bookings/:id/status', auth, isAdmin, updateBookingStatusHandler);
router.put('/:id/status', auth, isAdmin, updateBookingStatusHandler);

router.delete('/bookings/:id', auth, isAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── USERS ──────────────────────────────────────────────────────────────────

router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/users/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status: Number(status) }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/users/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── TOURS ──────────────────────────────────────────────────────────────────

router.get('/tours', auth, isAdmin, async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    res.json(tours);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/tours', auth, isAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    }
    const tour = await Tour.create(data);
    res.status(201).json(tour);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/tours/:id', auth, isAdmin, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.json(tour);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/tours/:id', auth, isAdmin, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.json({ message: 'Tour deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DASHBOARD STATS ────────────────────────────────────────────────────────

router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const [totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalUsers, totalTours, allBookings] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'cancelled' }),
      User.countDocuments(),
      Tour.countDocuments(),
      Booking.find({ status: 'confirmed' }).select('totalPrice createdAt type aadhaarVerified'),
    ]);

    const totalRevenue = allBookings.reduce((sum, b) => {
      const val = parseFloat(String(b.totalPrice).replace(/[^0-9.]/g, '')) || 0;
      return sum + val;
    }, 0);

    const aadhaarVerifiedCount = await Booking.countDocuments({ aadhaarVerified: true });

    res.json({
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalUsers,
      totalTours,
      totalRevenue,
      aadhaarVerifiedCount,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
