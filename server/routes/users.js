const express = require('express');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

function sanitizeUser(user) {
  const sanitized = user.toJSON();
  delete sanitized.password;
  return sanitized;
}

// ─── GET CURRENT USER PROFILE ────────────────────────────────────────────────
// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
// PUT /api/users/me
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { fullName, bio, profilePictureUrl } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Only allow updating specific fields
    if (fullName !== undefined) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (profilePictureUrl !== undefined) user.profilePictureUrl = profilePictureUrl.trim();

    await user.save();

    res.json({
      message: 'Profile updated successfully!',
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────
// PUT /api/users/me/password
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Ensure new password is different
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from your current password.' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully! Please log in again.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
