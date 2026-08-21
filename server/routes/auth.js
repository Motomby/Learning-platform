const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Resend } = require('resend');
require('dotenv').config();
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || 'local-dev-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const NODE_ENV = process.env.NODE_ENV || 'development';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;



async function sendVerificationEmail(email, fullName, code) {
  const subject = 'Your LearnHub Verification Code';
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">LearnHub</h1>
      </div>
      <h2 style="color: #18181b; font-size: 20px; margin-bottom: 12px;">Hello ${fullName},</h2>
      <p style="color: #52525b; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        Thank you for joining LearnHub! Please use the 6-digit verification code below to complete your registration:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="background-color: #eef2ff; color: #4f46e5; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 14px 28px; border-radius: 8px; border: 1px solid #c7d2fe; display: inline-block;">
          ${code}
        </span>
      </div>
      <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
        This code is valid for <strong>5 minutes</strong>. If you did not request this email, please ignore it.
      </p>
      <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;" />
      <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
        © 2026 LearnHub. All rights reserved.
      </p>
    </div>
  `;
  const text = `Hello ${fullName},\n\nYour LearnHub verification code is: ${code}\n\nThis code expires in 5 minutes.\nIf you did not request this email, please ignore it.`;

  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY is not set in environment.');
    console.log('\n══════════════════════════════════════════');
    console.log(`📧 [CONSOLE FALLBACK] Verification Code for ${email}: ${code}`);
    console.log('══════════════════════════════════════════\n');
    return;
  }

  try {

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: subject,
      html: html,
      text: text,
    });

    if (data.error) {
      console.error('❌ Resend API Error:', data.error);
      console.log('\n══════════════════════════════════════════');
      console.log(`📧 [CONSOLE FALLBACK] Verification Code for ${email}: ${code}`);
      console.log('══════════════════════════════════════════\n');
    } else {
      console.info(`📧 Verification email sent successfully to ${email} via Resend`);
    }
  } catch (err) {
    console.error('❌ Error sending email via Resend:', err);
    console.log('\n══════════════════════════════════════════');
    console.log(`📧 [CONSOLE FALLBACK] Verification Code for ${email}: ${code}`);
    console.log('══════════════════════════════════════════\n');
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
      ...(NODE_ENV !== 'production' ? { devVerificationCode: verificationCode } : {}),
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

    res.json({
      message: 'A new verification code has been sent.',
      ...(NODE_ENV !== 'production' ? { devVerificationCode: verificationCode } : {}),
    });
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
      return res.status(403).json({
        message: 'Email not verified. Please verify your account before logging in.',
        isVerified: false,
        email: user.email,
      });
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
