const mongoose = require('mongoose');

// ─── Review Schema ────────────────────────────────────────────────
// A review is left by a BUYER after a transaction completes.
// reviewer  → the User who is leaving the review (buyer)
// seller    → the User being reviewed (seller)
// listing   → which listing the transaction was about
// rating    → 1–5 stars
// text      → written review (optional)
// ─────────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewerName: {
    type: String,
    required: true,
    trim: true,
  },
  reviewerInitials: {
    type: String,
    trim: true,
  },
  seller: {
    type: mongoose.Schema.Types.Mixed,  // ObjectId or string (legacy)
    required: true,
    index: true,
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    default: null,
  },
  listingTitle: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  text: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },
}, {
  timestamps: true,
});

// Prevent a buyer from reviewing the same listing twice
reviewSchema.index({ reviewer: 1, listing: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
