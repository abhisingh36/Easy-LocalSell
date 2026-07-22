const mongoose = require('mongoose');
const User     = require('../models/User');
const Listing  = require('../models/Listing');
const Message  = require('../models/Message');
const Conversation = require('../models/Conversation');
const { computeRatingStats } = require('./reviewController');

// ─── Helper ──────────────────────────────────────────────
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

// ─────────────────────────────────────────────────────────
// @desc    Get user profile + dynamic stats
// @route   GET /api/users/:id
// @access  Public
// ─────────────────────────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user._id;

    // ── Listing stats ─────────────────────────────────────
    const allListings = await Listing.find({ seller: userId }).lean();
    const soldCount   = allListings.filter(l => l.sold).length;
    const activeCount = allListings.filter(l => !l.sold).length;

    // ── Real rating from reviews ───────────────────────────
    const { avgRating, reviewCount } = await computeRatingStats(id);

    // ── Response rate from messages ────────────────────────
    // Response rate = % of conversations where the seller has replied at least once
    // to a message that was NOT sent by themselves.
    let responseRate = null;
    try {
      // All conversations where this user is a participant
      const conversations = await Conversation.find({ participants: userId }).lean();
      if (conversations.length > 0) {
        const convIds = conversations.map(c => c._id);

        // Conversations where the user received the FIRST message (they are the seller)
        // i.e., first message in conversation was NOT from this user
        let receivedCount = 0;
        let repliedCount  = 0;

        for (const conv of conversations) {
          // Check if user is not the one who started the conversation
          const firstMsg = await Message.findOne({ conversationId: conv._id })
            .sort({ createdAt: 1 }).lean();
          if (!firstMsg) continue;
          if (String(firstMsg.sender) === String(userId)) continue; // user started it, skip

          receivedCount++;
          // Check if user has replied (has any message as sender in this conv)
          const userReply = await Message.findOne({
            conversationId: conv._id,
            sender: userId,
          }).lean();
          if (userReply) repliedCount++;
        }

        if (receivedCount > 0) {
          responseRate = Math.round((repliedCount / receivedCount) * 100) + '%';
        }
      }
    } catch (e) {
      // Non-critical — don't fail the whole request
      console.warn('[getUserById] response rate compute failed:', e.message);
    }

    // ── Member since ────────────────────────────────────────
    const joinedDate  = user.createdAt ? new Date(user.createdAt) : new Date();
    const joinedYear  = joinedDate.getFullYear();
    const joinedMonth = joinedDate.toLocaleString('en-IN', { month: 'short' });
    const memberSince = `${joinedMonth} ${joinedYear}`;

    res.json({
      _id:       user._id,
      name:      user.name,
      email:     user.email,
      phone:     user.phone || '',
      location:  user.location || '',
      profileImage: user.profileImage || '',
      createdAt: user.createdAt,
      stats: {
        sold:         soldCount,
        active:       activeCount,
        total:        allListings.length,
        rating:       avgRating,        // null if no reviews yet
        reviews:      reviewCount,      // 0 if no reviews yet
        response:     responseRate,     // null if no incoming conversations yet
        memberSince,
        joinedYear,
      },
    });
  } catch (error) {
    console.error('GET /api/users/:id error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get all listings by a specific seller (by their _id)
// @route   GET /api/users/:id/listings
// @access  Public
// ─────────────────────────────────────────────────────────
exports.getUserListings = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const listings = await Listing.find({ seller: id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(listings);
  } catch (error) {
    console.error('GET /api/users/:id/listings error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Public
// ─────────────────────────────────────────────────────────
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { name, location, profileImage } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && typeof name === 'string' && name.trim()) user.name = name.trim();
    // Phone cannot be updated directly as it's a primary identifier
    if (location !== undefined) user.location = location;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      profileImage: user.profileImage,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('PUT /api/users/:id error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Change user password
// @route   PUT /api/users/:id/change-password
// @access  Public
// ─────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Not authorized to change this password' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('PUT /api/users/:id/change-password error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
