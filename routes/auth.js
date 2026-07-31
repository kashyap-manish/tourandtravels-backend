const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const sendOtp = async (email, otp) => {
  await transporter.sendMail({
    from: `"Pacific Travel" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Verify your email – Pacific Travel',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#f97316;margin-bottom:8px">Email Verification</h2>
        <p style="color:#555">Use the OTP below to verify your email. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#111;text-align:center;padding:24px 0">${otp}</div>
        <p style="color:#aaa;font-size:12px">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
};

// Register
router.post('/register/customer', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await User.create({ name, email, password: hashed, verifyOtp: otp, verifyOtpExpiry: expiry });
    await sendOtp(email, otp);
    res.status(201).json({ message: 'OTP sent to your email' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Verify OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });
    if (user.verifyOtp !== otp || user.verifyOtpExpiry < new Date())
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    user.emailVerified = true;
    user.verifyOtp = null;
    user.verifyOtpExpiry = null;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyOtp = otp;
    user.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOtp(email, otp);
    res.json({ message: 'OTP resent' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Login
router.post('/login/customer', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid email or password' });
    if (!user.emailVerified)
      return res.status(403).json({ message: 'Please verify your email before logging in', unverified: true });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
