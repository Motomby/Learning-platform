const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@elearning.local';
const NODE_ENV = process.env.NODE_ENV || 'development';

let transporter;
let emailMode = 'unset';

async function createTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });
    emailMode = 'smtp';
    console.info('📧 Email: using configured SMTP transport');
    return transporter;
  }

  if (NODE_ENV === 'production') {
    console.warn('📧 [WARNING] SMTP not configured in production. Falling back to console-only email delivery.');
    console.warn('   Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars to enable real email sending.');
    emailMode = 'console';
    transporter = null;
    return null;
  }

  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  emailMode = 'ethereal';
  console.info('📧 Email: using Nodemailer Ethereal test account (preview URL logged)');
  return transporter;
}

async function sendVerificationEmail(email, fullName, code) {
  const subject = 'E-Learning verification code';
  const text = `Hello ${fullName},

Use this code to verify your email address:

${code}

This code expires in 5 minutes.

If you did not sign up, ignore this email.
`;

  const transport = await createTransporter();

  if (emailMode === 'console' || !transport) {
    console.log('\n══════════════════════════════════════════');
    console.log(`📧 [EMAIL CONSOLE FALLBACK] To: ${email}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Verification Code: ${code}`);
    console.log('   (User must see this code to complete verification)');
    console.log('══════════════════════════════════════════\n');
    return;
  }

  const message = { from: EMAIL_FROM, to: email, subject, text };
  const info = await transport.sendMail(message);

  if (emailMode === 'ethereal') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.info('📧 Email preview URL:', previewUrl);
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeUser(user) {
  const sanitized = user.toJSON();
  delete sanitized.password;
  delete sanitized.verificationCode;
  delete sanitized.verificationCodeExpiresAt;
  return sanitized;
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── REGISTER ───────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const existingUsername = await User.findOne({
      username: { $regex: `^${escapeRegex(trimmedUsername)}$`, $options: 'i' },
    });
    if (existingUsername) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newUser = {
      _id: uuidv4(),
      fullName: fullName.trim(),
      username: trimmedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      bio: '',
      profilePictureUrl: '',
      isVerified: false,
      verificationCode,
      verificationCodeExpiresAt,
    };

    const createdUser = await User.create(newUser);

    await sendVerificationEmail(normalizedEmail, createdUser.fullName, verificationCode);

    res.status(201).json({
      message: 'Account created successfully. Check your email for the verification code.',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+verificationCode +verificationCodeExpiresAt +password'
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification request.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return res.status(400).json({ message: 'Verification code is invalid.' });
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Email verified successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── RESEND VERIFICATION CODE ─────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(normalizedEmail, user.fullName, verificationCode);

    res.json({ message: 'A new verification code has been sent.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your account before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
