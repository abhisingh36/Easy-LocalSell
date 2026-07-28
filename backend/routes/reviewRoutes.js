const express = require('express');
const router  = express.Router();
const { getReviewsBySeller, createReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../utils/authMiddleware');

// GET  /api/reviews/seller/:sellerId  → all reviews for a seller (public)
router.get('/seller/:sellerId', getReviewsBySeller);

// POST /api/reviews                   → create a review
router.post('/', protect, createReview);

// DELETE /api/reviews/:id             → delete own review
router.delete('/:id', protect, deleteReview);

module.exports = router;
