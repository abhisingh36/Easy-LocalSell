const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: String,
  sellerAvatar: String,
  videoUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  price: {
    type: String,
    default: 'Featured Deal'
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    default: null
  },
  tags: [{
    type: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reel', reelSchema);
