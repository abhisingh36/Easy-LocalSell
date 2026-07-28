const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: "",
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  location: {
    type: String,
    default: "Hazratganj, Lucknow"
  },
  profileImage: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Pre-save hook to hash the password before saving it to the database
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare candidate password with the stored hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
