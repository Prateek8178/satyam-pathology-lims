const express = require('express');
const router = express.Router();
const { login, registerTechnician, logout, forgotPassword, resetPassword, changePassword, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, registerTechnician);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.post('/logout', verifyToken, logout);
router.post('/change-password', verifyToken, changePassword);
router.get('/me', verifyToken, getMe);

// Change username (SUPER_ADMIN or any logged-in user)
router.patch('/change-username', verifyToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const { newUsername } = req.body;
    if (!newUsername || newUsername.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    const clean = newUsername.trim().toLowerCase().replace(/\s/g, '');
    const existing = await User.findOne({ username: clean, _id: { $ne: req.user._id } });
    if (existing) return res.status(409).json({ success: false, message: 'Username already taken' });
    await User.findByIdAndUpdate(req.user._id, { username: clean });
    res.json({ success: true, message: `Username updated to "${clean}"` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

