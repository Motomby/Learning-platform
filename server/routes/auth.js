const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeUser(user) {
  const sanitized = user.toJSON();
  delete sanitized.password;
  return sanitized;
}

// ─── REGISTER ───────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Validate password strength (min 8 chars, 1 uppercase, 1 number)
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    // Check unique email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Check unique username
    const existingUsername = await User.findOne({
      username: { $regex: `^${escapeRegex(trimmedUsername)}$`, $options: 'i' },
    });
    if (existingUsername) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = {
      _id: uuidv4(),
      fullName: fullName.trim(),
      username: trimmedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      bio: '',
      profilePictureUrl: '',
    };

    const createdUser = await User.create(newUser);

    // Generate JWT (expires in 7 days)
    const token = jwt.sign(
      { id: createdUser.id, email: createdUser.email, username: createdUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info (without password) + token
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: sanitizeUser(createdUser),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// POST /api/auth/login
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
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
