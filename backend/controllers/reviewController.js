const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Listing  = require('../models/Listing');
const User     = require('../models/User');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─────────────────────────────────────────────────────────────────
// @desc    Get all reviews for a seller
// @route   GET /api/reviews/seller/:sellerId
// @access  Public
// ─────────────────────────────────────────────────────────────────
exports.getReviewsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Accept both ObjectId and legacy string seller IDs
    const query = isValidObjectId(sellerId)
      ? { $or: [{ seller: new mongoose.Types.ObjectId(sellerId) }, { seller: sellerId }] }
      : { seller: sellerId };

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(reviews);
  } catch (error) {
    console.error('[getReviewsBySeller]', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Post a review for a seller
// @route   POST /api/reviews
// @access  Private (reviewer must be logged in)
// Body: { reviewerId, reviewerName, sellerId, listingId?, rating, text }
// ─────────────────────────────────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    const { reviewerId, reviewerName, sellerId, listingId, rating, text } = req.body;

    if (!reviewerId || !reviewerName || !sellerId || !rating) {
      return res.status(400).json({ message: 'reviewerId, reviewerName, sellerId, and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (String(req.user.id) !== String(reviewerId)) {
      return res.status(403).json({ message: 'Not authorized to create review as this user' });
    }

    // Reviewer cannot review themselves
    if (String(reviewerId) === String(sellerId)) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    // Verify reviewer exists
    if (!isValidObjectId(reviewerId)) {
      return res.status(400).json({ message: 'Invalid reviewer ID' });
    }
    const reviewer = await User.findById(reviewerId).lean();
    if (!reviewer) return res.status(404).json({ message: 'Reviewer not found' });

    // Fetch listing title if listingId provided
    let listingTitle = '';
    let resolvedListingId = null;
    if (listingId && isValidObjectId(listingId)) {
      const listing = await Listing.findById(listingId).lean();
      if (listing) {
        listingTitle = listing.title;
        resolvedListingId = listing._id;
      }
    }

    // Check for duplicate review on same listing by same reviewer
    if (resolvedListingId) {
      const existing = await Review.findOne({ reviewer: reviewerId, listing: resolvedListingId });
      if (existing) {
        return res.status(409).json({ message: 'You have already reviewed this listing' });
      }
    }

    const review = await Review.create({
      reviewer:        reviewerId,
      reviewerName:    reviewerName.trim(),
      reviewerInitials: getInitials(reviewerName),
      seller:          sellerId,
      listing:         resolvedListingId,
      listingTitle,
      rating:          Number(rating),
      text:            (text || '').trim(),
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this listing' });
    }
    console.error('[createReview]', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Delete a review (reviewer can delete their own)
// @route   DELETE /api/reviews/:id
// @access  Private
// Body: { reviewerId }
// ─────────────────────────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (String(review.reviewer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('[deleteReview]', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// Helper (used by userController): Compute rating stats for a seller
// Returns: { avgRating, reviewCount }
// ─────────────────────────────────────────────────────────────────
exports.computeRatingStats = async (sellerId) => {
  try {
    const query = isValidObjectId(sellerId)
      ? { $or: [{ seller: new mongoose.Types.ObjectId(sellerId) }, { seller: String(sellerId) }] }
      : { seller: sellerId };

    const reviews = await Review.find(query).select('rating').lean();
    if (!reviews.length) return { avgRating: null, reviewCount: 0 };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / reviews.length) * 10) / 10; // 1 decimal
    return { avgRating: avg, reviewCount: reviews.length };
  } catch {
    return { avgRating: null, reviewCount: 0 };
  }
};
