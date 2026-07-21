const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  images: [{
    type: String // base64 strings or URLs
  }],
  // seller can be an ObjectId (for seeded data) or a plain string (for user-posted items)
  seller: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  sellerInitials: {
    type: String
  },
  sellerPhone: {
    type: String
  },
  originalPrice: {
    type: String,
    default: ""
  },
  brand: {
    type: String,
    default: ""
  },
  model: {
    type: String,
    default: ""
  },
  age: {
    type: String,
    default: ""
  },
  colour: {
    type: String,
    default: ""
  },
  warranty: {
    type: String,
    default: ""
  },
  distance: {
    type: Number,
    default: 1.5
  },
  sold: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Listing', listingSchema);
