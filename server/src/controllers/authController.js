const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/username and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
        { mobile: identifier }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role !== 'SUPER_ADMIN') {
      if (user.approvalStatus === 'pending') {
        return res.status(401).json({ success: false, message: 'Your account is pending approval from the Super Admin.' });
      }
      if (user.approvalStatus === 'rejected') {
        return res.status(401).json({ success: false, message: 'Your account registration was rejected. Please contact the administrator.' });
      }
      if (user.isActive === false) {
        return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
      }
    } else {
      if (user.isActive === false) {
        return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username, fullName: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      user,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      ip: req.ip
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      data: { token, user: userObj },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const registerTechnician = async (req, res) => {
  try {
    const { fullName, email, username, mobile, password, confirmPassword } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const exists = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (exists) {
      const field = exists.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} is already registered` });
    }

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      mobile,
      password,
      role: 'LAB_TECHNICIAN',
      approvalStatus: 'pending',
      isActive: true
    });

    await createAuditLog({
      user,
      action: 'REGISTER',
      entity: 'User',
      entityId: user._id,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      pending: true,
      message: 'Registration submitted. Please wait for Super Admin approval before you can login.'
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} is already registered` });
    }
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
  }
};

const logout = async (req, res) => {
  try {
    await createAuditLog({
      user: req.user,
      action: 'LOGOUT',
      entity: 'User',
      entityId: req.user._id,
      ip: req.ip
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 12);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:5173/reset-password?token=${rawToken}&email=${user.email}`;

    res.json({ 
      success: true, 
      resetUrl, 
      message: 'Use this link to reset your password (valid for 1 hour)' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token, email, and new password are required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase()
    }).select('+resetPasswordToken +resetPasswordExpiry');

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (Date.now() > user.resetPasswordExpiry) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    const isMatch = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    await createAuditLog({
      user,
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user._id,
      ip: req.ip
    });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both old and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    user.password = newPassword;
    await user.save();

    await createAuditLog({
      user: req.user,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: req.user._id,
      ip: req.ip
    });

    res.json({ success: true, message: 'Password successfully changed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, registerTechnician, logout, forgotPassword, resetPassword, changePassword, getMe };
