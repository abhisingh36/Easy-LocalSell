const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { getReels, uploadReel, toggleLikeReel, deleteReel } = require('../controllers/reelController');
const { protect } = require('../utils/authMiddleware');

// Configure Cloudinary Storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'easy_reels',
    resource_type: 'video', // Must be set to 'video' for video files
    allowed_formats: ['mp4', 'mov', 'avi', 'webm']
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Routes
router.route('/')
  .get(getReels)
  .post(protect, upload.single('video'), uploadReel);

router.route('/:id')
  .delete(protect, deleteReel);

router.route('/:id/like')
  .put(protect, toggleLikeReel);

module.exports = router;
