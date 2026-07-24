const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const User = require('../models/User');

// @desc    Get all reels
// @route   GET /api/reels
// @access  Public
const getReels = async (req, res) => {
  try {
    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .populate('comments.user', 'name profileImage');
    res.json(reels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Upload a new reel
// @route   POST /api/reels
// @access  Private
const uploadReel = async (req, res) => {
  try {
    const { title, listingId } = req.body;
    
    // The video file URL is provided by multer-storage-cloudinary in req.file.path
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a video file' });
    }
    const videoUrl = req.file.path;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let price = 'Featured Deal';
    let tags = [];

    if (listingId) {
      const listing = await Listing.findById(listingId);
      if (listing) {
        price = `₹${listing.price}`;
        tags.push(`#${listing.category}`);
      }
    }

    const reel = await Reel.create({
      seller: req.user.id,
      sellerName: user.name,
      sellerAvatar: user.profileImage || '',
      videoUrl,
      title,
      price,
      listingId: listingId || null,
      tags
    });

    // Add a default like to match initial behaviour
    reel.likes.push(req.user.id);
    await reel.save();

    res.status(201).json(reel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle like on a reel
// @route   PUT /api/reels/:id/like
// @access  Private
const toggleLikeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const isLiked = reel.likes.includes(req.user.id);

    if (isLiked) {
      reel.likes = reel.likes.filter(userId => userId.toString() !== req.user.id);
    } else {
      reel.likes.push(req.user.id);
    }

    await reel.save();
    res.json({ likes: reel.likes.length, isLiked: !isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a reel
// @route   DELETE /api/reels/:id
// @access  Private
const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Check for user
    if (reel.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await reel.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a comment to a reel
// @route   POST /api/reels/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const comment = {
      user: req.user.id,
      text,
      createdAt: new Date()
    };

    reel.comments.push(comment);
    await reel.save();

    await reel.populate('comments.user', 'name profileImage');

    res.status(201).json(reel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getReels,
  uploadReel,
  toggleLikeReel,
  deleteReel,
  addComment
};
