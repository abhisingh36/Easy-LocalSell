const User = require('../models/User');
const jwt = require('jsonwebtoken');
const otpService = require('../utils/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'easy-marketplace-secret-key-2024';
const JWT_EXPIRES = '30d';

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ─── In-Memory Stores ────────────────────────────────────────────
// Key: normalized email → { emailOtp, phone, expiresAt, verified }
const otpStore = new Map();

// Key: normalized email → { otp, userId, expiresAt }
const resetStore = new Map();

// Dev mode: no real email configured
const isDevMode = () => !process.env.EMAIL_USER;

// Normalize helpers
const normalizeEmail = (s) => (s || '').toLowerCase().trim();
const normalizePhone = (s) => (s || '').replace(/[\s\-\(\)\+]/g, '').replace(/^91(\d{10})$/, '$1');

// ─────────────────────────────────────────────────────────────────
// @desc    Send email OTP (Step 1 of signup)
// @route   POST /api/auth/send-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const ne = normalizeEmail(email);
    const np = normalizePhone(phone);

    if (!ne || !np) {
      return res.status(400).json({ message: 'Email and phone number are required' });
    }

    // Check existing accounts in parallel
    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email: ne }),
      User.findOne({ phone: np }),
    ]);
    if (emailExists) return res.status(400).json({ message: 'This email is already registered. Please log in instead.' });
    if (phoneExists) return res.status(400).json({ message: 'This phone number is already registered.' });

    const emailOtp = otpService.generateOTP();

    // Store OTP keyed by email (10-min expiry)
    otpStore.set(ne, {
      emailOtp,
      phone: np,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    });

    await otpService.sendEmailOTP(ne, emailOtp);

    const response = { message: 'Verification code sent to your email' };
    // In dev mode, include OTP in response so frontend can display it
    if (isDevMode()) response.devOtp = emailOtp;

    res.status(200).json(response);
  } catch (error) {
    console.error('[sendOtp]', error);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Verify email OTP (Step 2 of signup)
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, emailOtp } = req.body;
    const ne = normalizeEmail(email);

    if (!ne || !emailOtp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const stored = otpStore.get(ne);
    if (!stored) {
      return res.status(400).json({ message: 'Code expired or never sent. Please go back and resend.' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(ne);
      return res.status(400).json({ message: 'Code has expired. Please resend.' });
    }
    if (stored.emailOtp !== emailOtp.trim()) {
      return res.status(400).json({ message: 'Incorrect code. Please check your email and try again.' });
    }

    stored.verified = true;
    otpStore.set(ne, stored);

    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('[verifyOtp]', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Complete registration (Step 3 of signup)
// @route   POST /api/auth/signup
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, location } = req.body;
    const ne = normalizeEmail(email);
    const np = normalizePhone(phone);

    if (!name?.trim() || !ne || !np || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Email must be verified
    const stored = otpStore.get(ne);
    if (!stored?.verified) {
      return res.status(400).json({ message: 'Please verify your email first. Go back to Step 1.' });
    }

    // Final duplicate check (handles race conditions)
    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email: ne }),
      User.findOne({ phone: np }),
    ]);
    if (emailExists) { otpStore.delete(ne); return res.status(400).json({ message: 'This email is already registered.' }); }
    if (phoneExists) return res.status(400).json({ message: 'This phone number is already registered.' });

    const user = await User.create({
      name: name.trim(),
      email: ne,
      phone: np,
      password,
      location: location?.trim() || 'Lucknow, India',
    });

    otpStore.delete(ne);
    const token = signToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      profileImage: user.profileImage,
      token,
    });
  } catch (error) {
    console.error('[signup]', error);
    res.status(500).json({ message: 'Account creation failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Login with email/phone + password
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide your email/phone and password' });
    }

    // Normalize: lowercase + strip phone punctuation
    const id = identifier.toLowerCase().trim().replace(/[\s\-\(\)]/g, '');

    const user = await User.findOne({
      $or: [{ email: id }, { phone: id }],
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email/phone or password.' });
    }

    const token = signToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      location: user.location || 'Lucknow, India',
      profileImage: user.profileImage,
      token,
    });
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Request password reset — sends OTP to registered email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const ne = normalizeEmail(email);

    if (!ne) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: ne });

    if (user) {
      const otp = otpService.generateOTP();
      resetStore.set(ne, {
        otp,
        userId: user._id,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      await otpService.sendPasswordResetOTP(ne, otp);
    }

    // Always respond the same to prevent email enumeration attacks
    const response = { message: 'If an account with this email exists, a reset code has been sent.' };
    if (isDevMode() && user) response.devOtp = resetStore.get(ne)?.otp;

    res.status(200).json(response);
  } catch (error) {
    console.error('[forgotPassword]', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Reset password with OTP + new password
// @route   POST /api/auth/reset-password
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const ne = normalizeEmail(email);

    if (!ne || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const data = resetStore.get(ne);
    if (!data) {
      return res.status(400).json({ message: 'Reset code not found or expired. Please request a new one.' });
    }
    if (Date.now() > data.expiresAt) {
      resetStore.delete(ne);
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }
    if (data.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect reset code. Please try again.' });
    }

    const user = await User.findById(data.userId);
    if (!user) return res.status(404).json({ message: 'Account not found.' });

    user.password = newPassword;
    await user.save(); // pre-save hook hashes the password

    resetStore.delete(ne);
    res.status(200).json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (error) {
    console.error('[resetPassword]', error);
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Google OAuth Login / Signup
// @route   POST /api/auth/google
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { name, email, profileImage, credential } = req.body;
    let userEmail = normalizeEmail(email);
    let userName = name?.trim();
    let userImage = profileImage || "";

    // If credential JWT token is passed from Google Identity Services:
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.email) userEmail = normalizeEmail(payload.email);
          if (payload.name) userName = payload.name;
          if (payload.picture) userImage = payload.picture;
        }
      } catch (e) {
        console.warn('Failed to parse Google credential JWT:', e.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'Google account email is required' });
    }

    let user = await User.findOne({ email: userEmail });

    if (!user) {
      // Create a new user for Google login
      const dummyPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      user = await User.create({
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        password: dummyPassword,
        location: 'Hazratganj, Lucknow',
        profileImage: userImage,
      });
    } else {
      // Update profileImage if user didn't have one and Google provided one
      if (userImage && !user.profileImage) {
        user.profileImage = userImage;
        await user.save();
      }
    }

    const token = signToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      location: user.location || 'Hazratganj, Lucknow',
      profileImage: user.profileImage || '',
      token,
    });
  } catch (error) {
    console.error('[googleAuth]', error);
    res.status(500).json({ message: 'Google authentication failed. Please try again.' });
  }
};
