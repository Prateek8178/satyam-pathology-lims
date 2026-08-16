const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  validate: { trustProxy: false }, // Fix for Render/Heroku proxy
  message: { success: false, message: 'Too many login attempts, please try again later' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  validate: { trustProxy: false }, // Fix for Render/Heroku proxy
  message: { success: false, message: 'Too many requests' }
});

module.exports = { authLimiter, apiLimiter };
