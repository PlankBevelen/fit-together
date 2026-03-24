const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    openid: {
      type: String,
      required: true,
      unique: true,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    // User Profile Data
    name: String,
    avatarUrl: String,
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    birthYear: String,
    heightCm: Number,
    weightKg: Number,
    targetWeightKg: Number,
    goal: {
      type: String,
      enum: ['cut', 'bulk', 'maintain'],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
