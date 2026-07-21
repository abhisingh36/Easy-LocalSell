const express = require('express');
const router  = express.Router();
const { getUserById, getUserListings, updateUserProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../utils/authMiddleware');

// GET /api/users/:id       → profile + stats
router.get('/:id', getUserById);

// GET /api/users/:id/listings → all listings by this seller
router.get('/:id/listings', getUserListings);

// PUT /api/users/:id → update user profile
router.put('/:id', protect, updateUserProfile);

// PUT /api/users/:id/change-password → change password
router.put('/:id/change-password', protect, changePassword);

module.exports = router;
