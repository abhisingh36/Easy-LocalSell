const express = require('express');
const router = express.Router();
const { getListings, getListingById, createListing, updateListing, deleteListing } = require('../controllers/listingController');
const { protect } = require('../utils/authMiddleware');

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', protect, createListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;
