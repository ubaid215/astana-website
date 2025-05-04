const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  }
}, {
  timestamps: true
});

// Improved password hashing with error handling
UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// More robust password comparison
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Add a method to generate verification token
UserSchema.methods.generateVerificationToken = function() {
  this.verificationToken = crypto.randomBytes(20).toString('hex');
  return this.verificationToken;
};

// Add a method to generate password reset token
UserSchema.methods.generatePasswordResetToken = function() {
  this.resetToken = crypto.randomBytes(20).toString('hex');
  this.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
  return this.resetToken;
};

// Handle duplicate email errors
UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});

// Compile model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Debug model
console.log('User model compiled:', User ? 'Yes' : 'No');
console.log('User.findOne:', typeof User.findOne);

module.exports = User;