const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  googleAuth,
} = require('../controllers/authController');

// Signup flow (3 steps)
router.post('/send-otp',    sendOtp);      // Step 1: Send email OTP
router.post('/verify-otp',  verifyOtp);    // Step 2: Verify email OTP
router.post('/signup',      signup);       // Step 3: Create account

// Login
router.post('/login', login);
router.post('/google', googleAuth);

// Password recovery
router.post('/forgot-password', forgotPassword);  // Send reset OTP
router.post('/reset-password',  resetPassword);   // Verify OTP + set new password

module.exports = router;
